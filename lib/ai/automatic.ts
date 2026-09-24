import type { Profile, Template } from '@prisma/client';
import { sampleCarousel } from '@/lib/carousel';
import { mineSources } from '@/lib/ai/sources';
import { listDrivePhotos } from '@/lib/drive/client';
import { suggestSlides } from '@/lib/ai/provider';

export async function generateAutomatic(topic: string, profile: Profile, template: Template) {
  const cta = profile.ctas[0] || 'Conheça o próximo passo para sua empresa.';
  if (template.kind === 'INSTITUTIONAL' && profile.slug === 'azul360') {
    // Exemplo revisado: adaptação em português de uma frase publicada pela fundação do autor.
    const author = 'NAPOLEON HILL';
    const quote = 'CADA ADVERSIDADE, CADA FRACASSO, CADA DOR CARREGA EM SI A SEMENTE DE UM BENEFÍCIO IGUAL OU MAIOR.';
    let portrait = null;
    if (profile.driveFolderId) {
      try { const photos = await listDrivePhotos(profile); portrait = photos.find(file => file.mimeType === 'image/png' && /napoleon[\s_-]*hill/i.test(file.name)) || null; } catch { /* A frase continua editável; falta a foto autorizada. */ }
    }
    return { title: author, body: quote, objective: 'ESCRITOR', caption: `Uma reflexão de Napoleon Hill sobre perseverança e aprendizado. ${cta}`, sourceUrl: 'https://milled.com/the-napoleon-hill-foundation/napoleon-hills-thought-for-the-day-n9AVtnD3zc4gXxep', sourceDate: '', photoId: portrait?.id || null, pending: portrait ? [] : ['Retrato recortado e autorizado de Napoleon Hill na pasta do Drive'], mode: 'automatic' };
  }
  const sources = await mineSources(topic, template.kind === 'NEWS' ? 7 : 90);
  const source = sources[0];
  if (!source) throw new Error('Nenhuma fonte recente relacionada à pauta foi encontrada nos portais configurados. Para notícia da semana, o limite é de sete dias. Informe outra pauta ou configure fontes RSS autorizadas.');
  const lead = source.title.replace(/[.!?]+$/, '').slice(0, 130);
  const caption = `Fonte: ${source.publisher} (${new Date(source.publishedAt).toLocaleDateString('pt-BR')}). ${source.title} Leia a notícia original e confira as condições aplicáveis antes de decidir sobre crédito empresarial. ${cta}`;
  if (template.kind === 'NEWS' || template.kind === 'CREDIT_EXPLAINER') {
    const slides = sampleCarousel(template.kind, cta);
    slides[0].headline = lead.toUpperCase();
    slides[1].headline = template.kind === 'NEWS' ? 'O QUE FOI\nPUBLICADO?' : 'POR QUE ISSO\nIMPORTA?';
    slides[1].body = `A FONTE PUBLICOU:\n${source.title}`.toUpperCase().slice(0, 450);
    slides[2].headline = 'CRÉDITO EXIGE\nCONTEXTO.';
    slides[2].footer = 'FONTE.\nDATA.\nCRITÉRIOS.';
    slides[3].headline = 'ANTES DE\nDECIDIR.';
    slides[3].body = 'CONFIRA AS CONDIÇÕES NA FONTE ORIGINAL E A SITUAÇÃO REAL DA EMPRESA. NÃO PRESUMA TAXAS, PRAZOS OU ELEGIBILIDADE.';
    slides[4].headline = 'ESTRATÉGIA\nCOMEÇA COM\nANÁLISE.';
    let mode = 'source-draft'; let finalCaption = caption;
    try {
      const suggestion = await suggestSlides(source, topic, profile, template);
      if (suggestion) { suggestion.slides.forEach((slide, index) => { Object.assign(slides[index], slide); }); finalCaption = suggestion.caption; mode = 'ai-draft'; }
    } catch { /* Preserva o rascunho baseado na fonte se o provedor falhar. */ }
    return { title: lead, body: source.title, caption: finalCaption, slides, sourceUrl: source.url, sourceDate: '', publishedAt: source.publishedAt, pending: [...(template.kind === 'NEWS' ? ['Data do acontecimento (diferente da data de publicação)'] : []), 'Fotos do carrossel para revisão'], mode };
  }
  return { title: template.kind === 'TEAM_PHOTO' ? 'VOCÊ TRABALHA.\nNOSSO TIME\nESTRUTURA\nSEU CRÉDITO.' : lead, body: template.kind === 'TEAM_PHOTO' ? 'Pessoas que ajudam empresas a analisar o acesso ao crédito.' : '', caption, sourceUrl: source.url, sourceDate: '', pending: template.kind === 'TEAM_PHOTO' ? ['Foto aprovada da equipe'] : [], mode: 'automatic' };
}
