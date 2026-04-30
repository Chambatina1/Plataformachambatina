import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET /api/messages — Fetch messages
// ?userId=X → conversation between admin and user X
// ?all=true → all recent conversations (admin view)
// ?unread=true&receiverId=X → count unread FROM users TO admin
// ?unread=true&userId=X → count unread FROM admin TO this user
// ?receiverId=X → messages for this user (including broadcasts)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userIdParam = searchParams.get('userId');
    const all = searchParams.get('all') === 'true';
    const unreadParam = searchParams.get('unread') === 'true';
    const receiverIdParam = searchParams.get('receiverId');

    // Count unread messages FROM users TO admin
    if (unreadParam && receiverIdParam) {
      const receiverId = parseInt(receiverIdParam);
      if (isNaN(receiverId)) {
        return NextResponse.json({ ok: false, error: 'receiverId invalido' }, { status: 400 });
      }
      const count = await db.internalMessage.count({
        where: {
          receiverId: 0,
          isRead: false,
          isAdmin: false,
        },
      });
      return NextResponse.json({ ok: true, data: { count } });
    }

    // Count unread messages FROM admin TO a user (public view)
    if (unreadParam && userIdParam) {
      const userId = parseInt(userIdParam);
      if (isNaN(userId)) {
        return NextResponse.json({ ok: false, error: 'userId invalido' }, { status: 400 });
      }
      const count = await db.internalMessage.count({
        where: {
          receiverId: userId,
          isRead: false,
          isAdmin: true,
        },
      });
      return NextResponse.json({ ok: true, data: { count } });
    }

    // All conversations (admin list view)
    if (all) {
      // Get all messages with non-null receiver to find conversations
      const messages = await db.internalMessage.findMany({
        where: {
          OR: [
            { receiverId: { not: null } },
            { isAdmin: false },
          ],
        },
        orderBy: { createdAt: 'desc' },
        take: 500,
      });

      // Group by user conversation
      const conversationMap = new Map<number, {
        userId: number;
        userName: string;
        lastMessage: string;
        lastMessageTime: string;
        lastSenderName: string;
        unreadCount: number;
      }>();

      for (const msg of messages) {
        let userId: number;

        if (msg.isAdmin) {
          // Admin sent to a user
          userId = msg.receiverId || 0;
        } else {
          // User sent message
          userId = msg.senderId;
        }

        if (userId === 0) continue; // skip broadcasts in conversation list

        const existing = conversationMap.get(userId);
        if (!existing) {
          conversationMap.set(userId, {
            userId,
            userName: msg.isAdmin ? (msg.receiverId?.toString() || 'Desconocido') : msg.senderName,
            lastMessage: msg.content.substring(0, 80),
            lastMessageTime: msg.createdAt.toISOString(),
            lastSenderName: msg.senderName,
            unreadCount: 0,
          });
        }
      }

      // Calculate unread counts per user
      const conversations = Array.from(conversationMap.values());
      for (const conv of conversations) {
        conv.unreadCount = await db.internalMessage.count({
          where: {
            receiverId: 0,
            senderId: conv.userId,
            isAdmin: false,
            isRead: false,
          },
        });
      }

      // Sort by most recent message
      conversations.sort((a, b) => new Date(b.lastMessageTime).getTime() - new Date(a.lastMessageTime).getTime());

      return NextResponse.json({ ok: true, data: conversations });
    }

    // Conversation between admin and specific user
    if (userIdParam) {
      const userId = parseInt(userIdParam);
      if (isNaN(userId)) {
        return NextResponse.json({ ok: false, error: 'userId invalido' }, { status: 400 });
      }

      const conversationMessages = await db.internalMessage.findMany({
        where: {
          OR: [
            { isAdmin: true, receiverId: userId },
            { isAdmin: false, senderId: userId },
          ],
        },
        orderBy: { createdAt: 'asc' },
        take: 500,
      });

      return NextResponse.json({ ok: true, data: conversationMessages });
    }

    // Default: messages for a specific user (public view)
    if (receiverIdParam) {
      const receiverId = parseInt(receiverIdParam);
      if (isNaN(receiverId)) {
        return NextResponse.json({ ok: false, error: 'receiverId invalido' }, { status: 400 });
      }

      const messages = await db.internalMessage.findMany({
        where: {
          OR: [
            { receiverId },
            { receiverId: null },
          ],
        },
        orderBy: { createdAt: 'asc' },
        take: 500,
      });

      return NextResponse.json({ ok: true, data: messages });
    }

    return NextResponse.json({ ok: false, error: 'Parametros insuficientes' }, { status: 400 });
  } catch (error) {
    console.error('[Messages] Error fetching messages:', error);
    return NextResponse.json({ ok: false, error: 'Error al obtener mensajes' }, { status: 500 });
  }
}

// POST /api/messages — Send a new message
// Body: { senderId, senderName, receiverId, content, isAdmin }
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { senderId, senderName, receiverId, content, isAdmin } = body;

    if (senderId === undefined || !senderName || !content) {
      return NextResponse.json(
        { ok: false, error: 'Datos requeridos: senderId, senderName, content' },
        { status: 400 }
      );
    }

    if (!content.trim()) {
      return NextResponse.json({ ok: false, error: 'El mensaje no puede estar vacio' }, { status: 400 });
    }

    const message = await db.internalMessage.create({
      data: {
        senderId: parseInt(senderId) || 0,
        senderName: String(senderName),
        receiverId: receiverId !== null && receiverId !== undefined ? parseInt(receiverId) : null,
        content: String(content).trim(),
        isAdmin: Boolean(isAdmin),
      },
    });

    return NextResponse.json({ ok: true, data: message });
  } catch (error) {
    console.error('[Messages] Error sending message:', error);
    return NextResponse.json({ ok: false, error: 'Error al enviar mensaje' }, { status: 500 });
  }
}

// PUT /api/messages — Mark messages as read
// Body: { userId }
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId } = body;

    if (!userId) {
      return NextResponse.json({ ok: false, error: 'userId requerido' }, { status: 400 });
    }

    const parsedUserId = parseInt(userId);
    if (isNaN(parsedUserId)) {
      return NextResponse.json({ ok: false, error: 'userId invalido' }, { status: 400 });
    }

    const result = await db.internalMessage.updateMany({
      where: {
        receiverId: parsedUserId,
        isRead: false,
      },
      data: {
        isRead: true,
      },
    });

    return NextResponse.json({ ok: true, data: { marked: result.count } });
  } catch (error) {
    console.error('[Messages] Error marking messages as read:', error);
    return NextResponse.json({ ok: false, error: 'Error al marcar mensajes' }, { status: 500 });
  }
}
