import assert from 'node:assert/strict';
import { portalCatalog } from '../lib/ai/catalog';
import { discoverFeed, parseRss, trustedSource } from '../lib/ai/rss';

assert.equal(portalCatalog.length, 30);
assert.equal(new Set(portalCatalog.map(portal => portal.slug)).size, 30);
assert.equal(new Set(portalCatalog.map(portal => new URL(portal.homepageUrl).hostname.replace(/^www\d*\./, ''))).size, 30);
const homepage = new URL('https://agenciabrasil.ebc.com.br/economia');
assert.equal(discoverFeed('<link type="application/rss+xml" href="/rss/economia/feed.xml" rel="alternate">', homepage), 'https://agenciabrasil.ebc.com.br/rss/economia/feed.xml');
assert.equal(discoverFeed('<link rel="alternate" type="application/rss+xml" href="http://127.0.0.1/private">', homepage), null);
assert.equal(trustedSource(new URL('https://example.com/'), homepage), false);
const xml = `<rss><channel>
<item><title>Crédito para empresas</title><link>https://agenciabrasil.ebc.com.br/economia/2026/09/credito</link><pubDate>Thu, 24 Sep 2026 10:00:00 GMT</pubDate><description>Fonte original</description></item>
<item><title>Link externo</title><link>https://exemplo-invalido.com/noticia</link><pubDate>Thu, 24 Sep 2026 10:00:00 GMT</pubDate></item>
</channel></rss>`;
assert.equal(parseRss(xml, homepage).length, 1);
console.log('30 publicações distintas, descoberta e validação de RSS OK');
