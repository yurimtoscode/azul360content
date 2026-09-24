import { NextResponse } from 'next/server';
import { requireApiUser } from '@/lib/auth';
import { db } from '@/lib/db';
import { listBrandFiles } from '@/lib/drive/client';

export async function GET(request: Request) {
  if (!(await requireApiUser())) return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 });
  const id = new URL(request.url).searchParams.get('profileId') || '';
  if (!id || id.length > 100) return NextResponse.json({ error: 'Perfil inválido.' }, { status: 400 });
  try {
    const profile = await db.profile.findUnique({ where: { id } });
    if (!profile) return NextResponse.json({ error: 'Perfil não encontrado.' }, { status: 404 });
    const files = await listBrandFiles(profile);
    return NextResponse.json({ files: files.map(({ id, name, mimeType, webViewLink }) => ({ id, name, mimeType, webViewLink })) });
  } catch (error) { return NextResponse.json({ error: error instanceof Error ? error.message : 'Falha ao acessar materiais da marca.' }, { status: 400 }); }
}
