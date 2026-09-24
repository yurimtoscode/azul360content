import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireApiUser } from '@/lib/auth';
import { contentInput } from '@/lib/validation';
import { isCarousel } from '@/lib/carousel';
import { Prisma } from '@prisma/client';
type Context = { params: Promise<{ id: string }> };
export async function GET(_request: Request, { params }: Context) {
  if (!(await requireApiUser())) return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 });
  const content = await db.content.findUnique({ where: { id: (await params).id }, include: { profile: true, template: true, revisions: { orderBy: { version: 'desc' } }, events: { orderBy: { createdAt: 'desc' }, include: { user: { select: { name: true } } } } } });
  return content ? NextResponse.json(content) : NextResponse.json({ error: 'Não encontrado.' }, { status: 404 });
}
export async function PUT(request: Request, { params }: Context) {
  const user = await requireApiUser();
  if (!user) return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 });
  const id = (await params).id;
  const parsed = contentInput.safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ error: 'Campos inválidos.', detail: parsed.error.flatten() }, { status: 400 });
  const original = await db.content.findUnique({ where: { id } });
  if (!original) return NextResponse.json({ error: 'Não encontrado.' }, { status: 404 });
  if (['SCHEDULED', 'PUBLISHED'].includes(original.status)) return NextResponse.json({ error: 'Conteúdo agendado ou publicado não pode ser editado.' }, { status: 409 });
  const template = await db.template.findUnique({ where: { id: parsed.data.templateId } });
  if (!template || (isCarousel(template.kind) && !parsed.data.slides)) return NextResponse.json({ error: 'Preencha os cinco slides do carrossel.' }, { status: 400 });
  if (template.kind === 'INSTITUTIONAL' && (await db.profile.findUnique({ where: { id: parsed.data.profileId } }))?.slug === 'azul360' && (!parsed.data.title.trim() || !parsed.data.body.trim() || !parsed.data.objective.trim() || !parsed.data.photoUrl)) return NextResponse.json({ error: 'Informe frase, nome, ocupação e foto autorizada do autor.' }, { status: 400 });
  const { sourceDate, sourceUrl, photoUrl, slides, ...fields } = parsed.data;
  const content = await db.content.update({ where: { id }, data: { ...fields, sourceDate: sourceDate ? new Date(sourceDate) : null, sourceUrl: sourceUrl || null, photoUrl: photoUrl || null,
    slides: slides ?? Prisma.DbNull,
    status: 'DRAFT', version: { increment: 1 }, revisions: { create: { version: original.version + 1, snapshot: parsed.data } }, events: { create: { userId: user.id, action: 'EDITED' } } } });
  return NextResponse.json({ id: content.id, version: content.version });
}
