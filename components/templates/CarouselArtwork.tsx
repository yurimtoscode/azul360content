import React from 'react';
import type { Profile } from '@prisma/client';
import type { CarouselSlide } from '@/lib/carousel';

type CarouselProps = {
  profile: Pick<Profile, 'name' | 'slug' | 'logoUrl'>;
  slide: CarouselSlide;
  index: number;
  photoSrc?: string | null;
  logoDarkSrc?: string | null;
  logoLightSrc?: string | null;
};
function escapeHTML(value: string) { return value.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;').replaceAll("'", '&#39;'); }
function lines(value: string) { return escapeHTML(value).replaceAll('\n', '<br/>'); }
function safeSrc(value?: string | null) {
  return value && (/^\/(uploads|reference|brand-assets)\/[a-zA-Z0-9_.-]+$/.test(value) || /^data:image\/(png|jpeg|webp);base64,[A-Za-z0-9+/=]+$/.test(value)) ? escapeHTML(value) : '';
}
function accented(headline: string, accent: string) {
  if (!accent || !headline.includes(accent)) return lines(headline);
  const start = headline.indexOf(accent);
  return `${lines(headline.slice(0, start))}<span class="carousel-accent">${lines(accent)}</span>${lines(headline.slice(start + accent.length))}`;
}
export function carouselMarkup({ profile, slide, index, photoSrc, logoDarkSrc, logoLightSrc }: CarouselProps) {
  const variant = ['photo-intro', 'text-statement', 'photo-dual', 'text-support', 'photo-cta'][index] || 'text-support';
  const photo = variant.startsWith('photo');
  const image = safeSrc(photoSrc || slide.photoUrl);
  const logo = safeSrc(photo ? (logoDarkSrc || profile.logoUrl) : (logoLightSrc || profile.logoUrl));
  const capsule = profile.slug === 'azul360' ? '' : ' carousel-logo-capsule';
  return `<div class="carousel-art carousel-${variant}">
    ${photo && image ? `<div class="carousel-photo" style="background-image:url('${image}')"></div>` : ''}
    ${photo ? '<div class="carousel-photo-shade"></div>' : ''}
    ${logo ? `<div class="carousel-logo${capsule}"><img src="${logo}" alt="Logo oficial ${escapeHTML(profile.name)}"/></div>` : '<div class="carousel-logo-missing">Logo oficial pendente</div>'}
    ${photo && !image ? '<div class="carousel-image-missing">Adicione uma foto aprovada</div>' : ''}
    ${variant === 'photo-intro' ? `<h1 class="carousel-headline">${accented(slide.headline, slide.accent)}</h1>${slide.body ? `<div class="carousel-body">${lines(slide.body)}</div>` : ''}` : ''}
    ${variant === 'text-statement' ? `<div class="carousel-body">${lines(slide.body)}</div><h1 class="carousel-headline">${accented(slide.headline, slide.accent)}</h1>` : ''}
    ${variant === 'photo-dual' ? `<h1 class="carousel-headline">${accented(slide.headline, slide.accent)}</h1><div class="carousel-footer">${lines(slide.footer)}</div>` : ''}
    ${variant === 'text-support' ? `<h1 class="carousel-headline">${accented(slide.headline, slide.accent)}</h1><div class="carousel-body">${lines(slide.body)}</div>` : ''}
    ${variant === 'photo-cta' ? `<h1 class="carousel-headline">${accented(slide.headline, slide.accent)}</h1><div class="carousel-body">${lines(slide.body)}</div>` : ''}
  </div>`;
}
export function CarouselArtwork(props: CarouselProps) { return <div dangerouslySetInnerHTML={{ __html: carouselMarkup(props) }} />; }

export const carouselCSS = `
@font-face{font-family:Gilroy;src:url('/fonts/Gilroy-Regular.ttf') format('truetype');font-weight:400;font-display:swap}
@font-face{font-family:Gilroy;src:url('/fonts/Gilroy-SemiBold.ttf') format('truetype');font-weight:600;font-display:swap}
@font-face{font-family:Gilroy;src:url('/fonts/Gilroy-Bold.ttf') format('truetype');font-weight:700;font-display:swap}
.carousel-art{--font-intro:74px;--font-title:110px;--font-secondary-title:100px;--font-support:26px;position:relative;box-sizing:border-box;width:1080px;height:1440px;overflow:hidden;background:#fff;color:#0e1015;font-family:Gilroy,Arial,Helvetica,sans-serif}
.carousel-art *{box-sizing:border-box}
.carousel-photo{position:absolute;inset:0;background-size:cover;background-position:center}
.carousel-photo-shade{position:absolute;inset:0;pointer-events:none;background:linear-gradient(180deg,rgba(0,37,116,.08) 0%,rgba(3,35,91,.03) 42%,rgba(6,41,91,.50) 72%,rgba(5,71,133,.91) 100%)}
.carousel-photo-cta .carousel-photo-shade{background:linear-gradient(180deg,rgba(5,14,58,.2),rgba(5,20,64,.48) 53%,rgba(5,27,79,.94) 100%)}
.carousel-logo{position:absolute;z-index:3;top:89px;left:142px;min-width:149px;min-height:44px;display:flex;align-items:center}
.carousel-logo img{display:block;width:149px;max-height:56px;object-fit:contain;object-position:left center}
.carousel-logo-capsule{background:#102a60;border-radius:8px;padding:10px}
.carousel-logo-missing{position:absolute;z-index:3;top:89px;left:142px;color:#67809b;font-size:22px}
.carousel-photo-intro,.carousel-photo-dual,.carousel-photo-cta{background:#073e87;color:#fff}
.carousel-headline{position:absolute;z-index:2;margin:0;font-size:var(--font-title);font-weight:700;letter-spacing:-.055em;overflow-wrap:anywhere;white-space:normal}
.carousel-body{position:absolute;z-index:2;font-size:var(--font-support);line-height:1.75;letter-spacing:.21em;font-weight:400;text-transform:uppercase;white-space:pre-wrap;overflow-wrap:anywhere}
.carousel-footer{position:absolute;z-index:2;font-size:var(--font-secondary-title);line-height:.91;font-weight:700;letter-spacing:-.055em;white-space:pre-wrap;overflow-wrap:anywhere}
.carousel-accent{color:#0756cf}
.carousel-photo-intro .carousel-headline{left:142px;top:704px;width:800px;font-size:var(--font-intro);line-height:.99;font-weight:400;text-transform:uppercase;letter-spacing:-.035em}
.carousel-photo-intro .carousel-accent{color:white;font-weight:700}
.carousel-photo-intro .carousel-body{left:142px;bottom:168px;width:770px;color:white}
.carousel-text-statement .carousel-body{left:158px;top:304px;width:745px;line-height:2.05}
.carousel-text-statement .carousel-headline{left:148px;top:838px;width:790px;line-height:.88}
.carousel-photo-dual .carousel-headline{left:130px;top:180px;width:850px;line-height:.91}
.carousel-photo-dual .carousel-footer{left:130px;top:946px;width:910px}
.carousel-photo-dual .carousel-logo{top:89px;left:130px}
.carousel-text-support .carousel-logo{left:126px}
.carousel-text-support .carousel-headline{left:97px;top:275px;width:800px;line-height:.89;color:#2e52f0}
.carousel-text-support .carousel-accent{color:#2e52f0}
.carousel-text-support .carousel-body{left:99px;top:974px;width:850px;line-height:1.55}
.carousel-photo-cta .carousel-logo{left:105px}
.carousel-photo-cta .carousel-headline{left:110px;top:275px;width:815px;line-height:.94}
.carousel-photo-cta .carousel-accent{color:white}
.carousel-photo-cta .carousel-body{left:112px;top:1064px;width:860px;color:white;line-height:1.23}
.carousel-image-missing{position:absolute;left:140px;top:650px;color:#fff;font-size:30px;opacity:.65}
`;
