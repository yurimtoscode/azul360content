export type Source = { title: string; url: string; publishedAt: string; summary: string; publisher: string };
export function trustedSource(url: URL, homepage: URL) {
  if (url.protocol !== 'https:' || url.username || url.password || url.port) return false;
  const normalize = (host: string) => host.replace(/^www\d*\./, '');
  const host = normalize(url.hostname), owner = normalize(homepage.hostname);
  return host === owner || host.endsWith(`.${owner}`);
}

function decode(raw: string) { return raw.replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1').replace(/<[^>]+>/g, ' ').replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#39;|&apos;/g, "'").replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/\s+/g, ' ').trim(); }
function field(item: string, tag: string) { return decode(item.match(new RegExp(`<${tag}(?:\\s[^>]*)?>([\\s\\S]*?)<\\/${tag}>`, 'i'))?.[1] || ''); }
export function discoverFeed(html: string, homepage: URL) {
  for (const tag of html.match(/<link\b[^>]*>/gi) || []) {
    const attrs = Object.fromEntries([...tag.matchAll(/([\w-]+)\s*=\s*(["'])(.*?)\2/g)].map(match => [match[1].toLowerCase(), match[3]]));
    if (!attrs.rel?.toLowerCase().split(/\s+/).includes('alternate') || !/rss|atom|xml/i.test(attrs.type || '') || !attrs.href) continue;
    try { const url = new URL(attrs.href.replace(/&amp;/g, '&'), homepage); if (trustedSource(url, homepage)) return url.href; } catch { /* ignora link inválido */ }
  }
  return null;
}
export function parseRss(xml: string, homepage: URL): Source[] {
  const rss = xml.match(/<item\b[^>]*>[\s\S]*?<\/item>/gi) || [];
  const atom = xml.match(/<entry\b[^>]*>[\s\S]*?<\/entry>/gi) || [];
  return [...rss, ...atom].slice(0, 80).map(item => {
    const url = item.startsWith('<entry') ? item.match(/<link\s+[^>]*href=["']([^"']+)["']/i)?.[1] || '' : field(item, 'link');
    const title = field(item, 'title'); const date = field(item, 'pubDate') || field(item, 'published') || field(item, 'updated');
    try { const parsed = new URL(url); if (!trustedSource(parsed, homepage) || !title || !date || Number.isNaN(Date.parse(date))) return null;
      return { title, url: parsed.href, publishedAt: new Date(date).toISOString(), summary: (field(item, 'description') || field(item, 'summary')).slice(0, 450), publisher: parsed.hostname };
    } catch { return null; }
  }).filter((item): item is Source => item !== null);
}
