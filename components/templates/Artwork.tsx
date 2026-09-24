import React from 'react';
import type { Profile, TemplateKind } from '@prisma/client';

export type ArtworkData = { title: string; body: string; objective?: string; topic?: string; sourceDate?: string | null; photoUrl?: string | null };
function escapeHTML(value: string) { return value.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;').replaceAll("'", '&#39;'); }
function lines(value: string) { return escapeHTML(value).replaceAll('\n', '<br/>'); }
function teamTitle(value: string) {
  const parts = value.split('\n');
  if (parts.length < 2) return lines(value);
  const last = parts.pop() || '';
  return `${parts.map(escapeHTML).join('<br/>')}<br/><strong>${escapeHTML(last)}</strong>`;
}
export function artworkMarkup({ profile, kind, content, logoSrc, logoLightSrc, photoSrc, quoteBaseSrc }: { profile: Pick<Profile, 'name' | 'slug' | 'primaryColor' | 'secondaryColor' | 'logoUrl'>; kind: TemplateKind; content: ArtworkData; logoSrc?: string | null; logoLightSrc?: string | null; photoSrc?: string | null; quoteBaseSrc?: string | null }) {
  const title = content.title || content.topic || 'Seu título aqui';
  const isPhoto = kind === 'TEAM_PHOTO' || kind === 'VIDEO_THUMB';
  const dark = kind === 'VIDEO_THUMB' || kind === 'CREDIT_EXPLAINER';
  const label: Record<TemplateKind, string> = { INSTITUTIONAL: 'IDEIAS QUE MOVEM', NEWS: 'PANORAMA DO CRÉDITO', TEAM_PHOTO: 'NOSSO TIME', CREDIT_EXPLAINER: 'GUIA DE CRÉDITO', VIDEO_THUMB: 'VÍDEO' };
  const referenceLayout = profile.slug === 'azul360' && (kind === 'INSTITUTIONAL' || kind === 'TEAM_PHOTO');
  const actualLogo = kind === 'INSTITUTIONAL' && referenceLayout ? (logoLightSrc || profile.logoUrl) : (logoSrc || profile.logoUrl);
  const primary = /^#[0-9a-fA-F]{6}$/.test(profile.primaryColor) ? profile.primaryColor : '#2e52f0';
  const secondary = /^#[0-9a-fA-F]{6}$/.test(profile.secondaryColor) ? profile.secondaryColor : '#101b40';
  const safeSrc = (src?: string | null) => src && (/^\/(uploads|brand-assets)\/[a-zA-Z0-9_.-]+$/.test(src) || /^data:image\/(png|jpeg|webp);base64,[A-Za-z0-9+/=]+$/.test(src)) ? escapeHTML(src) : '';
  const photo = safeSrc(photoSrc);
  if (profile.slug === 'azul360' && kind === 'INSTITUTIONAL') {
    const base = quoteBaseSrc && (/^\/reference\/[a-zA-Z0-9_.-]+$/.test(quoteBaseSrc) || /^data:image\/png;base64,[A-Za-z0-9+/=]+$/.test(quoteBaseSrc)) ? quoteBaseSrc : '/reference/modelo-frase-base.png';
    return `<div class="quote-art"><img class="quote-base" src="${escapeHTML(base)}" alt=""/>${photo ? `<img class="quote-author-photo" src="${photo}" alt=""/>` : ''}<div class="quote-text">${lines(content.body || '')}</div><div class="quote-author">${lines(content.title || '')}</div><div class="quote-occupation">${lines(content.objective || '')}</div></div>`;
  }
  const logo = safeSrc(actualLogo);
  const date = content.sourceDate && !Number.isNaN(new Date(content.sourceDate).getTime()) ? new Date(content.sourceDate).toLocaleDateString('pt-BR', { timeZone: 'UTC' }) : '';
  return `<div class="art art-${kind.toLowerCase()} ${dark ? 'art-dark' : ''} ${referenceLayout ? 'art-reference' : ''}" style="--primary:${primary};--secondary:${secondary}">
    ${isPhoto && photo ? `<div class="art-photo" style="background-image:url('${photo}')"></div>` : ''}
    ${isPhoto ? '<div class="art-photo-shade"></div>' : ''}
    ${referenceLayout ? `<div class="art-reference-logo">${logo ? `<img src="${logo}" alt="Logo oficial ${escapeHTML(profile.name)}"/>` : '<span>Logo oficial pendente</span>'}</div>` : ''}
    ${referenceLayout ? `<div class="art-reference-copy"><h1>${kind === 'TEAM_PHOTO' ? teamTitle(title) : lines(title)}</h1>${content.body ? `<div class="art-reference-body">${lines(content.body)}</div>` : ''}</div>` : `
    <div class="art-top"><span class="art-overline"><span class="art-dot"></span>${label[kind]}</span><span class="art-index">AZUL360 / STUDIO</span></div>
    <div class="art-content">
      ${kind === 'NEWS' ? '<span class="art-pill">ATUALIDADE · CRÉDITO</span>' : ''}
      ${kind === 'CREDIT_EXPLAINER' ? '<span class="art-rule"></span>' : ''}
      <h1>${lines(title)}</h1>
      ${kind !== 'VIDEO_THUMB' && content.body ? `<div class="art-body">${lines(content.body)}</div>` : ''}
      ${kind === 'NEWS' && date ? `<span class="art-date">${date}</span>` : ''}
    </div>
    <div class="art-bottom"><div class="art-bottom-line"></div><div class="art-bottom-row">${logo ? `<img class="art-logo" src="${logo}" alt="Logo oficial ${escapeHTML(profile.name)}"/>` : '<span class="art-logo-missing">Logo oficial pendente</span>'}<span>CONTEÚDO COM PROPÓSITO</span></div></div>`}
  </div>`;
}
export function Artwork(props: Parameters<typeof artworkMarkup>[0]) { return <div dangerouslySetInnerHTML={{ __html: artworkMarkup(props) }} />; }

export const artworkCSS = `
@font-face{font-family:Gilroy;src:url('/fonts/Gilroy-Regular.ttf') format('truetype');font-weight:400;font-display:swap}
@font-face{font-family:Gilroy;src:url('/fonts/Gilroy-SemiBold.ttf') format('truetype');font-weight:600;font-display:swap}
@font-face{font-family:Gilroy;src:url('/fonts/Gilroy-Bold.ttf') format('truetype');font-weight:700;font-display:swap}
.quote-art{position:relative;width:1080px;height:1440px;overflow:hidden;background:white;font-family:Gilroy,Arial,sans-serif;color:#18233d;}
.quote-base{position:absolute;inset:0;width:1080px;height:1440px;}
.quote-author-photo{position:absolute;left:450px;top:687px;width:680px;height:753px;object-fit:cover;object-position:center top;filter:grayscale(1) sepia(.28) hue-rotate(178deg);clip-path:circle(555px at 560px 365px);}
.quote-text{position:absolute;left:92px;top:264px;width:605px;max-height:457px;overflow:hidden;font-size:29px;line-height:1.75;letter-spacing:.16em;font-weight:400;text-transform:uppercase;white-space:pre-wrap;overflow-wrap:break-word;}
.quote-author{position:absolute;left:92px;top:838px;width:385px;max-height:40px;overflow:hidden;color:#1461cb;font-size:24px;letter-spacing:.17em;font-weight:600;text-transform:uppercase;white-space:nowrap;}
.quote-occupation{position:absolute;left:92px;top:881px;width:385px;max-height:56px;overflow:hidden;font-size:18px;line-height:1.4;letter-spacing:.24em;font-weight:400;text-transform:uppercase;white-space:pre-wrap;}
.art { box-sizing:border-box; position:relative; width:1080px; height:1440px; overflow:hidden; padding:86px 88px 76px; background:#f7f8fc; color:#101b40; font-family:Arial,Helvetica,sans-serif; display:flex; flex-direction:column; justify-content:space-between; }
.art * { box-sizing:border-box; }
.art::before {content:'';position:absolute;top:-370px;right:-340px;width:900px;height:900px;border-radius:50%;background:radial-gradient(circle,rgba(46,82,240,.11),rgba(46,82,240,0) 70%);pointer-events:none;}
.art-dark {background:var(--secondary);color:white;}
.art-top,.art-bottom,.art-content {position:relative;z-index:2;}
.art-top,.art-bottom-row {display:flex;align-items:center;justify-content:space-between;gap:24px;}
.art-overline,.art-index,.art-bottom-row {font-size:17px;letter-spacing:.18em;font-weight:700;}
.art-overline {display:flex;align-items:center;gap:16px;color:var(--primary);}
.art-dot {width:11px;height:11px;background:var(--primary);border-radius:50%;}
.art-index {opacity:.45;}
.art-content {margin:auto 0;}
.art h1 {font-size:91px;line-height:1.03;letter-spacing:-.065em;margin:0;max-width:920px;white-space:pre-wrap;overflow-wrap:anywhere;}
.art-body {font-size:37px;line-height:1.32;letter-spacing:-.025em;white-space:pre-wrap;max-width:870px;margin-top:42px;opacity:.8;}
.art-bottom-line {height:2px;background:currentColor;opacity:.15;margin-bottom:40px;}
.art-logo {display:block;max-width:235px;max-height:85px;object-fit:contain;object-position:left center;}
.art:not(.art-dark):not(.art-team_photo) .art-logo {background:var(--secondary);padding:10px;border-radius:6px;box-sizing:content-box;}
.art-logo-missing {font-size:22px;opacity:.5;letter-spacing:0;font-weight:400;}
.art-bottom-row span:last-child {opacity:.45;font-size:15px;}
.art-institutional .art-content {border-left:9px solid var(--primary);padding-left:48px;}
.art-institutional h1 {font-size:99px;}
.art-news .art-content {align-self:stretch;}
.art-news h1 {font-size:86px;margin-top:31px;}
.art-pill {font-size:18px;font-weight:800;letter-spacing:.16em;padding:14px 20px;border:2px solid var(--primary);color:var(--primary);}
.art-date {display:block;margin-top:45px;font-size:22px;opacity:.55;}
.art-credit_explainer h1 {font-size:86px;}
.art-credit_explainer .art-body {opacity:.78;}
.art-rule {display:block;height:13px;width:105px;background:#6e90ff;margin-bottom:45px;}
.art-credit_explainer .art-overline {color:#91aaff;}
.art-photo {position:absolute;inset:0;background-size:cover;background-position:center;}
.art-photo-shade {position:absolute;inset:0;background:linear-gradient(180deg,rgba(8,18,50,.55) 0%,rgba(8,18,50,.05) 37%,rgba(8,18,50,.85) 100%);}
.art-team_photo,.art-video_thumb {color:#fff;background:var(--secondary);}
.art-team_photo .art-overline,.art-video_thumb .art-overline {color:#cbd9ff;}
.art-team_photo .art-content,.art-video_thumb .art-content {margin-top:auto;margin-bottom:90px;}
.art-team_photo h1,.art-video_thumb h1 {font-size:90px;}
.art-team_photo .art-body {opacity:.9;}
.art-video_thumb {height:1920px;}
.art-video_thumb h1 {font-size:115px;}
.art-reference{padding:0;background:#fff;color:#0e1015;font-family:Gilroy,Arial,Helvetica,sans-serif;display:block;}
.art-reference::before{content:none;}
.art-reference-logo{position:absolute;z-index:3;top:89px;left:126px;display:flex;align-items:center;height:52px;}
.art-reference-logo img{display:block;width:150px;max-height:56px;object-fit:contain;object-position:left center;}
.art-reference-logo span{font-size:22px;color:#67809b;}
.art-reference-copy{position:absolute;z-index:2;left:96px;right:88px;top:275px;}
.art-institutional.art-reference h1{font-size:132px;line-height:.84;letter-spacing:-.055em;color:#2e52f0;font-weight:700;max-width:900px;}
.art-reference-body{white-space:pre-wrap;overflow-wrap:anywhere;font-weight:400;}
.art-institutional.art-reference .art-reference-body{position:absolute;top:695px;left:0;width:870px;font-size:26px;line-height:1.32;letter-spacing:.21em;text-transform:uppercase;}
.art-team_photo.art-reference .art-photo-shade{background:linear-gradient(180deg,rgba(3,25,71,.02) 0%,rgba(3,25,71,.05) 42%,rgba(4,40,91,.32) 65%,rgba(5,68,130,.88) 100%);}
.art-team_photo.art-reference .art-reference-logo{left:142px;}
.art-team_photo.art-reference .art-reference-copy{left:142px;right:100px;top:705px;}
.art-team_photo.art-reference h1{font-family:Gilroy,Arial,Helvetica,sans-serif;font-size:74px;line-height:1.04;letter-spacing:-.035em;text-transform:uppercase;font-weight:400;max-width:840px;color:#fff;}
.art-team_photo.art-reference h1 strong{font-weight:600;}
.art-team_photo.art-reference .art-reference-body{font-size:26px;line-height:1.4;letter-spacing:.14em;text-transform:uppercase;margin-top:45px;max-width:830px;color:#fff;}
`;
