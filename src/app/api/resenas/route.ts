import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export const dynamic = 'force-dynamic';

// GET /api/resenas?activas=true
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const soloActivas = searchParams.get('activas') === 'true';
    const admin = searchParams.get('admin') === 'true';

    const where: any = {};
    if (soloActivas && !admin) where.activa = true;

    const resenas = await db.resena.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: admin ? 200 : 50,
    });

    // Calculate average rating
    const activas = resenas.filter(r => r.activa);
    const promedio = activas.length > 0
      ? activas.reduce((sum, r) => sum + r.estrellas, 0) / activas.length
      : 0;

    return NextResponse.json({
      ok: true,
      data: {
        resenas,
        total: resenas.length,
        totalActivas: activas.length,
        promedio: Math.round(promedio * 10) / 10,
      },
    });
  } catch (error: any) {
    console.error('[Resenas] Error:', error);
    return NextResponse.json({ ok: false, error: 'Error al obtener resenas' }, { status: 500 });
  }
}

// POST /api/resenas - Crear nueva resena (publico, sin auth)
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { nombre, estrellas, comentario, servicio } = body;

    // Validations
    if (!nombre || nombre.trim().length < 2) {
      return NextResponse.json({ ok: false, error: 'El nombre es requerido (minimo 2 caracteres)' }, { status: 400 });
    }
    if (!estrellas || estrellas < 1 || estrellas > 5) {
      return NextResponse.json({ ok: false, error: 'Las estrellas deben ser entre 1 y 5' }, { status: 400 });
    }
    if (!comentario || comentario.trim().length < 10) {
      return NextResponse.json({ ok: false, error: 'El comentario es requerido (minimo 10 caracteres)' }, { status: 400 });
    }
    if (comentario.length > 500) {
      return NextResponse.json({ ok: false, error: 'El comentario no puede superar los 500 caracteres' }, { status: 400 });
    }

    const resena = await db.resena.create({
      data: {
        nombre: nombre.trim(),
        estrellas: Math.round(estrellas),
        comentario: comentario.trim(),
        servicio: servicio ? servicio.trim() : null,
        activa: false, // Admin must approve first
      },
    });

    return NextResponse.json({
      ok: true,
      data: resena,
      message: 'Gracias por tu opinion! Tu resena sera revisada y publicada pronto.',
    });
  } catch (error: any) {
    console.error('[Resenas] Error:', error);
    return NextResponse.json({ ok: false, error: 'Error al guardar la resena' }, { status: 500 });
  }
}

// PUT /api/resenas - Admin: approve or toggle resena
export async function PUT(req: Request) {
  try {
    const body = await req.json();
    const { id, activa } = body;

    if (!id) {
      return NextResponse.json({ ok: false, error: 'ID requerido' }, { status: 400 });
    }

    const resena = await db.resena.update({
      where: { id },
      data: { activa: activa !== undefined ? activa : true },
    });

    return NextResponse.json({ ok: true, data: resena });
  } catch (error: any) {
    console.error('[Resenas] Error:', error);
    return NextResponse.json({ ok: false, error: 'Error al actualizar resena' }, { status: 500 });
  }
}

// DELETE /api/resenas?id=X
export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = parseInt(searchParams.get('id') || '');

    if (!id) {
      return NextResponse.json({ ok: false, error: 'ID requerido' }, { status: 400 });
    }

    await db.resena.delete({ where: { id } });
    return NextResponse.json({ ok: true, message: 'Resena eliminada' });
  } catch (error: any) {
    console.error('[Resenas] Error:', error);
    return NextResponse.json({ ok: false, error: 'Error al eliminar resena' }, { status: 500 });
  }
}
