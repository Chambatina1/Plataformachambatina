import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET /api/public-forms — List all forms (admin use)
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const estado = searchParams.get('estado'); // "activo" | "todos"

    const where: any = {};
    if (estado === 'activo') where.activo = true;

    const forms = await db.publicForm.findMany({
      where,
      include: {
        _count: {
          select: {
            submissions: { where: { estado: 'pendiente' } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ ok: true, data: forms });
  } catch (err: any) {
    console.error('Error fetching public forms:', err);
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 });
  }
}

// POST /api/public-forms — Create a new form
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { nombre, descripcion, campos } = body;

    if (!nombre || typeof nombre !== 'string' || nombre.trim().length === 0) {
      return NextResponse.json({ ok: false, error: 'El nombre es obligatorio' }, { status: 400 });
    }

    // Generate unique 8-char code
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let codigo: string;
    let exists = true;
    let attempts = 0;
    while (exists && attempts < 50) {
      codigo = '';
      for (let i = 0; i < 8; i++) codigo += chars[Math.floor(Math.random() * chars.length)];
      const found = await db.publicForm.findUnique({ where: { codigo } });
      exists = !!found;
      attempts++;
    }
    if (exists) {
      return NextResponse.json({ ok: false, error: 'No se pudo generar código único' }, { status: 500 });
    }

    const form = await db.publicForm.create({
      data: {
        nombre: nombre.trim(),
        descripcion: descripcion?.trim() || null,
        campos: JSON.stringify(campos || []),
      },
    });

    return NextResponse.json({ ok: true, data: form }, { status: 201 });
  } catch (err: any) {
    console.error('Error creating public form:', err);
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 });
  }
}

// PUT /api/public-forms — Update a form
export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, nombre, descripcion, campos, activo } = body;

    if (!id) {
      return NextResponse.json({ ok: false, error: 'ID es obligatorio' }, { status: 400 });
    }

    const updateData: any = {};
    if (nombre !== undefined) updateData.nombre = nombre.trim();
    if (descripcion !== undefined) updateData.descripcion = descripcion?.trim() || null;
    if (campos !== undefined) updateData.campos = JSON.stringify(campos);
    if (activo !== undefined) updateData.activo = activo;

    const form = await db.publicForm.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({ ok: true, data: form });
  } catch (err: any) {
    console.error('Error updating public form:', err);
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 });
  }
}

// DELETE /api/public-forms — Delete a form and its submissions
export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = parseInt(searchParams.get('id') || '');

    if (!id) {
      return NextResponse.json({ ok: false, error: 'ID es obligatorio' }, { status: 400 });
    }

    await db.publicForm.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (err: any) {
    console.error('Error deleting public form:', err);
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 });
  }
}
