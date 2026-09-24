import { NextResponse } from 'next/server';
import { timingSafeEqual } from 'node:crypto';
import { refreshSources } from '@/lib/ai/sources';

export const maxDuration = 120;
export async function POST(request: Request) {
  const secret = process.env.CRON_SECRET;
  const supplied = request.headers.get('authorization')?.replace(/^Bearer /i, '') || '';
  if (!secret || secret.length < 32 || supplied.length !== secret.length ||
      !timingSafeEqual(Buffer.from(secret), Buffer.from(supplied))) {
    return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 });
  }
  const results = await refreshSources();
  return NextResponse.json({ checked: results.length, succeeded: results.filter(x => x.ok).length, failures: results.filter(x => !x.ok) });
}
