import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// Categorias disponibles
export const CATEGORIAS = [
  'general',
  'hogar',
  'tecnologia',
  'belleza',
  'educacion',
  'transporte',
  'alimentos',
  'construccion',
  'arte',
  'salud',
  'legal',
  'otros',
] as const;

const TIPOS_VALIDOS = ['oferta', 'necesidad'] as const;

// GET /api/servicios — Public browse
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const tipo = searchParams.get('tipo') || '';
    const categoria = searchParams.get('categoria') || '';
    const ciudad = searchParams.get('ciudad') || '';
    const search = searchParams.get('q') || '';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = Math.min(parseInt(searchParams.get('limit') || '30'), 100);
    const userId = searchParams.get('userId');
    const admin = searchParams.get('admin') === 'true';

    // Build where clause
    const where: any = {};
    if (admin !== 'true') {
      where.activo = true;
    }
    if (tipo && TIPOS_VALIDOS.includes(tipo as any)) {
      where.tipo = tipo;
    }
    if (categoria) {
      where.categoria = categoria;
    }
    if (ciudad) {
      where.ciudad = { contains: ciudad, mode: 'insensitive' };
    }
    if (userId) {
      where.userId = parseInt(userId);
    }
    if (search) {
      where.OR = [
        { titulo: { contains: search, mode: 'insensitive' } },
        { descripcion: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [listings, total] = await Promise.all([
      db.serviceListing.findMany({
        where,
        include: {
          user: {
            select: { id: true, nombre: true, ciudad: true },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      db.serviceListing.count({ where }),
    ]);

    return NextResponse.json({
      ok: true,
      data: listings,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
      categorias: CATEGORIAS,
    });
  } catch (error) {
    console.error('[Servicios] Error fetching:', error);
    return NextResponse.json(
      { ok: false, error: 'Error al obtener servicios' },
      { status: 500 }
    );
  }
}

// POST /api/servicios — Create listing
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { tipo, titulo, descripcion, categoria, ciudad, precio, contacto, imagenUrl, userId } = body;

    // Validations
    if (!userId || typeof userId !== 'number') {
      return NextResponse.json(
        { ok: false, error: 'Debes iniciar sesion para publicar' },
        { status: 401 }
      );
    }
    if (!tipo || !TIPOS_VALIDOS.includes(tipo)) {
      return NextResponse.json(
        { ok: false, error: 'Tipo invalido (oferta o necesidad)' },
        { status: 400 }
      );
    }
    if (!titulo || typeof titulo !== 'string' || titulo.trim().length < 3) {
      return NextResponse.json(
        { ok: false, error: 'El titulo debe tener al menos 3 caracteres' },
        { status: 400 }
      );
    }
    if (titulo.length > 120) {
      return NextResponse.json(
        { ok: false, error: 'El titulo no puede superar 120 caracteres' },
        { status: 400 }
      );
    }

    // Check user exists
    const user = await db.user.findUnique({ where: { id: userId } });
    if (!user) {
      return NextResponse.json(
        { ok: false, error: 'Usuario no encontrado' },
        { status: 404 }
      );
    }

    const listing = await db.serviceListing.create({
      data: {
        tipo,
        titulo: titulo.trim(),
        descripcion: descripcion?.trim()?.substring(0, 1000) || null,
        categoria: categoria || 'general',
        ciudad: ciudad?.trim() || null,
        precio: precio?.trim() || null,
        contacto: contacto?.trim() || null,
        imagenUrl: imagenUrl?.trim() || null,
        userId,
      },
      include: {
        user: { select: { id: true, nombre: true, ciudad: true } },
      },
    });

    return NextResponse.json({ ok: true, data: listing }, { status: 201 });
  } catch (error) {
    console.error('[Servicios] Error creating:', error);
    return NextResponse.json(
      { ok: false, error: 'Error al crear publicacion' },
      { status: 500 }
    );
  }
}

// PUT /api/servicios — Update listing
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, userId, ...fields } = body;

    if (!id || !userId) {
      return NextResponse.json(
        { ok: false, error: 'ID y userId requeridos' },
        { status: 400 }
      );
    }

    // Only owner can update
    const existing = await db.serviceListing.findFirst({
      where: { id, userId },
    });
    if (!existing) {
      return NextResponse.json(
        { ok: false, error: 'Publicacion no encontrada o sin permisos' },
        { status: 404 }
      );
    }

    // Clean fields
    const updateData: any = {};
    if (fields.titulo !== undefined) updateData.titulo = fields.titulo.trim().substring(0, 120);
    if (fields.descripcion !== undefined) updateData.descripcion = fields.descripcion?.trim()?.substring(0, 1000) || null;
    if (fields.categoria !== undefined) updateData.categoria = fields.categoria || 'general';
    if (fields.ciudad !== undefined) updateData.ciudad = fields.ciudad?.trim() || null;
    if (fields.precio !== undefined) updateData.precio = fields.precio?.trim() || null;
    if (fields.contacto !== undefined) updateData.contacto = fields.contacto?.trim() || null;
    if (fields.tipo !== undefined && TIPOS_VALIDOS.includes(fields.tipo)) updateData.tipo = fields.tipo;
    if (fields.activo !== undefined) updateData.activo = Boolean(fields.activo);

    const updated = await db.serviceListing.update({
      where: { id },
      data: updateData,
      include: { user: { select: { id: true, nombre: true, ciudad: true } } },
    });

    return NextResponse.json({ ok: true, data: updated });
  } catch (error) {
    console.error('[Servicios] Error updating:', error);
    return NextResponse.json(
      { ok: false, error: 'Error al actualizar publicacion' },
      { status: 500 }
    );
  }
}

// DELETE /api/servicios — Soft delete (set activo=false)
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = parseInt(searchParams.get('id') || '0');
    const userId = parseInt(searchParams.get('userId') || '0');
    const adminDelete = searchParams.get('admin') === 'true';

    if (!id) {
      return NextResponse.json(
        { ok: false, error: 'ID requerido' },
        { status: 400 }
      );
    }

    if (adminDelete) {
      // Admin can hard delete
      await db.serviceListing.delete({ where: { id } });
    } else {
      // Owner soft delete
      if (!userId) {
        return NextResponse.json(
          { ok: false, error: 'userId requerido' },
          { status: 400 }
        );
      }
      const existing = await db.serviceListing.findFirst({ where: { id, userId } });
      if (!existing) {
        return NextResponse.json(
          { ok: false, error: 'Publicacion no encontrada' },
          { status: 404 }
        );
      }
      await db.serviceListing.update({
        where: { id },
        data: { activo: false },
      });
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('[Servicios] Error deleting:', error);
    return NextResponse.json(
      { ok: false, error: 'Error al eliminar publicacion' },
      { status: 500 }
    );
  }
}
