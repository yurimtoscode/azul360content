import { db } from '@/lib/db';
import { ProfileCard } from '@/components/profiles/ProfileCard';
export default async function Profiles() { const profiles = await db.profile.findMany({ orderBy: { name: 'asc' } }); return <><div className="page-heading"><div><span className="eyebrow">IDENTIDADES</span><h1>Perfis da equipe.</h1><p>Cada voz tem suas próprias regras, visual e maneira de conversar.</p></div></div><div className="profiles-grid">{profiles.map(profile => <ProfileCard key={profile.id} initial={profile} />)}</div></>; }
