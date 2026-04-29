import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET /api/notificaciones?userId=X — Returns notifications and unread count
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ ok: false, error: 'userId requerido' }, { status: 400 });
    }

    const [notifications, unreadCount] = await Promise.all([
      db.notification.findMany({
        where: { userId: parseInt(userId, 10) },
        orderBy: { createdAt: 'desc' },
        take: 50,
      }),
      db.notification.count({
        where: { userId: parseInt(userId, 10), read: false },
      }),
    ]);

    return NextResponse.json({
      ok: true,
      data: {
        notifications,
        unreadCount,
      },
    });
  } catch (error) {
    console.error('[Notificaciones] Error:', error);
    return NextResponse.json({ ok: false, error: 'Error al obtener notificaciones' }, { status: 500 });
  }
}

// POST /api/notificaciones — Mark notification as read or mark all as read
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, notificationId, markAll } = body;

    if (!userId) {
      return NextResponse.json({ ok: false, error: 'userId requerido' }, { status: 400 });
    }

    if (markAll) {
      await db.notification.updateMany({
        where: { userId: parseInt(userId, 10), read: false },
        data: { read: true },
      });
      return NextResponse.json({ ok: true, message: 'Todas las notificaciones marcadas como leídas' });
    }

    if (notificationId) {
      await db.notification.update({
        where: { id: notificationId },
        data: { read: true },
      });
      return NextResponse.json({ ok: true, message: 'Notificación marcada como leída' });
    }

    return NextResponse.json({ ok: false, error: 'notificationId o markAll requerido' }, { status: 400 });
  } catch (error) {
    console.error('[Notificaciones] Error:', error);
    return NextResponse.json({ ok: false, error: 'Error al actualizar notificación' }, { status: 500 });
  }
}
