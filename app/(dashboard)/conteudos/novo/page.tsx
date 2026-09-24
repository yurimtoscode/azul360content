import { db } from '@/lib/db';
import { ContentEditor } from '@/components/editor/ContentEditor';
export default async function NewContent() {
  const [profiles, templates] = await Promise.all([db.profile.findMany({ orderBy: { name: 'asc' } }), db.template.findMany({ orderBy: { name: 'asc' } })]);
  return <ContentEditor profiles={profiles} templates={templates} />;
}
