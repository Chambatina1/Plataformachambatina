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
  emailSolicitante: z.string().email('Email inválido').or(z.literal('')),
  telefonoSolicitante: z.string().min(6, 'El teléfono es requerido'),
  nombreDestinatario: z.string().min(2, 'El nombre del destinatario es requerido'),
  carnetDestinatario: z.string().optional().or(z.literal('')),
  direccionDestinatario: z.string().min(5, 'La dirección es requerida'),
  telefonoDestinatario: z.string().min(6, 'El teléfono del destinatario es requerido'),
  plataforma: z.string().min(1, 'Selecciona una plataforma'),
  linkProducto: z.string().url('El link del producto no es válido').or(z.literal('')),
  descripcionProducto: z.string().min(3, 'Describe el producto'),
  precioProducto: z.coerce.number().min(0).optional().default(0),
  notas: z.string().optional().or(z.literal('')),
});

// POST /api/compras-plataforma - Crear solicitud de compra por plataforma
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validated = compraSchema.safeParse(body);

    if (!validated.success) {
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
        { ok: false, error: `Plataforma no válida. Valores permitidos: ${PLATAFORMAS_VALIDAS.join(', ')}` },
        { status: 400 }
      );
    }

    // Crear el pedido con info de plataforma
    const pedido = await db.pedido.create({
      data: {
        nombreComprador: data.nombreSolicitante,
        emailComprador: data.emailSolicitante || '',
        telefonoComprador: data.telefonoSolicitante,
        nombreDestinatario: data.nombreDestinatario,
        telefonoDestinatario: data.telefonoDestinatario,
        carnetDestinatario: data.carnetDestinatario || '',
        direccionDestinatario: data.direccionDestinatario,
        producto: `[${plataforma.toUpperCase()}] ${data.descripcionProducto}`,
        notas: data.notas || null,
        plataforma: plataforma,
        linkProducto: data.linkProducto || null,
        estado: 'pendiente',
        updatedAt: new Date(),
      },
    });

    return NextResponse.json(
      { ok: true, data: pedido },
      { status: 201 }
    );
  } catch (error) {
    console.error('[Compras Plataforma] Error al crear solicitud:', error);
    return NextResponse.json(
      { ok: false, error: 'Error al procesar la solicitud' },
      { status: 500 }
    );
  }
}

// GET /api/compras-plataforma - Obtener compras por plataforma (admin)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const plataforma = searchParams.get('plataforma');
    const estado = searchParams.get('estado');

    const where: Record<string, unknown> = {
      plataforma: { not: null },
    };

    if (plataforma) {
      where.plataforma = plataforma;
    }

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
