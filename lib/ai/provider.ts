import 'server-only';
import { z } from 'zod';
import type { Profile, Template } from '@prisma/client';
import type { Source } from '@/lib/ai/rss';

const outputSchema = z.object({ caption: z.string().max(5000), slides: z.array(z.object({ headline: z.string().max(180), body: z.string().max(1200), footer: z.string().max(500), accent: z.string().max(180) })).length(5) });
export async function suggestSlides(source: Source, topic: string, profile: Profile, template: Template) {
  const token = process.env.OPENAI_API_KEY;
  if (!token || !process.env.OPENAI_TEXT_MODEL) return null;
  const schema = { type: 'object', additionalProperties: false, required: ['caption', 'slides'], properties: {
    caption: { type: 'string' }, slides: { type: 'array', minItems: 5, maxItems: 5, items: { type: 'object', additionalProperties: false, required: ['headline', 'body', 'footer', 'accent'], properties: { headline: { type: 'string' }, body: { type: 'string' }, footer: { type: 'string' }, accent: { type: 'string' } } } },
  } };
  const response = await fetch('https://api.openai.com/v1/responses', { method: 'POST', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }, signal: AbortSignal.timeout(25000), body: JSON.stringify({
    model: process.env.OPENAI_TEXT_MODEL, store: false,
    instructions: 'Escreva em português brasileiro claro para empresários. Produza cinco páginas, com frases curtas adequadas ao template Azul360. Use SOMENTE o título e o resumo fornecidos como evidência. Não acrescente números, taxas, prazos, nomes de linhas, condições, eventos ou elegibilidade não escritos na fonte. A data fornecida é de publicação, não necessariamente do acontecimento. Corpo e legenda não devem afirmar algo que a fonte não confirma. Termine com um CTA permitido. Se a fonte não contiver detalhes, use perguntas e orientações para conferir a notícia original. Texto editável, sem instruções para geração de imagem.',
    input: JSON.stringify({ model: template.kind, topic, audience: profile.audience, voice: profile.voice, allowedCtas: profile.ctas, source }),
    text: { format: { type: 'json_schema', name: 'azul360_slides', strict: true, schema } },
  }) });
  if (!response.ok) throw new Error(`Serviço de redação indisponível (${response.status}).`);
  const data = await response.json() as { output?: { content?: { type?: string; text?: string }[] }[] };
  const text = data.output?.flatMap(item => item.content || []).find(item => item.type === 'output_text')?.text;
  if (!text) throw new Error('Resposta vazia do serviço de redação.');
  return outputSchema.parse(JSON.parse(text));
}
