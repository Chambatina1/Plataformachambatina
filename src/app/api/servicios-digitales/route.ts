import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET /api/servicios-digitales - Return all services (active first, ordered by orden)
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const includeInactive = searchParams.get('all') === 'true';

    let services;
    try {
      services = await db.digitalService.findMany({
        where: includeInactive ? {} : { activo: true },
        orderBy: [{ orden: 'asc' }, { createdAt: 'desc' }],
      });
    } catch (dbError) {
      console.warn('DigitalService table not available yet:', dbError);
      return NextResponse.json({ ok: true, data: [] });
    }

    return NextResponse.json({ ok: true, data: services });
  } catch (error) {
    console.error('Error fetching digital services:', error);
    return NextResponse.json({ ok: true, data: [] });
  }
}

// POST /api/servicios-digitales - Create a new service
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { nombre, descripcion, precio, precioAntes, categoria, icono, activo, popular, orden } = body;

    if (!nombre?.trim()) {
      return NextResponse.json({ ok: false, error: 'El nombre es obligatorio' }, { status: 400 });
    }
    if (precio === undefined || precio === null || isNaN(Number(precio))) {
      return NextResponse.json({ ok: false, error: 'El precio es obligatorio' }, { status: 400 });
    }

    const service = await db.digitalService.create({
      data: {
        nombre: nombre.trim(),
        descripcion: descripcion?.trim() || null,
        precio: Number(precio),
        precioAntes: precioAntes != null ? Number(precioAntes) : null,
        categoria: categoria || 'general',
        icono: icono || null,
        activo: activo !== false,
        popular: popular === true,
        orden: Number(orden) || 0,
      },
    });

    return NextResponse.json({ ok: true, data: service });
  } catch (error) {
    console.error('Error creating digital service:', error);
    return NextResponse.json({ ok: false, error: 'Error al crear el servicio' }, { status: 500 });
  }
}

// PUT /api/servicios-digitales - Update a service
export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { id, ...updateData } = body;

    if (!id) {
      return NextResponse.json({ ok: false, error: 'ID es obligatorio' }, { status: 400 });
    }

    const existing = await db.digitalService.findUnique({ where: { id: Number(id) } });
    if (!existing) {
      return NextResponse.json({ ok: false, error: 'Servicio no encontrado' }, { status: 404 });
    }

    const data: Record<string, unknown> = {};
    if (updateData.nombre !== undefined) data.nombre = String(updateData.nombre).trim();
    if (updateData.descripcion !== undefined) data.descripcion = updateData.descripcion ? String(updateData.descripcion).trim() : null;
    if (updateData.precio !== undefined) data.precio = Number(updateData.precio);
    if (updateData.precioAntes !== undefined) data.precioAntes = updateData.precioAntes != null ? Number(updateData.precioAntes) : null;
    if (updateData.categoria !== undefined) data.categoria = String(updateData.categoria);
    if (updateData.icono !== undefined) data.icono = updateData.icono || null;
    if (updateData.activo !== undefined) data.activo = Boolean(updateData.activo);
    if (updateData.popular !== undefined) data.popular = Boolean(updateData.popular);
    if (updateData.orden !== undefined) data.orden = Number(updateData.orden) || 0;

    const service = await db.digitalService.update({
      where: { id: Number(id) },
      data,
    });

    return NextResponse.json({ ok: true, data: service });
  } catch (error) {
    console.error('Error updating digital service:', error);
    return NextResponse.json({ ok: false, error: 'Error al actualizar el servicio' }, { status: 500 });
  }
}

// DELETE /api/servicios-digitales - Delete a service
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ ok: false, error: 'ID es obligatorio' }, { status: 400 });
    }

    await db.digitalService.delete({ where: { id: Number(id) } });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('Error deleting digital service:', error);
    return NextResponse.json({ ok: false, error: 'Error al eliminar el servicio' }, { status: 500 });
  }
}
