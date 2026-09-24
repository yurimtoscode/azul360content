import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { chromium } from 'playwright';
import chromiumBinary from '@sparticuz/chromium';
import { readFile } from 'node:fs/promises';
import { Artwork, artworkCSS } from '../components/templates/Artwork';

async function run() {
  const browser = await chromium.launch({ headless: true, executablePath: process.env.AZUL_CHROMIUM_PATH || await chromiumBinary.executablePath(), args: chromiumBinary.args });
  try {
    const page = await browser.newPage({ viewport: { width: 1080, height: 1440 } });
    const logo = await readFile('public/brand-assets/azul360-official.png');
    const lightLogo = await readFile('public/brand-assets/azul360-blue-reference.png');
    const regular = await readFile('public/fonts/Gilroy-Regular.ttf');
    const semibold = await readFile('public/fonts/Gilroy-SemiBold.ttf');
    const bold = await readFile('public/fonts/Gilroy-Bold.ttf');
    const fonts = `@font-face{font-family:Gilroy;src:url(data:font/ttf;base64,${regular.toString('base64')}) format('truetype');font-weight:400}@font-face{font-family:Gilroy;src:url(data:font/ttf;base64,${semibold.toString('base64')}) format('truetype');font-weight:600}@font-face{font-family:Gilroy;src:url(data:font/ttf;base64,${bold.toString('base64')}) format('truetype');font-weight:700}`;
    const art = renderToStaticMarkup(<Artwork profile={{ name: 'Azul360', slug: 'azul360', primaryColor: '#2e52f0', secondaryColor: '#101b40', logoUrl: null }} kind="INSTITUTIONAL" content={{ title: 'Planejar amplia caminhos.', body: 'Toda decisão começa com clareza.' }} logoSrc={`data:image/png;base64,${logo.toString('base64')}`} logoLightSrc={`data:image/png;base64,${lightLogo.toString('base64')}`} />);
    await page.setContent(`<html><head><style>body{margin:0}${artworkCSS}${fonts}</style></head><body>${art}</body></html>`);
    await page.evaluate(() => document.fonts.ready);
    const png = await page.screenshot({ path: '/tmp/azul360-smoke.png' });
    if (png.length < 10000) throw new Error('PNG inesperadamente pequeno.');
    const photo = await readFile('public/reference/foto-equipe.jpg');
    const teamArt = renderToStaticMarkup(<Artwork profile={{ name: 'Azul360', slug: 'azul360', primaryColor: '#2e52f0', secondaryColor: '#101b40', logoUrl: null }} kind="TEAM_PHOTO" content={{ title: 'Você trabalha.\nNosso time\nestrutura\nseu crédito.', body: '' }} logoSrc={`data:image/png;base64,${logo.toString('base64')}`} photoSrc={`data:image/jpeg;base64,${photo.toString('base64')}`} />);
    await page.setContent(`<html><head><style>body{margin:0}${artworkCSS}${fonts}</style></head><body>${teamArt}</body></html>`);
    await page.evaluate(() => document.fonts.ready);
    const teamPng = await page.screenshot({ path: '/tmp/azul360-time-smoke.png' });
    if (teamPng.length < 10000) throw new Error('PNG de foto do time inesperadamente pequeno.');
    console.log('Dois PNGs gerados em 1080 × 1440.');
  } finally { await browser.close(); }
}
run().catch(error => { console.error(error); process.exitCode = 1; });
