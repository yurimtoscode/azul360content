import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireApiUser } from '@/lib/auth';
import { profileInput } from '@/lib/validation';
import { parseDriveFolder } from '@/lib/drive/folder';
export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await requireApiUser();
  if (!user) return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 });
  if (user.role !== 'ADMIN') return NextResponse.json({ error: 'Apenas administradores editam perfis.' }, { status: 403 });
  const parsed = profileInput.safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ error: 'Campos inválidos.', detail: parsed.error.flatten() }, { status: 400 });
  const { logoUrl, driveFolderId, brandFolderId, ...data } = parsed.data;
  let folder: ReturnType<typeof parseDriveFolder>;
  let brand: ReturnType<typeof parseDriveFolder>;
  try { folder = parseDriveFolder(driveFolderId); brand = parseDriveFolder(brandFolderId); } catch (error) { return NextResponse.json({ error: error instanceof Error ? error.message : 'Link inválido.' }, { status: 400 }); }
  const profile = await db.profile.update({ where: { id: (await params).id }, data: { ...data, logoUrl: logoUrl || null, driveFolderId: folder?.id || null, driveFolderKey: folder?.key || null, brandFolderId: brand?.id || null, brandFolderKey: brand?.key || null } });
  return NextResponse.json(profile);
}
