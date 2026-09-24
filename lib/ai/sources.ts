import 'server-only';
import { db } from '@/lib/db';
import { discoverFeed, parseRss, trustedSource, type Source } from '@/lib/ai/rss';

export type { Source } from '@/lib/ai/rss';
const creditWords = /cr[eé]dito|financia|empresa|empreend|neg[oó]cio|capital de giro|bndes|pronampe|produtiv|investimento/i;
const DAY = 86_400_000;
const BATCH = 6;

async function safeFetch(address: string, homepage: URL) {
  let url = new URL(address);
  for (let redirects = 0; redirects < 3; redirects++) {
    if (!trustedSource(url, homepage)) throw new Error('Link fora do domínio da fonte.');
    const response = await fetch(url, { signal: AbortSignal.timeout(8000), redirect: 'manual',
      headers: { Accept: 'application/rss+xml,application/atom+xml,application/xml,text/xml,text/html' }, cache: 'no-store' });
    if (response.status >= 300 && response.status < 400) {
      const location = response.headers.get('location');
      if (!location) throw new Error('Redirecionamento sem destino.');
      url = new URL(location, url); continue;
    }
    return response;
  }
  throw new Error('Redirecionamentos em excesso.');
}

async function collectOne(portal: { id: string; homepageUrl: string; feedUrl: string | null; name: string }) {
  const checkedAt = new Date();
  try {
    const homepage = new URL(portal.homepageUrl);
    if (homepage.protocol !== 'https:') throw new Error('Site HTTPS obrigatório.');
    let feedUrl = portal.feedUrl;
    if (!feedUrl) {
      const page = await safeFetch(homepage.href, homepage);
      if (!page.ok || !/html/i.test(page.headers.get('content-type') || '')) throw new Error('Página inicial indisponível para localizar o RSS.');
      feedUrl = discoverFeed((await page.text()).slice(0, 600_000), homepage);
      if (!feedUrl) throw new Error('O portal não anuncia um RSS público; requer integração específica.');
    }
    const response = await safeFetch(feedUrl, homepage);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const kind = response.headers.get('content-type') || '';
    if (!/xml|rss/i.test(kind)) throw new Error('Resposta não é RSS/XML.');
    const xml = (await response.text()).slice(0, 1_000_000);
    if (!/<rss\b|<rdf:RDF\b|<feed\b/i.test(xml)) throw new Error('Feed RSS/Atom inválido.');
    const items = parseRss(xml, homepage);
    if (!items.length) throw new Error('Feed sem matérias com URL e data verificáveis.');
    await db.sourceArticle.createMany({ skipDuplicates: true, data: items.map(item => ({
      portalId: portal.id, title: item.title, url: item.url, summary: item.summary,
      publishedAt: new Date(item.publishedAt),
    })) });
    await db.portalSource.update({ where: { id: portal.id }, data: { feedUrl, lastCheckedAt: checkedAt, lastSuccessAt: checkedAt, lastError: null } });
    return { portal: portal.name, count: items.length, ok: true };
  } catch (error) {
    const message = error instanceof Error ? error.message.slice(0, 250) : 'Falha desconhecida';
    await db.portalSource.update({ where: { id: portal.id }, data: { lastCheckedAt: checkedAt, lastError: message } });
    return { portal: portal.name, count: 0, ok: false, error: message };
  }
}

export async function refreshSources(staleOnly = false) {
  const portals = await db.portalSource.findMany({ where: { enabled: true }, orderBy: { name: 'asc' } });
  const selected = staleOnly ? portals.filter(p => !p.lastCheckedAt || Date.now() - p.lastCheckedAt.getTime() >= DAY) : portals;
  const results: Awaited<ReturnType<typeof collectOne>>[] = [];
  for (let index = 0; index < selected.length; index += BATCH) {
    results.push(...await Promise.all(selected.slice(index, index + BATCH).map(collectOne)));
  }
  return results;
}

export async function mineSources(topic: string, maxAgeDays = 90): Promise<Source[]> {
  await refreshSources(true);
  const articles = await db.sourceArticle.findMany({
    where: { publishedAt: { gte: new Date(Date.now() - maxAgeDays * DAY), lte: new Date(Date.now() + DAY) }, portal: { enabled: true } },
    include: { portal: true }, orderBy: { publishedAt: 'desc' }, take: 500,
  });
  const tokens = topic.toLocaleLowerCase('pt-BR').split(/[^\p{L}\p{N}]+/u).filter(word => word.length > 3);
  const score = (article: (typeof articles)[number]) => tokens.reduce((sum, token) => sum +
    (article.title.toLocaleLowerCase('pt-BR').includes(token) ? 3 : article.summary.toLocaleLowerCase('pt-BR').includes(token) ? 1 : 0), 0);
  return articles.filter(item => creditWords.test(item.title + ' ' + item.summary))
    .sort((a, b) => score(b) - score(a) || b.publishedAt.getTime() - a.publishedAt.getTime())
    .slice(0, 10).map(item => ({ title: item.title, url: item.url, summary: item.summary,
      publishedAt: item.publishedAt.toISOString(), publisher: item.portal.name }));
}
