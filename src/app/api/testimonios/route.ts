import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET /api/testimonios — Get public testimonials
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 50);
    const admin = searchParams.get('admin') === 'true';

    const where = admin ? {} : { activo: true };

    const testimonios = await db.testimonio.findMany({
      where,
      include: {
        user: {
          select: { id: true, nombre: true, ciudad: true },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });

    return NextResponse.json({ ok: true, data: testimonios });
  } catch (error) {
    console.error('[Testimonios] Error:', error);
    return NextResponse.json({ ok: false, error: 'Error interno' }, { status: 500 });
  }
}

// POST /api/testimonios — Create testimonial
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, texto, rating } = body;

    if (!userId || !texto?.trim()) {
      return NextResponse.json(
        { ok: false, error: 'Datos incompletos' },
        { status: 400 }
      );
    }

    if (texto.trim().length < 10) {
      return NextResponse.json(
        { ok: false, error: 'Escribe al menos 10 caracteres' },
        { status: 400 }
      );
    }

    const user = await db.user.findUnique({ where: { id: userId } });
    if (!user) {
      return NextResponse.json({ ok: false, error: 'Usuario no encontrado' }, { status: 404 });
    }

    const testimonio = await db.testimonio.create({
      data: {
        userId,
        nombre: user.nombre,
        texto: texto.trim().substring(0, 500),
        rating: Math.min(Math.max(rating || 5, 1), 5),
      },
    });

    return NextResponse.json({ ok: true, data: testimonio }, { status: 201 });
  } catch (error) {
    console.error('[Testimonios] Error creating:', error);
    return NextResponse.json({ ok: false, error: 'Error al crear testimonio' }, { status: 500 });
  }
}

// DELETE /api/testimonios?id=X&userId=Y — Delete testimonial
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = parseInt(searchParams.get('id') || '0');
    const userId = searchParams.get('userId');
    const admin = searchParams.get('admin') === 'true';

    if (!id) {
      return NextResponse.json({ ok: false, error: 'ID requerido' }, { status: 400 });
    }

    if (admin) {
      await db.testimonio.delete({ where: { id } });
    } else if (userId) {
      await db.testimonio.deleteMany({ where: { id, userId: parseInt(userId) } });
    } else {
      return NextResponse.json({ ok: false, error: 'Sin permisos' }, { status: 403 });
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('[Testimonios] Error deleting:', error);
    return NextResponse.json({ ok: false, error: 'Error al eliminar' }, { status: 500 });
  }
}
