import 'server-only';
import { importPKCS8, SignJWT } from 'jose';

type Folder = { driveFolderId: string | null; driveFolderKey: string | null };
export type DrivePhoto = { id: string; name: string; mimeType: string; size?: string; thumbnailLink?: string; resourceKey?: string };
export type BrandFile = DrivePhoto & { webViewLink?: string };

async function auth() {
  const raw = process.env.GOOGLE_DRIVE_SERVICE_ACCOUNT_JSON;
  if (raw) {
    const account = JSON.parse(raw) as { client_email: string; private_key: string; token_uri?: string };
    if (!account.client_email || !account.private_key) throw new Error('Credenciais do Drive incompletas.');
    const key = await importPKCS8(account.private_key, 'RS256');
    const assertion = await new SignJWT({ scope: 'https://www.googleapis.com/auth/drive.readonly' })
      .setProtectedHeader({ alg: 'RS256', typ: 'JWT' }).setIssuer(account.client_email)
      .setAudience('https://oauth2.googleapis.com/token').setIssuedAt().setExpirationTime('1h').sign(key);
    const response = await fetch('https://oauth2.googleapis.com/token', { method: 'POST', body: new URLSearchParams({ grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer', assertion }), signal: AbortSignal.timeout(10000) });
    if (!response.ok) throw new Error('Conta de serviço sem acesso ao Drive.');
    const data = await response.json() as { access_token?: string };
    if (!data.access_token) throw new Error('Falha na autenticação do Drive.');
    return { token: data.access_token, key: '' };
  }
  const apiKey = process.env.GOOGLE_DRIVE_API_KEY;
  if (!apiKey) throw new Error('Configure GOOGLE_DRIVE_API_KEY para pasta pública ou GOOGLE_DRIVE_SERVICE_ACCOUNT_JSON para pasta compartilhada com a conta de serviço.');
  return { token: '', key: apiKey };
}

async function driveFetch(path: string, folder: Folder, params: Record<string,string> = {}, fileKey?: { id: string; key: string }) {
  const { token, key } = await auth();
  const url = new URL(`https://www.googleapis.com/drive/v3/${path}`);
  Object.entries(params).forEach(([name, value]) => url.searchParams.set(name, value));
  if (key) url.searchParams.set('key', key);
  const headers: Record<string,string> = {};
  if (token) headers.Authorization = `Bearer ${token}`;
  const keys = [folder.driveFolderId && folder.driveFolderKey ? `${folder.driveFolderId}/${folder.driveFolderKey}` : '', fileKey ? `${fileKey.id}/${fileKey.key}` : ''].filter(Boolean);
  if (keys.length) headers['X-Goog-Drive-Resource-Keys'] = keys.join(',');
  const response = await fetch(url, { headers, signal: AbortSignal.timeout(12000), cache: 'no-store' });
  if (!response.ok) throw new Error(`Google Drive recusou o acesso (${response.status}). Confira o compartilhamento da pasta e as credenciais do servidor.`);
  return response;
}

export async function listDrivePhotos(folder: Folder): Promise<DrivePhoto[]> {
  if (!folder.driveFolderId) throw new Error('Cadastre o link da pasta no perfil.');
  const files: DrivePhoto[] = [];
  let pageToken = '';
  for (let page = 0; page < 3; page++) {
    const response = await driveFetch('files', folder, {
      q: `'${folder.driveFolderId}' in parents and trashed = false and (mimeType = 'image/png' or mimeType = 'image/jpeg' or mimeType = 'image/webp')`,
      fields: 'nextPageToken,files(id,name,mimeType,size,thumbnailLink,resourceKey)', pageSize: '100',
      supportsAllDrives: 'true', includeItemsFromAllDrives: 'true', ...(pageToken ? { pageToken } : {}),
    });
    const data = await response.json() as { files?: DrivePhoto[]; nextPageToken?: string };
    files.push(...(data.files || []).filter(file => file.id && file.name));
    pageToken = data.nextPageToken || '';
    if (!pageToken) break;
  }
  return files;
}

export async function listBrandFiles(profile: { brandFolderId: string | null; brandFolderKey: string | null }): Promise<BrandFile[]> {
  if (!profile.brandFolderId) throw new Error('Cadastre o link da pasta de identidade visual no perfil.');
  const folder = { driveFolderId: profile.brandFolderId, driveFolderKey: profile.brandFolderKey };
  const files: BrandFile[] = [];
  let pageToken = '';
  for (let page = 0; page < 3; page++) {
    const response = await driveFetch('files', folder, {
      q: `'${folder.driveFolderId}' in parents and trashed = false`,
      fields: 'nextPageToken,files(id,name,mimeType,size,webViewLink)', pageSize: '100',
      supportsAllDrives: 'true', includeItemsFromAllDrives: 'true', ...(pageToken ? { pageToken } : {}),
    });
    const data = await response.json() as { files?: BrandFile[]; nextPageToken?: string };
    files.push(...(data.files || []).filter(file => file.id && file.name));
    pageToken = data.nextPageToken || '';
    if (!pageToken) break;
  }
  return files;
}

export async function downloadDrivePhoto(folder: Folder, fileId: string, resourceKey?: string) {
  if (!/^[a-zA-Z0-9_-]+$/.test(fileId)) throw new Error('Arquivo inválido.');
  const response = await driveFetch(`files/${fileId}`, folder, { alt: 'media', supportsAllDrives: 'true' }, resourceKey && /^[a-zA-Z0-9_-]+$/.test(resourceKey) ? { id: fileId, key: resourceKey } : undefined);
  return new Uint8Array(await response.arrayBuffer());
}
