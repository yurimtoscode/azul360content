import Link from 'next/link';
import { requireUser } from '@/lib/auth';
import { LayoutGrid, PenLine, Users, Layers3, CalendarDays, Images, Settings2, LogOut } from 'lucide-react';
export const dynamic = 'force-dynamic';
const nav = [
  { href: '/conteudos', title: 'Conteúdos', icon: LayoutGrid },
  { href: '/conteudos/novo', title: 'Criar conteúdo', icon: PenLine },
  { href: '/perfis', title: 'Perfis', icon: Users },
  { href: '/templates', title: 'Modelos', icon: Layers3 },
  { href: '/calendario', title: 'Calendário', icon: CalendarDays },
  { href: '/midia', title: 'Biblioteca', icon: Images },
  { href: '/configuracoes', title: 'Configurações', icon: Settings2 },
];
export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  await requireUser();
  return <div className="app-shell"><aside className="sidebar"><Link href="/conteudos" className="brand"><span className="brand-logo"><img src="/brand-assets/azul360-official.png" alt="Azul360" /></span><span><small>CONTENT STUDIO</small></span></Link><div className="side-caption">ESPAÇO DE TRABALHO</div><nav>{nav.map(({ href, title, icon: Icon }) => <Link key={href} href={href}><Icon size={18} strokeWidth={1.9} />{title}</Link>)}</nav><div className="sidebar-bottom"><div className="workspace-chip"><span className="workspace-avatar">A</span><span>Equipe Azul360<small>Ambiente interno</small></span></div><form action={async () => { 'use server'; const { cookies } = await import('next/headers'); (await cookies()).delete('azul360_session'); const { redirect } = await import('next/navigation'); redirect('/login'); }}><button className="logout" type="submit"><LogOut size={16} /> Sair</button></form></div></aside><div className="main-area"><header className="topbar"><span>ESTÚDIO / AZUL360</span><span className="topbar-right"><span className="status-dot" /> MVP · Ambiente de desenvolvimento</span></header><main className="main-content">{children}</main></div></div>;
}
