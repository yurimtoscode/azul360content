'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import type { Content, Profile, Template } from '@prisma/client';
import { Artwork } from '@/components/templates/Artwork';
import { CarouselArtwork } from '@/components/templates/CarouselArtwork';
import { isCarousel, parseCarousel, sampleCarousel, type CarouselSlide } from '@/lib/carousel';
import { ArrowLeft, ArrowRight, Download, Sparkles, Save, Send, Check, X, Upload, Info } from 'lucide-react';
import Link from 'next/link';

type Initial = Omit<Content, 'sourceDate' | 'sourceUrl' | 'photoUrl'> & { sourceDate: string; sourceUrl: string; photoUrl: string };
const slideNames = ['Abertura · foto', 'Contexto · branco', 'Desdobramento · foto', 'Explicação · branco', 'Fechamento · foto'];

export function ContentEditor({ profiles, templates, initial }: { profiles: Profile[]; templates: Template[]; initial?: Initial }) {
  const router = useRouter();
  const [profileId, setProfileId] = useState(initial?.profileId || profiles[0]?.id || '');
  const [templateId, setTemplateId] = useState(initial?.templateId || templates.find(x => x.kind === 'INSTITUTIONAL')?.id || '');
  const [topic, setTopic] = useState(initial?.topic || ''); const [objective, setObjective] = useState(initial?.objective || '');
  const [title, setTitle] = useState(initial?.title || ''); const [body, setBody] = useState(initial?.body || ''); const [caption, setCaption] = useState(initial?.caption || '');
  const [sourceUrl, setSourceUrl] = useState(initial?.sourceUrl || ''); const [sourceDate, setSourceDate] = useState(initial?.sourceDate || '');
  const [photoUrl, setPhotoUrl] = useState(initial?.photoUrl || '');
  const [drivePhotos, setDrivePhotos] = useState<{ id: string; name: string; mimeType: string }[] | null>(null);
  const initialProfile = profiles.find(p => p.id === initial?.profileId) || profiles[0];
  const initialTemplate = templates.find(t => t.id === initial?.templateId);
  const [carouselSlides, setCarouselSlides] = useState<CarouselSlide[]>(parseCarousel(initial?.slides) || sampleCarousel(initialTemplate?.kind === 'NEWS' ? 'NEWS' : 'CREDIT_EXPLAINER', initialProfile?.ctas[0]));
  const [status, setStatus] = useState(initial?.status || 'DRAFT'); const [busy, setBusy] = useState(false); const [notice, setNotice] = useState(''); const [previewSlide, setPreviewSlide] = useState(0);
  const profile = profiles.find(x => x.id === profileId) || profiles[0]; const template = templates.find(x => x.id === templateId) || templates[0];
  const carousel = template && isCarousel(template.kind);
  const isQuote = profile?.slug === 'azul360' && template?.kind === 'INSTITUTIONAL';
  const isNews = template?.kind === 'NEWS'; const needsPhoto = template?.kind === 'TEAM_PHOTO' || template?.kind === 'VIDEO_THUMB';
  function updateSlide(index: number, field: keyof CarouselSlide, value: string) {
    setCarouselSlides(current => current.map((slide, i) => i === index ? { ...slide, [field]: value } : slide));
  }
  function selectTemplate(value: string) {
    const selected = templates.find(t => t.id === value);
    setTemplateId(value); setPreviewSlide(0);
    if (selected && isCarousel(selected.kind)) setCarouselSlides(sampleCarousel(selected.kind, profile?.ctas[0]));
  }
  async function generate() {
    setBusy(true); setNotice('');
    try {
      const response = await fetch('/api/generate', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ topic, profileId, templateId }) });
      const data = await response.json(); if (!response.ok) throw new Error(data.error);
      if (carousel && data.slides) setCarouselSlides(data.slides);
      else { setTitle(data.title); setBody(data.body); if (data.objective) setObjective(data.objective); }
      setCaption(data.caption);
      if (data.sourceUrl) setSourceUrl(data.sourceUrl);
      if (data.sourceDate) setSourceDate(data.sourceDate);
      if (isQuote && data.photoId) {
        const image = await fetch('/api/media/drive', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ profileId, fileId: data.photoId, authorPortrait: true }) });
        const imported = await image.json();
        if (image.ok) setPhotoUrl(imported.url); else data.pending = [...(data.pending || []), imported.error];
      }
      setNotice(`Rascunho automático criado a partir de fonte identificada. Revise fatos, textos e fotos antes de aprovar.${data.pending?.length ? ` Pendente: ${data.pending.join('; ')}.` : ''}`);
    } catch (error) { setNotice(String(error)); } finally { setBusy(false); }
  }
  const input = { profileId, templateId, topic, objective,
    title: carousel ? carouselSlides[0].headline.replaceAll('\n', ' ').slice(0, 160) : title,
    body: carousel ? carouselSlides.map(s => s.body).filter(Boolean).join('\n\n').slice(0, 4000) : body,
    caption, sourceUrl, sourceDate, photoUrl: carousel ? '' : photoUrl, slides: carousel ? carouselSlides : null };
  async function save() {
    setBusy(true); setNotice('');
    try {
      const response = await fetch(initial ? `/api/contents/${initial.id}` : '/api/contents', { method: initial ? 'PUT' : 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(input) });
      const data = await response.json(); if (!response.ok) throw new Error(data.error);
      setStatus('DRAFT'); setNotice('Conteúdo salvo.');
      if (!initial) router.push(`/conteudos/${data.id}`); else router.refresh();
    } catch (error) { setNotice(String(error)); } finally { setBusy(false); }
  }
  async function changeStatus(next: 'IN_REVIEW' | 'APPROVED' | 'REJECTED' | 'DRAFT') {
    if (!initial) return; setBusy(true); setNotice('');
    try {
      const response = await fetch(`/api/contents/${initial.id}/status`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status: next }) });
      const data = await response.json(); if (!response.ok) throw new Error(data.error);
      setStatus(next); setNotice('Status atualizado.'); router.refresh();
    } catch (error) { setNotice(String(error)); } finally { setBusy(false); }
  }
  async function upload(file: File | undefined, index?: number) {
    if (!file) return; setBusy(true); setNotice('');
    try {
      const form = new FormData(); form.set('file', file); form.set('purpose', isQuote && typeof index !== 'number' ? 'authorPortrait' : 'photo');
      const response = await fetch('/api/media', { method: 'POST', body: form }); const data = await response.json();
      if (!response.ok) throw new Error(data.error);
      if (typeof index === 'number') updateSlide(index, 'photoUrl', data.url); else setPhotoUrl(data.url);
      setNotice('Foto carregada. Salve o conteúdo para conservar a seleção.');
    } catch (error) { setNotice(String(error)); } finally { setBusy(false); }
  }
  async function browseDrive() {
    setBusy(true); setNotice('');
    try { const response = await fetch(`/api/media/drive?profileId=${encodeURIComponent(profileId)}`); const data = await response.json(); if (!response.ok) throw new Error(data.error); setDrivePhotos(data.files); if (!data.files.length) setNotice('Nenhuma imagem disponível na pasta do perfil.'); }
    catch (error) { setNotice(String(error)); } finally { setBusy(false); }
  }
  async function chooseDrive(id: string, index?: number) {
    setBusy(true); setNotice('');
    try { const response = await fetch('/api/media/drive', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ profileId, fileId: id, authorPortrait: isQuote }) }); const data = await response.json(); if (!response.ok) throw new Error(data.error); if (typeof index === 'number') updateSlide(index, 'photoUrl', data.url); else setPhotoUrl(data.url); setDrivePhotos(null); setNotice('Foto autorizada importada. Salve o conteúdo para conservar a seleção.'); }
    catch (error) { setNotice(String(error)); } finally { setBusy(false); }
  }
  return <><div className="editor-head"><div><Link className="back-link" href="/conteudos"><ArrowLeft size={16} /> Voltar aos conteúdos</Link><h1>{initial ? 'Editar conteúdo' : 'Criar conteúdo'}</h1><p>Escolha a identidade, construa a mensagem e veja a arte ganhar forma.</p></div><div className="editor-head-actions">{initial && <span className={`badge badge-${status.toLowerCase()}`}>{status.replace('_', ' ')}</span>}<button onClick={save} disabled={busy} className="button primary"><Save size={17} /> Salvar peça</button></div></div>
  <div className="editor-grid"><div className="editor-fields">
    <section className="panel"><div className="panel-title"><span className="step-number">01</span><div><h2>Base do conteúdo</h2><p>Defina a voz e o formato da peça.</p></div></div><div className="field-row"><label>Perfil<select value={profileId} onChange={e => setProfileId(e.target.value)}>{profiles.map(x => <option value={x.id} key={x.id}>{x.name}</option>)}</select></label><label>Modelo<select value={templateId} onChange={e => selectTemplate(e.target.value)}>{templates.map(x => <option value={x.id} key={x.id}>{x.name}</option>)}</select></label></div><label>Pauta ou tema<input value={topic} onChange={e => setTopic(e.target.value)} placeholder="Ex.: Planejamento para acessar crédito" /></label><label>{isQuote ? 'Ocupação do autor' : <>Objetivo <span className="muted">(opcional)</span></>}<input value={objective} onChange={e => setObjective(e.target.value)} placeholder={isQuote ? 'Ex.: Escritor' : 'O que esta peça deve comunicar?'} /></label><button className="button outline" disabled={busy} onClick={generate}><Sparkles size={16} /> Gerar automaticamente</button><div className="helper-note"><Info size={15} /> {isQuote ? 'A geração busca um retrato PNG autorizado pelo nome do autor na pasta do Drive.' : 'A geração pesquisa notícias de portais configurados, gera um rascunho e indica fonte e pendências.'}</div></section>
    {carousel ? <section className="panel"><div className="panel-title"><span className="step-number">02</span><div><h2>Carrossel em cinco páginas</h2><p>O mesmo padrão visual é usado nos modelos 2 e 4.</p></div></div><div className="slide-selector">{carouselSlides.map((_, index) => <button type="button" key={index} className={index === previewSlide ? 'active' : ''} onClick={() => setPreviewSlide(index)}>{String(index + 1).padStart(2, '0')} <small>{slideNames[index]}</small></button>)}</div><div className="carousel-form"><div className="helper-note">O texto ocupa posições fixas. Use quebras de linha para controlar a leitura. Fotos de exemplo foram extraídas do PSD enviado e podem ser substituídas.</div><label>Título da página<textarea rows={4} value={carouselSlides[previewSlide].headline} onChange={e => updateSlide(previewSlide, 'headline', e.target.value)} /></label>{[1,3,4].includes(previewSlide) && <label>{previewSlide === 4 ? 'CTA / texto inferior' : 'Texto complementar'}<textarea rows={5} value={carouselSlides[previewSlide].body} onChange={e => updateSlide(previewSlide, 'body', e.target.value)} /></label>}{previewSlide === 2 && <label>Segundo título, na parte inferior<textarea rows={3} value={carouselSlides[previewSlide].footer} onChange={e => updateSlide(previewSlide, 'footer', e.target.value)} /></label>}{[1,3].includes(previewSlide) && <label>Palavra ou trecho em azul<input value={carouselSlides[previewSlide].accent} onChange={e => updateSlide(previewSlide, 'accent', e.target.value)} /></label>}{[0,2,4].includes(previewSlide) && <label className="upload-zone"><Upload size={21} /><span>Substituir foto da página {previewSlide + 1}</span><small>Foto original, sem texto · PNG, JPG ou WebP · até 8 MB</small><input type="file" accept="image/png,image/jpeg,image/webp" onChange={e => upload(e.target.files?.[0], previewSlide)} hidden /></label>}</div></section>
    : <section className="panel"><div className="panel-title"><span className="step-number">02</span><div><h2>Texto e legenda</h2><p>Edite cada palavra antes de aprovar.</p></div></div><label>{isQuote ? 'Nome do autor' : 'Headline da arte'}{template?.kind === 'TEAM_PHOTO' ? <textarea rows={4} value={title} maxLength={160} onChange={e => setTitle(e.target.value)} placeholder="Uma linha por linha da arte; a última recebe destaque" /> : <input value={title} maxLength={160} onChange={e => setTitle(e.target.value)} placeholder={isQuote ? 'Nome do autor' : 'Título principal'} />}</label><label>{isQuote ? 'Frase (quebras de linha controlam a composição)' : 'Texto de apoio'}<textarea value={body} onChange={e => setBody(e.target.value)} rows={isQuote ? 9 : 5} placeholder={isQuote ? 'Digite a frase do autor' : 'Texto que aparece na arte'} /></label>{(needsPhoto || isQuote) && <label className="upload-zone"><Upload size={21} /><span>{photoUrl ? 'Trocar foto' : 'Adicionar foto aprovada do autor'}</span><small>{isQuote ? 'PNG com fundo transparente · até 8 MB' : 'PNG, JPG ou WebP · até 8 MB'}</small><input type="file" accept={isQuote ? 'image/png' : 'image/png,image/jpeg,image/webp'} onChange={e => upload(e.target.files?.[0])} hidden /></label>}</section>}
    {template?.kind !== 'VIDEO_THUMB' && <section className="panel"><div className="panel-title"><span className="step-number">03</span><div><h2>Legenda e fontes</h2><p>A legenda não fica dentro da arte.</p></div></div><label>Legenda da publicação<textarea value={caption} onChange={e => setCaption(e.target.value)} rows={6} placeholder="Texto da legenda" /></label>{isNews && <div className="field-row"><label>URL da fonte<input type="url" value={sourceUrl} onChange={e => setSourceUrl(e.target.value)} placeholder="https://..." /></label><label>Data do fato<input type="date" value={sourceDate} onChange={e => setSourceDate(e.target.value)} /></label></div>}</section>}
    {initial && <section className="panel"><div className="panel-title"><span className="step-number">04</span><div><h2>Revisão</h2><p>Salve as edições antes de aprovar ou exportar.</p></div></div><div className="review-actions">{status === 'DRAFT' && <button className="button outline" onClick={() => changeStatus('IN_REVIEW')} disabled={busy}><Send size={16} /> Enviar para revisão</button>}{status === 'IN_REVIEW' && <><button className="button primary" onClick={() => changeStatus('APPROVED')} disabled={busy}><Check size={16} /> Aprovar</button><button className="button outline" onClick={() => changeStatus('REJECTED')} disabled={busy}><X size={16} /> Rejeitar</button></>}{status === 'REJECTED' && <button className="button outline" onClick={() => changeStatus('DRAFT')} disabled={busy}>Voltar para rascunho <ArrowRight size={16} /></button>}{status === 'APPROVED' && <span className="success-text">Peça aprovada e pronta para exportação.</span>}</div></section>}
    {(isQuote || needsPhoto || (carousel && [0, 2, 4].includes(previewSlide))) && <div className="panel"><button className="button outline" type="button" onClick={browseDrive} disabled={busy || !profile?.driveFolderId}>Escolher foto da pasta do Drive</button>{!profile?.driveFolderId && <p className="helper-note">Cadastre o link da pasta nas configurações do perfil.</p>}{drivePhotos && <div className="drive-picker">{drivePhotos.slice(0, 60).map(file => <button type="button" key={file.id} onClick={() => chooseDrive(file.id, carousel ? previewSlide : undefined)} disabled={busy || (isQuote && file.mimeType !== 'image/png')}>{file.name}</button>)}</div>}</div>}
    {notice && <div role="status" className="notice">{notice}</div>}
  </div><aside className="preview-panel"><div className="preview-heading"><div><span className="eyebrow">VISUALIZAÇÃO EM TEMPO REAL</span><h2>Prévia da arte</h2></div><span className="preview-dimension">{template?.width} × {template?.height}</span></div><div className={`preview-frame ${template?.kind === 'VIDEO_THUMB' ? 'preview-tall' : ''}`}>{profile && template && <div className="preview-scale">{carousel ? <CarouselArtwork profile={profile} slide={carouselSlides[previewSlide]} index={previewSlide} logoLightSrc={profile.slug === 'azul360' ? '/brand-assets/azul360-blue-reference.png' : profile.logoUrl} /> : <Artwork profile={profile} kind={template.kind} content={{ title, body, objective, topic, sourceDate, photoUrl }} logoLightSrc={profile.slug === 'azul360' ? '/brand-assets/azul360-blue-reference.png' : profile.logoUrl} photoSrc={photoUrl} />}</div>}</div>{carousel && <div className="slide-tabs">{carouselSlides.map((_, index) => <button type="button" className={previewSlide === index ? 'active' : ''} onClick={() => setPreviewSlide(index)} key={index}>{index + 1}</button>)}</div>}<div className="preview-footer"><span>Formato {template?.kind === 'VIDEO_THUMB' ? '9:16' : '3:4'} · {carousel ? '5 slides' : 'PNG'}</span>{initial ? <a className="button outline" href={`/api/render/${initial.id}`} download><Download size={16} /> Baixar {carousel ? 'ZIP' : 'PNG'}</a> : <span className="muted">Salve para baixar</span>}</div>{isQuote && <div className="helper-note">Ajuste as quebras da frase até caberem no espaço fixo. Use apenas fotos com autorização.</div>}{!profile?.logoUrl && <div className="asset-warning">A logo oficial deste perfil ainda não foi enviada. Cadastre-a em Perfis antes de produzir a arte final.</div>}</aside></div></>;
}
