import type { TemplateKind } from '@prisma/client';

export type CarouselSlide = {
  headline: string;
  body: string;
  footer: string;
  accent: string;
  photoUrl: string;
};

export function isCarousel(kind: TemplateKind) {
  return kind === 'NEWS' || kind === 'CREDIT_EXPLAINER';
}

export function sampleCarousel(kind: TemplateKind, cta = ''): CarouselSlide[] {
  const topic = kind === 'NEWS' ? 'A NOTÍCIA DA SEMANA\nNO CRÉDITO.' : 'SUA EMPRESA TEM\nUM PRÓXIMO PASSO.';
  return [
    { headline: topic, body: '', footer: '', accent: '', photoUrl: '/reference/foto-equipe.jpg' },
    { headline: 'Cada\ndetalhe\nimporta.', body: 'O QUE MUDOU?\nQUAL É A FONTE?\nCOMO ISSO AFETA A EMPRESA?', footer: '', accent: 'importa.', photoUrl: '' },
    { headline: 'Objetivo. Prazo.\nHistórico.', body: '', footer: 'Estrutura.\nDocumentação.', accent: '', photoUrl: '/reference/foto-reuniao.jpg' },
    { headline: 'Entenda\no cenário.', body: 'ANALISE OS CRITÉRIOS, O MOMENTO DA EMPRESA E AS INFORMAÇÕES CONFIRMADAS ANTES DE DECIDIR.', footer: '', accent: 'Entenda\no cenário.', photoUrl: '' },
    { headline: 'Converse com\nnossos gerentes.', body: (cta || 'COMENTE AZUL E ENTENDA O PRÓXIMO PASSO DA SUA EMPRESA.').toUpperCase(), footer: '', accent: '', photoUrl: '/reference/foto-evento.jpg' },
  ];
}

export function parseCarousel(value: unknown): CarouselSlide[] | null {
  if (!Array.isArray(value) || value.length !== 5) return null;
  if (!value.every(slide => slide && typeof slide === 'object' &&
    ['headline', 'body', 'footer', 'accent', 'photoUrl'].every(field => typeof slide[field] === 'string'))) return null;
  return value as CarouselSlide[];
}
