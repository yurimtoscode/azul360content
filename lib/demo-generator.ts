import type { Profile, Template } from '@prisma/client';

// Substituível por lib/ai/provider.ts. Não pesquisa fatos nem simula verificação.
export function generateDemo(topic: string, profile: Profile, template: Template) {
  const clean = topic.trim().replace(/\s+/g, ' ');
  const cta = profile.ctas[0] || '';
  switch (template.kind) {
    case 'INSTITUTIONAL': return { title: clean, body: 'Planejar com clareza muda o próximo passo da sua empresa.', caption: `${clean}. Uma decisão melhor começa com uma visão clara do cenário. ${cta}`.trim() };
    case 'NEWS': return { title: clean, body: 'Adicione um resumo confirmado da notícia e confira a fonte antes de aprovar.', caption: 'Resumo demonstrativo. Inclua fonte, data e fatos confirmados antes da revisão.' };
    case 'TEAM_PHOTO': return { title: clean, body: 'Pessoas que ajudam empresas a enxergar novos caminhos.', caption: `Um pouco de quem faz esse trabalho acontecer. ${cta}`.trim() };
    case 'CREDIT_EXPLAINER': return { title: clean, body: 'O que é\nComo funciona\nPara quem pode fazer sentido\nO que conferir antes de solicitar', caption: `Entenda o tema ${clean} e confira os critérios atualizados em uma fonte oficial. ${cta}`.trim() };
    case 'VIDEO_THUMB': return { title: clean, body: '', caption: '' };
  }
}
