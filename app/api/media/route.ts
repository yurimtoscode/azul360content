import { NextResponse } from 'next/server';
import { requireApiUser } from '@/lib/auth';
import { db } from '@/lib/db';
import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { randomUUID } from 'node:crypto';
import sharp from 'sharp';
export async function POST(request: Request) {
  const user = await requireApiUser();
  if (!user) return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 });
  const form = await request.formData();
  const file = form.get('file');
  const purpose = form.get('purpose');
  if (!(file instanceof File) || !['logo', 'photo', 'authorPortrait'].includes(String(purpose))) return NextResponse.json({ error: 'Arquivo ou finalidade inválida.' }, { status: 400 });
  if (purpose === 'logo' && user.role !== 'ADMIN') return NextResponse.json({ error: 'Apenas administradores enviam logos.' }, { status: 403 });
  if (file.size > 8_000_000 || file.size < 12) return NextResponse.json({ error: 'Imagem fora do limite de 8 MB.' }, { status: 400 });
  const bytes = new Uint8Array(await file.arrayBuffer());
  const png = bytes[0] === 137 && bytes[1] === 80 && bytes[2] === 78 && bytes[3] === 71;
  const jpeg = bytes[0] === 255 && bytes[1] === 216 && bytes[2] === 255;
  const webp = String.fromCharCode(...bytes.slice(0, 4)) === 'RIFF' && String.fromCharCode(...bytes.slice(8, 12)) === 'WEBP';
  const ext = png ? 'png' : jpeg ? 'jpg' : webp ? 'webp' : null;
  if (!ext) return NextResponse.json({ error: 'Envie PNG, JPEG ou WebP.' }, { status: 400 });
  if (purpose === 'authorPortrait') {
    if (!png) return NextResponse.json({ error: 'A foto do autor deve ser PNG com fundo transparente.' }, { status: 400 });
    try {
      const metadata = await sharp(bytes).metadata();
      const stats = await sharp(bytes).stats();
      if (!metadata.hasAlpha || stats.channels.at(-1)?.min === 255) return NextResponse.json({ error: 'Remova o fundo do retrato antes de enviar o PNG.' }, { status: 400 });
    } catch { return NextResponse.json({ error: 'PNG do autor inválido.' }, { status: 400 }); }
  }
  const name = `${randomUUID()}.${ext}`;
  const directory = join(process.cwd(), 'public', 'uploads');
  await mkdir(directory, { recursive: true });
  await writeFile(join(directory, name), bytes, { flag: 'wx' });
  const url = `/uploads/${name}`;
  await db.mediaAsset.create({ data: { url, origin: 'local', name: file.name.slice(0, 200), approved: purpose === 'logo' } });
  return NextResponse.json({ url });
}
