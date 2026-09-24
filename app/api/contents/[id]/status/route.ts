import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireApiUser } from '@/lib/auth';
import type { ContentStatus } from '@prisma/client';
import { isCarousel, parseCarousel } from '@/lib/carousel';
const transitions: Record<ContentStatus, ContentStatus[]> = {
  DRAFT: ['IN_REVIEW'], IN_REVIEW: ['APPROVED', 'REJECTED'], REJECTED: ['DRAFT'],
  APPROVED: [], SCHEDULED: [], PUBLISHED: [], FAILED: [],
};
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await requireApiUser();
  if (!user) return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 });
  const { status } = await request.json();
  const id = (await params).id;
  const content = await db.content.findUnique({ where: { id }, include: { template: true, profile: true } });
  if (!content) return NextResponse.json({ error: 'Não encontrado.' }, { status: 404 });
  if (!transitions[content.status].includes(status)) return NextResponse.json({ error: 'Transição inválida.' }, { status: 409 });
  if (status === 'APPROVED' && content.template.kind === 'NEWS' && (!content.sourceUrl || !content.sourceDate)) return NextResponse.json({ error: 'Notícia precisa de URL da fonte e data do fato.' }, { status: 400 });
  if (status === 'APPROVED' && !content.profile.logoUrl) return NextResponse.json({ error: 'Cadastre a logo oficial do perfil antes da aprovação.' }, { status: 400 });
  if (status === 'APPROVED' && isCarousel(content.template.kind)) {
    const slides = parseCarousel(content.slides);
    if (!slides || [0, 2, 4].some(index => !slides[index].photoUrl)) return NextResponse.json({ error: 'O carrossel exige cinco páginas e fotos nas páginas 1, 3 e 5.' }, { status: 400 });
  }
  const updated = await db.content.update({ where: { id }, data: { status, events: { create: { userId: user.id, action: status } } } });
  return NextResponse.json({ status: updated.status });
}
