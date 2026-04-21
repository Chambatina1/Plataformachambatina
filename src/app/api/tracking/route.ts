import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { parsearTrackingTSV, normalizarCPK } from '@/lib/chambatina';

// GET /api/tracking - List all tracking entries
export async function GET() {
  try {
    const entries = await db.trackingEntry.findMany({
      orderBy: { createdAt: 'desc' },
    });
    return NextResponse.json({ ok: true, data: entries });
  } catch (error) {
    console.error('Error fetching tracking entries:', error);
    return NextResponse.json({ ok: false, error: 'Error al obtener entradas de rastreo' }, { status: 500 });
  }
}

// POST /api/tracking - Parse and save TSV block
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { bloque } = body;

    if (!bloque || typeof bloque !== 'string') {
      return NextResponse.json({ ok: false, error: 'Se requiere un bloque de datos TSV' }, { status: 400 });
    }

    const parsed = parsearTrackingTSV(bloque);

    if (parsed.length === 0) {
      return NextResponse.json({ ok: false, error: 'No se encontraron entradas válidas en el bloque de datos' }, { status: 400 });
    }

    const results = [];
    for (const entry of parsed) {
      // Upsert: if CPK exists, update it; otherwise create new
      const existing = await db.trackingEntry.findFirst({
        where: { cpk: entry.cpk },
      });

      if (existing) {
        const updated = await db.trackingEntry.update({
          where: { id: existing.id },
          data: {
            fecha: entry.fecha || existing.fecha,
            estado: entry.estado,
            descripcion: entry.descripcion || existing.descripcion,
            embarcador: entry.embarcador || existing.embarcador,
            consignatario: entry.consignatario || existing.consignatario,
            carnetPrincipal: entry.carnetPrincipal || existing.carnetPrincipal,
            rawData: entry.rawData,
          },
        });
        results.push(updated);
      } else {
        const created = await db.trackingEntry.create({
          data: {
            cpk: entry.cpk,
            fecha: entry.fecha,
            estado: entry.estado,
            descripcion: entry.descripcion,
            embarcador: entry.embarcador,
            consignatario: entry.consignatario,
            carnetPrincipal: entry.carnetPrincipal,
            rawData: entry.rawData,
          },
        });
        results.push(created);
      }
    }

    return NextResponse.json({ ok: true, data: results, count: results.length });
  } catch (error) {
    console.error('Error processing tracking data:', error);
    return NextResponse.json({ ok: false, error: 'Error al procesar datos de rastreo' }, { status: 500 });
  }
}
