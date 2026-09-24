import { PrismaClient, TemplateKind } from '@prisma/client';
import { hash } from 'bcryptjs';
import { portalCatalog } from '../lib/ai/catalog';

const prisma = new PrismaClient();

async function main() {
  const email = process.env.SEED_ADMIN_EMAIL;
  const password = process.env.SEED_ADMIN_PASSWORD;
  if (!email || !password || password.length < 12) {
    throw new Error('Defina SEED_ADMIN_EMAIL e SEED_ADMIN_PASSWORD (mínimo 12 caracteres).');
  }
  await prisma.user.upsert({
    where: { email }, update: { name: 'Administrador', role: 'ADMIN' },
    create: { email, name: 'Administrador', role: 'ADMIN', passwordHash: await hash(password, 12) },
  });
  const profiles = [
    { slug: 'azul360', name: 'Azul360', audience: 'Empresários', voice: 'Clara, consultiva e objetiva', ctas: ['Comente AZUL e entenda como sua empresa está sendo vista pelos bancos.'], logoUrl: '/brand-assets/azul360-official.png', fontHeading: 'Gilroy Bold', fontBody: 'Gilroy Regular' },
    { slug: 'evellyn', name: 'Evellyn', audience: 'Empresárias e empresários', voice: 'Próxima, segura e humana', ctas: [] },
    { slug: 'allan', name: 'Allan', audience: 'Empresários', voice: 'Conselho direto com autoridade', ctas: ['Comente AZUL e descubra se sua empresa está preparada para acessar crédito.'] },
    { slug: 'thassio', name: 'Thássio', audience: 'Profissionais de crédito', voice: 'Estratégica e didática', ctas: [] },
  ];
  for (const profile of profiles) {
    await prisma.profile.upsert({ where: { slug: profile.slug }, update: {}, create: profile });
  }
  const templates: { kind: TemplateKind; name: string; fields: string[]; width?: number; height?: number }[] = [
    { kind: 'INSTITUTIONAL', name: 'Frase institucional', fields: ['title', 'body', 'objective', 'photoUrl', 'caption'] },
    { kind: 'NEWS', name: 'Notícia no crédito · carrossel', fields: ['slides', 'caption', 'sourceUrl', 'sourceDate'] },
    { kind: 'TEAM_PHOTO', name: 'Foto do time', fields: ['title', 'body', 'caption', 'photoUrl'] },
    { kind: 'CREDIT_EXPLAINER', name: 'Conteúdo rico · carrossel', fields: ['slides', 'caption', 'sourceUrl'] },
    { kind: 'VIDEO_THUMB', name: 'Thumb de vídeo', fields: ['title', 'photoUrl'], width: 1080, height: 1920 },
  ];
  for (const item of templates) {
    await prisma.template.upsert({ where: { kind: item.kind }, update: { name: item.name, fields: item.fields, version: item.kind === 'NEWS' || item.kind === 'CREDIT_EXPLAINER' ? 2 : 1 }, create: { ...item, version: item.kind === 'NEWS' || item.kind === 'CREDIT_EXPLAINER' ? 2 : 1 } });
  }
  // Os canais repetidos da versão anterior precisam sair antes dos novos
  // upserts, para liberar URLs únicas como o feed nacional do Sebrae.
  await prisma.portalSource.deleteMany({ where: { OR: [
    { slug: { startsWith: 'sebrae-' } }, { slug: 'agencia-sebrae' }, { slug: 'mdic' },
    { slug: { in: ['uol', 'g1', 'o-globo'] } },
  ] } });
  for (const portal of portalCatalog) {
    await prisma.portalSource.upsert({ where: { slug: portal.slug },
      update: { name: portal.name, homepageUrl: portal.homepageUrl, ...('feedUrl' in portal ? { feedUrl: portal.feedUrl } : {}) },
      create: { name: portal.name, slug: portal.slug, homepageUrl: portal.homepageUrl, feedUrl: 'feedUrl' in portal ? portal.feedUrl : null },
    });
  }
}

main().finally(() => prisma.$disconnect());
