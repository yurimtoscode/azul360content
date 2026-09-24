import { NextResponse } from 'next/server';
import { randomUUID } from 'node:crypto';
import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import sharp from 'sharp';
import { requireApiUser } from '@/lib/auth';
import { db } from '@/lib/db';
import { downloadDrivePhoto, listDrivePhotos } from '@/lib/drive/client';

async function folder(profileId: string) {
  if (!profileId || profileId.length > 100) throw new Error('Perfil inválido.');
  const profile = await db.profile.findUnique({ where: { id: profileId } });
  if (!profile?.driveFolderId) throw new Error('Este perfil não tem pasta do Drive cadastrada.');
  return profile;
}

export async function GET(request: Request) {
  if (!(await requireApiUser())) return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 });
  try { const profile = await folder(new URL(request.url).searchParams.get('profileId') || ''); return NextResponse.json({ files: await listDrivePhotos(profile) }); }
  catch (error) { return NextResponse.json({ error: error instanceof Error ? error.message : 'Falha ao listar fotos.' }, { status: 400 }); }
}

export async function POST(request: Request) {
  if (!(await requireApiUser())) return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 });
  try {
    const input = await request.json() as { profileId?: string; fileId?: string; authorPortrait?: boolean };
    const profile = await folder(input.profileId || '');
    const file = (await listDrivePhotos(profile)).find(item => item.id === input.fileId);
    if (!file) throw new Error('Escolha uma foto da pasta autorizada do perfil.');
    if (file.size && Number(file.size) > 8_000_000) throw new Error('Foto acima do limite de 8 MB.');
    if (input.authorPortrait && file.mimeType !== 'image/png') throw new Error('O retrato do autor deve ser PNG com transparência.');
    const bytes = await downloadDrivePhoto(profile, file.id, file.resourceKey);
    if (bytes.length > 8_000_000 || bytes.length < 12) throw new Error('Imagem fora do limite de 8 MB.');
    const metadata = await sharp(bytes).metadata();
    const ext = file.mimeType === 'image/png' ? 'png' : file.mimeType === 'image/webp' ? 'webp' : 'jpg';
    if (metadata.format !== (ext === 'jpg' ? 'jpeg' : ext)) throw new Error('Formato real diferente do arquivo cadastrado.');
    if (input.authorPortrait) {
      const stats = await sharp(bytes).stats();
      if (!metadata.hasAlpha || stats.channels.at(-1)?.min === 255) throw new Error('Envie no Drive um retrato recortado com fundo transparente.');
    }
    const name = `${randomUUID()}.${ext}`;
    const directory = join(process.cwd(), 'public', 'uploads');
    await mkdir(directory, { recursive: true });
    await writeFile(join(directory, name), bytes, { flag: 'wx' });
    const url = `/uploads/${name}`;
    await db.mediaAsset.create({ data: { url, origin: 'google_drive', name: file.name.slice(0, 200), picturedName: input.authorPortrait ? file.name.replace(/\.[^.]+$/, '').slice(0, 200) : null, approved: true, width: metadata.width, height: metadata.height } });
    return NextResponse.json({ url, name: file.name });
  } catch (error) { return NextResponse.json({ error: error instanceof Error ? error.message : 'Falha ao importar foto.' }, { status: 400 }); }
}
