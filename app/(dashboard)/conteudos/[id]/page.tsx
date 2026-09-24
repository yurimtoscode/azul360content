import { notFound } from 'next/navigation';
import { db } from '@/lib/db';
import { ContentEditor } from '@/components/editor/ContentEditor';
export default async function EditContent({ params }: { params: Promise<{ id: string }> }) {
  const [profiles, templates, content] = await Promise.all([db.profile.findMany({ orderBy: { name: 'asc' } }), db.template.findMany({ orderBy: { name: 'asc' } }), db.content.findUnique({ where: { id: (await params).id } })]);
  if (!content) notFound();
  return <ContentEditor profiles={profiles} templates={templates} initial={{ ...content, sourceDate: content.sourceDate?.toISOString().slice(0,10) || '', sourceUrl: content.sourceUrl || '', photoUrl: content.photoUrl || '' }} />;
}
