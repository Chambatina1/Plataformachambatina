import { NextResponse } from 'next/server';
import { BICICLETAS, CAJAS, PRECIOS_POR_LIBRA, CARGO_EQUIPO } from '@/lib/chambatina';

// GET /api/tienda - Returns all products/services with prices
export async function GET() {
  try {
    const productos = {
      envios: {
        nombre: 'Envíos a Cuba',
        descripcion: 'Servicio de envío de paquetes a Cuba con diferentes opciones',
        items: [
          {
            id: 'equipo',
            nombre: 'Envío por Equipo',
            descripcion: 'Lleva tu paquete a nuestra oficina',
            precio: PRECIOS_POR_LIBRA.equipo,
            unidad: 'por libra',
            cargoAdicional: `+$${CARGO_EQUIPO} cargo de equipo`,
            formula: `(Peso × $${PRECIOS_POR_LIBRA.equipo}) + $${CARGO_EQUIPO}`,
          },
          {
            id: 'recogida',
            nombre: 'Recogida a Domicilio',
            descripcion: 'Recogemos tu paquete en tu casa',
            precio: PRECIOS_POR_LIBRA.recogida,
            unidad: 'por libra',
            cargoAdicional: null,
            formula: `Peso × $${PRECIOS_POR_LIBRA.recogida}`,
          },
          {
            id: 'tiktok',
            nombre: 'Compras TikTok',
            descripcion: 'Precio especial para compras desde TikTok',
            precio: PRECIOS_POR_LIBRA.tiktok,
            unidad: 'por libra',
            cargoAdicional: null,
            formula: `Peso × $${PRECIOS_POR_LIBRA.tiktok}`,
          },
        ],
      },
      bicicletas: {
        nombre: 'Bicicletas',
        descripcion: 'Envío de bicicletas a Cuba',
        items: BICICLETAS.map((b, i) => ({
          id: b.tipo,
          nombre: b.descripcion,
          descripcion: b.descripcion,
          precio: b.precio,
          unidad: 'precio fijo',
          cargoAdicional: null,
        })),
      },
      cajas: {
        nombre: 'Cajas',
        descripcion: 'Cajas de envío con precio fijo según tamaño',
        items: CAJAS.map((c, i) => ({
          id: `caja_${i}`,
          nombre: c.nombre,
          descripcion: `${c.dimensiones} - hasta ${c.pesoMaximo} lb`,
          precio: c.precio,
          unidad: 'precio fijo',
          cargoAdicional: null,
        })),
      },
      solar: {
        nombre: 'Sistemas Solares',
        descripcion: 'Orientación y productos de energía solar EcoFlow',
        items: [
          {
            id: 'solar_consultoria',
            nombre: 'Consultoría Solar',
            descripcion: 'Orientación personalizada sobre sistemas de energía solar para Cuba',
            precio: 0,
            unidad: 'gratuito',
            cargoAdicional: null,
          },
          {
            id: 'ecoflow',
            nombre: 'EcoFlow',
            descripcion: 'Sistemas de energía portátil EcoFlow - consulte disponibilidad y precios',
            precio: 0,
            unidad: 'bajo consulta',
            cargoAdicional: null,
          },
        ],
      },
    };

    return NextResponse.json({ ok: true, data: productos });
  } catch (error) {
    console.error('Error fetching tienda:', error);
    return NextResponse.json({ ok: false, error: 'Error al obtener productos' }, { status: 500 });
  }
}
