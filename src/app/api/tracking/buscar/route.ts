import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { normalizarCPK, estadoPorTiempo } from '@/lib/chambatina';

// GET /api/tracking/buscar?cpk=XXX or ?carnet=XXX
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const cpk = searchParams.get('cpk');
    const carnet = searchParams.get('carnet');

    if (!cpk && !carnet) {
      return NextResponse.json({ ok: false, error: 'Se requiere parámetro cpk o carnet' }, { status: 400 });
    }

    let results;

    if (cpk) {
      const normalizedCPK = normalizarCPK(cpk);
      results = await db.trackingEntry.findMany({
        where: { cpk: normalizedCPK },
        orderBy: { createdAt: 'desc' },
      });

      // Add calculated estado based on date
      results = results.map(entry => ({
        ...entry,
        estadoCalculado: estadoPorTiempo(entry.fecha || '').estado,
        etapaInfo: estadoPorTiempo(entry.fecha || ''),
      }));
    } else if (carnet) {
      const normalizedCarnet = carnet.replace(/\s/g, '');
      const allEntries = await db.trackingEntry.findMany({
        orderBy: { createdAt: 'desc' },
      });

      results = allEntries.filter(e => {
        if (!e.carnetPrincipal) return false;
        return e.carnetPrincipal.replace(/\s/g, '').includes(normalizedCarnet);
      });

      results = results.map(entry => ({
        ...entry,
        estadoCalculado: estadoPorTiempo(entry.fecha || '').estado,
        etapaInfo: estadoPorTiempo(entry.fecha || ''),
      }));
    }

    return NextResponse.json({ ok: true, data: results });
  } catch (error) {
    console.error('Error searching tracking:', error);
    return NextResponse.json({ ok: false, error: 'Error al buscar en rastreo' }, { status: 500 });
  }
}
