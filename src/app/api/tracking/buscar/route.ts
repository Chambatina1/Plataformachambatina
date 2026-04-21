import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { normalizarCPK, estadoPorTiempo, ETAPAS } from '@/lib/chambatina';

// Map real estado string to matching ETAPA for timeline display
function matchEtapa(estado: string) {
  const upper = estado.toUpperCase().trim();
  for (const etapa of ETAPAS) {
    if (upper === etapa.estado || upper.includes(etapa.estado)) {
      return etapa;
    }
  }
  // Fallback mappings for common variations
  if (upper.includes('ENTREGADO')) return ETAPAS.find(e => e.estado === 'ENTREGADO');
  if (upper.includes('DISTRIBUCION') || upper.includes('DISTRIBUCIÓN') || upper.includes('REPARTO')) return ETAPAS.find(e => e.estado === 'EN DISTRIBUCION');
  if (upper.includes('ADUANA')) return ETAPAS.find(e => e.estado === 'EN ADUANA');
  if (upper.includes('TRANSITO') || upper.includes('TRÁNSITO')) return ETAPAS.find(e => e.estado === 'EN TRANSITO');
  if (upper.includes('AGENCIA') || upper.includes('RECIBIDO') || upper.includes('PENDIENTE')) return ETAPAS.find(e => e.estado === 'EN AGENCIA');
  if (upper.includes('EMBARCADO')) return ETAPAS.find(e => e.estado === 'EN AGENCIA');
  return null;
}

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
    } else if (carnet) {
      const normalizedCarnet = carnet.replace(/\s/g, '');
      const allEntries = await db.trackingEntry.findMany({
        orderBy: { createdAt: 'desc' },
      });

      results = allEntries.filter(e => {
        if (!e.carnetPrincipal) return false;
        return e.carnetPrincipal.replace(/\s/g, '').includes(normalizedCarnet);
      });
    }

    // Add etapaInfo for timeline display - prioritize real estado, fallback to calculated
    results = (results || []).map(entry => {
      const matchedEtapa = matchEtapa(entry.estado);
      const etapaInfo = matchedEtapa || estadoPorTiempo(entry.fecha || '');
      return {
        ...entry,
        estadoCalculado: estadoPorTiempo(entry.fecha || '').estado,
        etapaInfo,
      };
    });

    return NextResponse.json({ ok: true, data: results });
  } catch (error) {
    console.error('Error searching tracking:', error);
    return NextResponse.json({ ok: false, error: 'Error al buscar en rastreo' }, { status: 500 });
  }
}
