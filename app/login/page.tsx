'use client';
import { useState } from 'react';
export default function Login() {
  const [email, setEmail] = useState(''); const [password, setPassword] = useState(''); const [error, setError] = useState('');
  async function submit(event: React.FormEvent) {
    event.preventDefault(); setError('');
    const res = await fetch('/api/auth/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, password }) });
    if (res.ok) window.location.href = '/conteudos'; else setError((await res.json()).error);
  }
  return <main className="login-page"><section className="login-panel"><div className="eyebrow">AZUL360 · CONTENT STUDIO</div><h1>Um lugar para criar com clareza.</h1><p>Entre com seu acesso interno para começar.</p><form onSubmit={submit}><label>E-mail<input type="email" value={email} onChange={e => setEmail(e.target.value)} required autoComplete="username" /></label><label>Senha<input type="password" value={password} onChange={e => setPassword(e.target.value)} required autoComplete="current-password" /></label>{error && <p className="error">{error}</p>}<button className="button primary" type="submit">Entrar no estúdio →</button></form></section><div className="login-aside"><div className="aside-label">CONTEÚDO · DESIGN · PUBLICAÇÃO</div><div className="aside-display">Cada ideia,<br /><em>no seu lugar.</em></div><div className="aside-foot">Da pauta à arte final, com o cuidado que a marca merece.</div></div></main>;
}
