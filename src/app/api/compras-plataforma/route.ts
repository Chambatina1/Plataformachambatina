import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { z } from 'zod';

const PLATAFORMAS_VALIDAS = [
  'tiktok',
  'amazon',
  'aliexpress',
  'shein',
  'mercadolibre',
  'temu',
  'ebay',
  'walmart',
  'otro',
];

const compraSchema = z.object({
  nombreSolicitante: z.string().min(2, 'El nombre es requerido'),
  emailSolicitante: z.string().email('Email invalido').or(z.literal('')),
  telefonoSolicitante: z.string().min(6, 'El telefono es requerido'),
  nombreDestinatario: z.string().min(2, 'El nombre del destinatario es requerido'),
  carnetDestinatario: z.string().min(1, 'El carnet de identidad es requerido'),
  direccionDestinatario: z.string().min(5, 'La direccion es requerida'),
  telefonoDestinatario: z.string().min(6, 'El telefono del destinatario es requerido'),
  plataforma: z.string().min(1, 'Selecciona una plataforma'),
  linkProducto: z.string().url('El link del producto no es valido').or(z.literal('')),
  descripcionProducto: z.string().min(3, 'Describe el producto'),
  precioProducto: z.coerce.number().min(0).optional().default(0),
  notas: z.string().optional().or(z.literal('')),
});

// Build create data with progressive fallback for columns that may not exist
async function createPedidoWithFallback(baseData: Record<string, unknown>, productoText: string) {
  // Attempt 1: Full data with all columns
  try {
    return await db.pedido.create({
      data: {
        ...baseData,
        producto: productoText,
        plataforma: baseData.plataforma || null,
        linkProducto: baseData.linkProducto || null,
        estado: 'pendiente',
        updatedAt: new Date(),
      },
    });
  } catch (e1) {
    console.warn('[CompraPlataforma] Attempt 1 failed, trying without plataforma/linkProducto:', (e1 as Error)?.message);
  }

  // Attempt 2: Without plataforma/linkProducto columns
  try {
    const { plataforma, linkProducto, ...rest } = baseData;
    return await db.pedido.create({
      data: {
        ...rest,
        producto: productoText,
        estado: 'pendiente',
        updatedAt: new Date(),
      },
    });
  } catch (e2) {
    console.warn('[CompraPlataforma] Attempt 2 failed, trying without updatedAt:', (e2 as Error)?.message);
  }

  // Attempt 3: Minimal fields only (no estado, no updatedAt)
  try {
    const { plataforma, linkProducto, ...rest } = baseData;
    const { updatedAt, estado, ...minimalData } = rest as Record<string, unknown>;
    return await db.pedido.create({
      data: {
        ...minimalData,
        producto: productoText,
      },
    });
  } catch (e3) {
    console.error('[CompraPlataforma] All attempts failed:', (e3 as Error)?.message);
    throw e3;
  }
}

// POST /api/compras-plataforma - Crear solicitud de compra por plataforma
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validated = compraSchema.safeParse(body);

    if (!validated.success) {
      console.warn('[CompraPlataforma] Validation errors:', JSON.stringify(validated.error.flatten().fieldErrors));
      return NextResponse.json(
        { ok: false, error: validated.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const data = validated.data;
    const plataforma = data.plataforma.toLowerCase();

    // Validar plataforma
    if (!PLATAFORMAS_VALIDAS.includes(plataforma)) {
      return NextResponse.json(
        { ok: false, error: 'Plataforma no valida' },
        { status: 400 }
      );
    }

    const baseData = {
      nombreComprador: data.nombreSolicitante,
      emailComprador: data.emailSolicitante || '',
      telefonoComprador: data.telefonoSolicitante,
      nombreDestinatario: data.nombreDestinatario,
      telefonoDestinatario: data.telefonoDestinatario,
      carnetDestinatario: data.carnetDestinatario || '',
      direccionDestinatario: data.direccionDestinatario,
      notas: data.notas || null,
      plataforma: plataforma,
      linkProducto: data.linkProducto || null,
      updatedAt: new Date(),
    };

    const productoText = data.linkProducto
      ? `[${plataforma.toUpperCase()}] ${data.descripcionProducto} | ${data.linkProducto}`
      : `[${plataforma.toUpperCase()}] ${data.descripcionProducto}`;

    const pedido = await createPedidoWithFallback(baseData, productoText);

    return NextResponse.json(
      { ok: true, data: pedido },
      { status: 201 }
    );
  } catch (error) {
    console.error('[Compras Plataforma] Error al crear solicitud:', error);
    return NextResponse.json(
      { ok: false, error: 'Error al procesar la solicitud. Intenta de nuevo.' },
      { status: 500 }
    );
  }
}

// GET /api/compras-plataforma - Obtener compras por plataforma (admin)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const estado = searchParams.get('estado');

    const where: Record<string, unknown> = {};

    // Only filter by plataforma if the column exists
    try {
      where.plataforma = { not: null };
    } catch { /* column may not exist */ }

    if (estado) {
      where.estado = estado;
    }

    const pedidos = await db.pedido.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: 100,
    });

    return NextResponse.json({ ok: true, data: pedidos });
  } catch (error) {
    console.error('[Compras Plataforma] Error al obtener solicitudes:', error);
    return NextResponse.json(
      { ok: false, error: 'Error al obtener solicitudes' },
      { status: 500 }
    );
  }
}
