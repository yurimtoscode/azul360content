export function parseDriveFolder(value: string): { id: string; key: string | null } | null {
  if (!value.trim()) return null;
  try {
    const url = new URL(value.trim());
    if (url.protocol !== 'https:' || !['drive.google.com', 'www.drive.google.com'].includes(url.hostname)) throw new Error('Link do Drive inválido.');
    const id = url.pathname.match(/^\/drive\/(?:u\/\d+\/)?folders\/([a-zA-Z0-9_-]+)\/?$/)?.[1];
    if (!id) throw new Error('Cole o link da pasta, não de um arquivo.');
    const key = url.searchParams.get('resourcekey');
    if (key && !/^[a-zA-Z0-9_-]{1,200}$/.test(key)) throw new Error('Chave do link inválida.');
    return { id, key };
  } catch (error) {
    if (error instanceof Error && error.message !== 'Invalid URL') throw error;
    throw new Error('Cole um link de pasta do Google Drive.');
  }
}

export function folderLink(id: string | null, key?: string | null) {
  return id ? `https://drive.google.com/drive/folders/${id}${key ? `?resourcekey=${key}` : ''}` : '';
}
