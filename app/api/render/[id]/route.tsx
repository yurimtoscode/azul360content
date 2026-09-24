import { NextResponse } from 'next/server';
import { chromium } from 'playwright';
import chromiumBinary from '@sparticuz/chromium';
import JSZip from 'jszip';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { db } from '@/lib/db';
import { requireApiUser } from '@/lib/auth';
import { artworkMarkup, artworkCSS } from '@/components/templates/Artwork';
import { carouselMarkup, carouselCSS } from '@/components/templates/CarouselArtwork';
import { isCarousel, parseCarousel } from '@/lib/carousel';

async function inlineImage(url: string | null) {
  if (!url || !/^\/(uploads|reference|brand-assets)\/[a-zA-Z0-9_.-]+$/.test(url)) return null;
  const bytes = await readFile(join(process.cwd(), 'public', url));
  const mime = url.endsWith('.png') ? 'image/png' : url.endsWith('.webp') ? 'image/webp' : 'image/jpeg';
  return `data:${mime};base64,${bytes.toString('base64')}`;
}
async function fontCSS() {
  const fonts = [['Regular', 400], ['SemiBold', 600], ['Bold', 700]] as const;
  const rules = await Promise.all(fonts.map(async ([name, weight]) => {
    try { const bytes = await readFile(join(process.cwd(), 'public', 'fonts', `Gilroy-${name}.ttf`));
      return `@font-face{font-family:Gilroy;src:url(data:font/ttf;base64,${bytes.toString('base64')}) format('truetype');font-weight:${weight}}`;
    } catch { return ''; }
  }));
  return rules.join('');
}
export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await requireApiUser())) return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 });
  const content = await db.content.findUnique({ where: { id: (await params).id }, include: { profile: true, template: true } });
  if (!content) return NextResponse.json({ error: 'Não encontrado.' }, { status: 404 });
  if (content.profile.slug === 'azul360' && content.template.kind === 'INSTITUTIONAL' && (!content.title.trim() || !content.body.trim() || !content.objective.trim() || !content.photoUrl)) return NextResponse.json({ error: 'A frase precisa de foto, texto, nome e ocupação antes da exportação.' }, { status: 400 });
  const carousel = isCarousel(content.template.kind);
  const structuredSlides = carousel ? parseCarousel(content.slides) : null;
  if (carousel && !structuredSlides) return NextResponse.json({ error: 'Abra e salve a peça no novo editor de carrossel antes de exportar.' }, { status: 409 });
  try {
    const width = content.template.width, height = content.template.height;
    const pages = carousel ? structuredSlides! : [null];
    const logoDarkSrc = await inlineImage(content.profile.logoUrl);
    const logoLightSrc = content.profile.slug === 'azul360' ? await inlineImage('/brand-assets/azul360-blue-reference.png') : logoDarkSrc;
    const browser = await chromium.launch(process.platform === 'linux'
      ? { headless: true, executablePath: process.env.AZUL_CHROMIUM_PATH || await chromiumBinary.executablePath(), args: chromiumBinary.args }
      : { headless: true });
    try {
      const page = await browser.newPage({ viewport: { width, height }, deviceScaleFactor: 1 });
      const fonts = await fontCSS();
      const zip = new JSZip();
      for (let i = 0; i < pages.length; i++) {
        const slide = pages[i];
        const html = slide
          ? carouselMarkup({ profile: content.profile, slide, index: i, photoSrc: await inlineImage(slide.photoUrl), logoDarkSrc, logoLightSrc })
          : artworkMarkup({ profile: content.profile, kind: content.template.kind, content: { ...content, sourceDate: content.sourceDate?.toISOString() }, logoSrc: logoDarkSrc, logoLightSrc, photoSrc: await inlineImage(content.photoUrl), quoteBaseSrc: content.profile.slug === 'azul360' && content.template.kind === 'INSTITUTIONAL' ? await inlineImage('/reference/modelo-frase-base.png') : null });
        await page.setContent(`<!doctype html><html><head><meta charset="utf-8"><style>html,body{margin:0;padding:0}${artworkCSS}${carouselCSS}${fonts}</style></head><body>${html}</body></html>`, { waitUntil: 'load' });
        await page.evaluate(() => document.fonts.ready);
        const png = await page.screenshot({ type: 'png' });
        if (pages.length === 1) return new NextResponse(new Uint8Array(png), { headers: { 'Content-Type': 'image/png', 'Content-Disposition': `attachment; filename="azul360-${content.id}.png"`, 'Cache-Control': 'no-store' } });
        zip.file(`slide-${String(i + 1).padStart(2, '0')}.png`, png);
      }
      const archive = await zip.generateAsync({ type: 'uint8array' });
      return new NextResponse(new Uint8Array(archive), { headers: { 'Content-Type': 'application/zip', 'Content-Disposition': `attachment; filename="azul360-${content.id}-slides.zip"`, 'Cache-Control': 'no-store' } });
    } finally { await browser.close(); }
  } catch (error) {
    console.error('Falha na exportação:', error);
    return NextResponse.json({ error: 'Falha ao exportar. Confira o Chromium e os arquivos de mídia conforme o README.' }, { status: 500 });
  }
}
