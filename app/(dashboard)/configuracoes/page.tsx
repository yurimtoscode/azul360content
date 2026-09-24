import { db } from '@/lib/db';
import { ProfileCard } from '@/components/profiles/ProfileCard';

export default async function Settings() {
  const [profiles, portals] = await Promise.all([db.profile.findMany({ orderBy: { name: 'asc' } }), db.portalSource.findMany({ orderBy: { name: 'asc' } })]);
  return <><div className="page-heading"><div><span className="eyebrow">SISTEMA</span><h1>Configurações.</h1><p>Defina a pasta de fotos autorizadas e a identidade de cada perfil.</p></div></div>
    <div className="settings-list"><div><strong>Geração automática</strong><span>{portals.length} canais cadastrados. Coleta diária após implantação e coleta sob demanda ao gerar; somente matérias com URL e data entram nos rascunhos.</span></div><div><strong>Google Drive</strong><span>Cadastre separadamente a pasta de fotos e a pasta de identidade visual de cada perfil. Compartilhe ambas com a conta de serviço configurada.</span></div><div><strong>Instagram</strong><span>Conexão, agendamento e publicação ainda não implementados.</span></div></div>
    <h2 className="section-title">Fontes de notícias · {portals.length} portais</h2><p className="helper-note">Um canal por publicação editorial. O cadastro não garante que o portal tenha RSS aberto. Apenas fontes cuja coleta já trouxe matérias com link e data podem alimentar a geração; consulte o resultado de cada uma.</p><div className="source-list">{portals.map(portal => <div key={portal.id} className="source-row"><strong>{portal.name}</strong><span>{!portal.lastCheckedAt ? 'Aguardando primeira coleta' : portal.lastError ? `Falha: ${portal.lastError}` : `Atualizado ${portal.lastSuccessAt?.toLocaleString('pt-BR')}`}</span><a href={portal.feedUrl || portal.homepageUrl} target="_blank" rel="noreferrer">{portal.feedUrl ? 'RSS' : 'Site'} ↗</a></div>)}</div>
    <h2 className="section-title">Pastas e identidade por perfil</h2><div className="profiles-grid">{profiles.map(profile => <ProfileCard key={profile.id} initial={profile} />)}</div>
  </>;
}
