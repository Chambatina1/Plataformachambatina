import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { z } from 'zod';

const ONLINE_THRESHOLD_MINUTES = 2;

const heartbeatSchema = z.object({
  userId: z.number().int().positive(),
  sessionId: z.string().min(1),
  page: z.string().optional(),
});

// POST /api/presence — Heartbeat: upsert user online status
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validated = heartbeatSchema.safeParse(body);

    if (!validated.success) {
      return NextResponse.json(
        { ok: false, error: 'Datos invalidos' },
        { status: 400 }
      );
    }

    const { userId, sessionId, page } = validated.data;

    const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
               request.headers.get('x-real-ip') ||
               null;
    const userAgent = request.headers.get('user-agent')?.substring(0, 200) || null;

    await db.onlinePresence.upsert({
      where: { sessionId },
      create: {
        userId,
        sessionId,
        page: page || '/',
        userAgent,
        ip: ip?.substring(0, 45),
      },
      update: {
        page: page || undefined,
        lastSeen: new Date(),
      },
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('[Presence] Error updating heartbeat:', error);
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}

// DELETE /api/presence — Remove session (user left)
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get('sessionId');

    if (!sessionId) {
      return NextResponse.json({ ok: false, error: 'sessionId requerido' }, { status: 400 });
    }

    await db.onlinePresence.deleteMany({ where: { sessionId } });
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('[Presence] Error removing session:', error);
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}

// GET /api/presence — Get currently online users (admin)
export async function GET() {
  try {
    const threshold = new Date(Date.now() - ONLINE_THRESHOLD_MINUTES * 60 * 1000);

    // Clean stale sessions first
    await db.onlinePresence.deleteMany({
      where: { lastSeen: { lt: threshold } },
    });

    const onlineUsers = await db.onlinePresence.findMany({
      where: { lastSeen: { gte: threshold } },
      include: {
        user: {
          select: {
            id: true,
            nombre: true,
            email: true,
            telefono: true,
            ciudad: true,
          },
        },
      },
      orderBy: { lastSeen: 'desc' },
    });

    return NextResponse.json({
      ok: true,
      data: onlineUsers,
      count: onlineUsers.length,
      thresholdMinutes: ONLINE_THRESHOLD_MINUTES,
    });
  } catch (error) {
    console.error('[Presence] Error fetching online users:', error);
    return NextResponse.json({ ok: false, error: 'Error al obtener usuarios online' }, { status: 500 });
  }
}
