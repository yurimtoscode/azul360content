import { NextResponse } from 'next/server';
import { compare } from 'bcryptjs';
import { db } from '@/lib/db';
import { startSession } from '@/lib/auth';

export async function POST(request: Request) {
  const { email, password } = await request.json();
  if (typeof email !== 'string' || typeof password !== 'string') return NextResponse.json({ error: 'Dados inválidos.' }, { status: 400 });
  const user = await db.user.findUnique({ where: { email: email.toLowerCase().trim() } });
  if (!user || !(await compare(password, user.passwordHash))) return NextResponse.json({ error: 'Credenciais inválidas.' }, { status: 401 });
  await startSession(user);
  return NextResponse.json({ ok: true });
}
