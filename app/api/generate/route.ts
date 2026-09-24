import { NextResponse } from 'next/server';
import { requireApiUser } from '@/lib/auth';
import { db } from '@/lib/db';
import { generateAutomatic } from '@/lib/ai/automatic';

export async function POST(request: Request) {
  if (!(await requireApiUser())) return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 });
  const { topic, profileId, templateId } = await request.json();
  if (typeof topic !== 'string' || topic.length > 250) return NextResponse.json({ error: 'Pauta inválida.' }, { status: 400 });
  const [profile, template] = await Promise.all([db.profile.findUnique({ where: { id: profileId } }), db.template.findUnique({ where: { id: templateId } })]);
  if (!profile || !template) return NextResponse.json({ error: 'Perfil ou modelo não encontrado.' }, { status: 404 });
  try { return NextResponse.json(await generateAutomatic(topic.trim(), profile, template)); }
  catch (error) { return NextResponse.json({ error: error instanceof Error ? error.message : 'Não foi possível consultar as fontes.' }, { status: 503 }); }
}
