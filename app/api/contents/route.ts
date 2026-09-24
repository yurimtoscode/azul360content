import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { Prisma } from '@prisma/client';
import { isCarousel } from '@/lib/carousel';
import { requireApiUser } from '@/lib/auth';
import { contentInput } from '@/lib/validation';

export async function GET() {
  if (!(await requireApiUser())) return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 });
  return NextResponse.json(await db.content.findMany({ include: { profile: true, template: true }, orderBy: { updatedAt: 'desc' } }));
}
export async function POST(request: Request) {
  const user = await requireApiUser();
  if (!user) return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 });
  const parsed = contentInput.safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ error: 'Campos inválidos.', detail: parsed.error.flatten() }, { status: 400 });
  const template = await db.template.findUnique({ where: { id: parsed.data.templateId } });
  if (!template || (isCarousel(template.kind) && !parsed.data.slides)) return NextResponse.json({ error: 'Preencha os cinco slides do carrossel.' }, { status: 400 });
  if (template.kind === 'INSTITUTIONAL' && (await db.profile.findUnique({ where: { id: parsed.data.profileId } }))?.slug === 'azul360' && (!parsed.data.title.trim() || !parsed.data.body.trim() || !parsed.data.objective.trim() || !parsed.data.photoUrl)) return NextResponse.json({ error: 'Informe frase, nome, ocupação e foto autorizada do autor.' }, { status: 400 });
  const { sourceDate, sourceUrl, photoUrl, slides, ...fields } = parsed.data;
  const content = await db.content.create({ data: { ...fields, authorId: user.id, sourceDate: sourceDate ? new Date(sourceDate) : null, sourceUrl: sourceUrl || null, photoUrl: photoUrl || null, slides: slides ?? Prisma.DbNull,
    revisions: { create: { version: 1, snapshot: parsed.data } }, events: { create: { userId: user.id, action: 'CREATED' } } } });
  return NextResponse.json({ id: content.id }, { status: 201 });
}
