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

// GET /api/tracking/buscar?cpk=XXX or ?carnet=XXX or ?q=XXX (smart search)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const cpk = searchParams.get('cpk');
    const carnet = searchParams.get('carnet');
    const q = searchParams.get('q'); // Smart search - auto detect CPK or carnet

    // Smart search: if q is provided, auto-detect what it is
    let searchCPK = cpk;
    let searchCarnet = carnet;

    if (q && !cpk && !carnet) {
      const trimmed = q.trim();
      
      // Check if it contains CPK prefix
      if (/CPK/i.test(trimmed)) {
        searchCPK = trimmed;
      }
      // Check if it looks like a CPK number (digits only, 4-8 digits)
      else if (/^\d{4,8}$/.test(trimmed)) {
        // Could be partial CPK number - search by contains
        searchCPK = trimmed;
      }
      // Check if it looks like a carnet (8-12 digits)
      else if (/^\d{8,12}$/.test(trimmed)) {
        searchCarnet = trimmed;
      }
      // Otherwise, try CPK first (might have mixed format)
      else {
        searchCPK = trimmed;
      }
    }

    if (!searchCPK && !searchCarnet) {
      return NextResponse.json({ ok: false, error: 'Se requiere un número de búsqueda' }, { status: 400 });
    }

    let results;

    if (searchCPK) {
      const normalizedCPK = normalizarCPK(searchCPK);
      
      // First try exact match
      results = await db.trackingEntry.findMany({
        where: { cpk: normalizedCPK },
        orderBy: { createdAt: 'desc' },
      });

      // If no exact match and searchCPK is just digits (partial), try contains search
      if (results.length === 0 && /^\d+$/.test(searchCPK.trim())) {
        const digits = searchCPK.trim();
        // Pad to 7 digits for searching
        const paddedDigits = digits.padStart(7, '0');
        results = await db.trackingEntry.findMany({
          where: {
            cpk: { contains: paddedDigits },
          },
          orderBy: { createdAt: 'desc' },
        });

        // Also try with various CPK formats
        if (results.length === 0) {
          const allEntries = await db.trackingEntry.findMany({
            orderBy: { createdAt: 'desc' },
          });
          results = allEntries.filter(e => {
            const numOnly = e.cpk.replace(/[^0-9]/g, '');
            return numOnly.includes(digits) || paddedDigits.includes(numOnly) || numOnly.includes(paddedDigits);
          });
        }
      }
    } else if (searchCarnet) {
      const normalizedCarnet = searchCarnet.replace(/\s/g, '');
      const allEntries = await db.trackingEntry.findMany({
        orderBy: { createdAt: 'desc' },
      });

      results = allEntries.filter(e => {
        if (!e.carnetPrincipal) return false;
        return e.carnetPrincipal.replace(/\s/g, '').includes(normalizedCarnet);
      });
    }

    // Add etapaInfo for timeline display
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
