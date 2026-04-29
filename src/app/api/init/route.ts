import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET() {
  try {
    const firstUser = await db.user.findFirst({ orderBy: { createdAt: 'asc' } });
    if (!firstUser) return NextResponse.json({ userId: '' });
    return NextResponse.json({ userId: String(firstUser.id) });
  } catch {
    return NextResponse.json({ userId: '' });
  }
}
