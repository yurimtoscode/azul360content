import { chromium } from 'playwright';
import chromiumBinary from '@sparticuz/chromium';
import { readFile, mkdir } from 'node:fs/promises';
import { carouselMarkup, carouselCSS } from '../components/templates/CarouselArtwork';
import { sampleCarousel } from '../lib/carousel';

async function inline(path: string) {
  const bytes = await readFile(`public${path}`);
  return `data:image/${path.endsWith('.png') ? 'png' : 'jpeg'};base64,${bytes.toString('base64')}`;
}
async function run() {
  const slides = sampleCarousel('CREDIT_EXPLAINER', 'Comente AZUL e entenda o próximo passo da sua empresa.');
  const browser = await chromium.launch({ executablePath: process.env.AZUL_CHROMIUM_PATH || await chromiumBinary.executablePath(), args: chromiumBinary.args, headless: true });
  await mkdir('/tmp/azul-carousel', { recursive: true });
  try {
    const page = await browser.newPage({ viewport: { width: 1080, height: 1440 } });
    const dark = await inline('/brand-assets/azul360-official.png');
    const light = await inline('/brand-assets/azul360-blue-reference.png');
    const fontRules = await Promise.all([['Regular', 400], ['SemiBold', 600], ['Bold', 700]].map(async ([name, weight]) => {
      const font = await readFile(`public/fonts/Gilroy-${name}.ttf`);
      return `@font-face{font-family:Gilroy;src:url(data:font/ttf;base64,${font.toString('base64')}) format('truetype');font-weight:${weight}}`;
    }));
    for (let i = 0; i < slides.length; i++) {
      const photo = slides[i].photoUrl ? await inline(slides[i].photoUrl) : null;
      const markup = carouselMarkup({ profile: { name: 'Azul360', slug: 'azul360', logoUrl: '/brand-assets/azul360-official.png' }, slide: slides[i], index: i, photoSrc: photo, logoDarkSrc: dark, logoLightSrc: light });
      await page.setContent(`<html><head><style>body{margin:0}${carouselCSS}${fontRules.join('')}</style></head><body>${markup}</body></html>`);
      await page.evaluate(() => document.fonts.ready);
      await page.screenshot({ path: `/tmp/azul-carousel/slide-${i + 1}.png` });
    }
    console.log('Cinco PNGs renderizados em 1080 × 1440.');
  } finally { await browser.close(); }
}
run().catch(error => { console.error(error); process.exitCode = 1; });
