import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { normalizarCPK, estadoPorTiempo, ETAPAS } from '@/lib/chambatina';
import { searchSolvedCargo, mapEstado } from '@/lib/solvedcargo';

// Map real estado string to matching ETAPA for timeline display (13 stages)
// Synced with solvedcargo.ts mapEstado - uses same SolvedCargo logistics logic
function matchEtapa(estado: string) {
  const upper = estado.toUpperCase().trim();

  // Exact 13-stage matches
  if (upper === 'ENTREGADO' || upper === 'ENTREGADO PP' || upper === 'ENTREGADO V') return ETAPAS.find(et => et.estado === 'ENTREGADO');
  if (upper.includes('DISTRIBUCION') || upper.includes('REPARTO')) return ETAPAS.find(et => et.estado === 'EN DISTRIBUCION');
  if (upper.includes('ALMACEN') && hasProvinciaMatch(upper)) return ETAPAS.find(et => et.estado === 'ALMACEN PROVINCIAL');
  if ((upper.startsWith('EN TRANSITO') || upper.startsWith('EN TRÁNSITO')) && hasProvinciaMatch(upper)) return ETAPAS.find(et => et.estado === 'TRASLADO PROVINCIA');
  if (upper.includes('ESPERA DE TRANSITO') || upper.includes('CLASIFICADO')) return ETAPAS.find(et => et.estado === 'CLASIFICACION');
  if (upper.includes('ALMACEN')) return ETAPAS.find(et => et.estado === 'ALMACEN CENTRAL');
  if (upper === 'CLASIFICACION' || upper.includes('CLASIFICACIÓN')) return ETAPAS.find(et => et.estado === 'CLASIFICACION');
  if (upper === 'DESPACHADO' || upper.includes('ADUANA')) return ETAPAS.find(et => et.estado === 'EN ADUANA');
  if (upper === 'DESAGRUPADO' || upper.includes('PENDIENTE DESAGRUPE') || upper.includes('DESGRUPE')) return ETAPAS.find(et => et.estado === 'DESGRUPE');
  if (upper === 'ARRIBO' || upper.includes('NAVIERA') || upper.includes('PUERTO')) return ETAPAS.find(et => et.estado === 'EN NAVIERA');
  if (upper === 'EN TRANSITO' || upper === 'EN TRÁNSITO' || upper === 'EMBARCADO' || upper.includes('RUMBO') || upper.includes('NAVEGACION')) return ETAPAS.find(et => et.estado === 'EN TRANSITO');
  if (upper.includes('CONTENEDOR') || upper.includes('ESTIBA')) return ETAPAS.find(et => et.estado === 'EN CONTENEDOR');
  if (upper.includes('TRANSPORTE')) return ETAPAS.find(et => et.estado === 'TRANSPORTE A NAVIERA');
  if (upper === 'EN AGENCIA' || upper === 'FALTANTE' || upper === 'PERDIDA' || upper.includes('RECIBIDO')) return ETAPAS.find(et => et.estado === 'EN AGENCIA');

  // Fallback: substring match
  for (const etapa of ETAPAS) {
    if (upper.includes(etapa.estado)) return etapa;
  }
  return null;
}

function hasProvinciaMatch(text: string): boolean {
  return /PINAR|ARTEMISA|MAYABEQUE|MATANZAS|VILLA CLARA|CIENFUEGOS|SANCTI SPIRITUS|CIEGO|CAMAGÜEY|CAMAGUEY|LAS TUNAS|HOLGUIN|GRANMA|SANTIAGO|GUANTANAMO/.test(text);
}

// GET /api/tracking/buscar?cpk=XXX or ?carnet=XXX or ?q=XXX (smart search)
// ALWAYS queries SolvedCargo for fresh data, then merges with local DB
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const cpk = searchParams.get('cpk');
    const carnet = searchParams.get('carnet');
    const q = searchParams.get('q'); // Smart search - auto detect CPK or carnet
    const noSolvedCargo = searchParams.get('noSolvedCargo') === 'true'; // Skip SolvedCargo search

    // Smart search: if q is provided, auto-detect what it is
    let searchCPK = cpk;
    let searchCarnet = carnet;

    if (q && !cpk && !carnet) {
      const trimmed = q.trim();
      const digitsOnly = trimmed.replace(/[^0-9]/g, '');

      // Check if it contains CPK prefix
      if (/CPK/i.test(trimmed)) {
        searchCPK = trimmed;
      }
      // Check if it looks like a carnet (11 digits = Cuban carnet, or 9-12 digits)
      else if (/^\d{9,12}$/.test(digitsOnly)) {
        searchCarnet = digitsOnly;
      }
      // Check if it looks like a CPK number (digits only, 4-8 digits)
      else if (/^\d{1,8}$/.test(digitsOnly)) {
        searchCPK = trimmed;
      }
      // Ambiguous: 8-9 digits - try BOTH CPK and carnet
      else if (/^\d{8,9}$/.test(digitsOnly)) {
        searchCPK = trimmed;
        searchCarnet = digitsOnly;
      }
      // Otherwise, try CPK first (might have mixed format)
      else {
        searchCPK = trimmed;
      }
    }

    if (!searchCPK && !searchCarnet) {
      return NextResponse.json({ ok: false, error: 'Se requiere un número de búsqueda' }, { status: 400 });
    }

    let results: any[] = [];
    const seenIds = new Set<number>();

    // Search by CPK
    if (searchCPK) {
      const normalizedCPK = normalizarCPK(searchCPK);

      // First try exact match
      const cpkResults = await db.trackingEntry.findMany({
        where: { cpk: normalizedCPK },
        orderBy: { createdAt: 'desc' },
      });
      for (const r of cpkResults) {
        if (!seenIds.has(r.id)) { results.push(r); seenIds.add(r.id); }
      }

      // If no exact match and searchCPK is just digits (partial), try contains search
      if (results.length === 0 && /^\d+$/.test(searchCPK.trim())) {
        const digits = searchCPK.trim();
        const paddedDigits = digits.padStart(7, '0');
        const containsResults = await db.trackingEntry.findMany({
          where: { cpk: { contains: paddedDigits } },
          orderBy: { createdAt: 'desc' },
        });
        for (const r of containsResults) {
          if (!seenIds.has(r.id)) { results.push(r); seenIds.add(r.id); }
        }

        if (results.length === 0) {
          const allEntries = await db.trackingEntry.findMany({
            orderBy: { createdAt: 'desc' },
          });
          const filtered = allEntries.filter(e => {
            const numOnly = e.cpk.replace(/[^0-9]/g, '');
            return numOnly.includes(digits) || paddedDigits.includes(numOnly) || numOnly.includes(paddedDigits);
          });
          for (const r of filtered) {
            if (!seenIds.has(r.id)) { results.push(r); seenIds.add(r.id); }
          }
        }
      }
    }

    // Search by carnet
    if (searchCarnet) {
      const normalizedCarnet = searchCarnet.replace(/[^0-9]/g, '');

      const trackingResults = await db.trackingEntry.findMany({
        orderBy: { createdAt: 'desc' },
      });

      const carnetTracking = trackingResults.filter(e => {
        if (!e.carnetPrincipal) return false;
        const eCarnet = e.carnetPrincipal.replace(/[^0-9]/g, '');
        return eCarnet.includes(normalizedCarnet) || normalizedCarnet.includes(eCarnet);
      });
      for (const r of carnetTracking) {
        if (!seenIds.has(r.id)) { results.push(r); seenIds.add(r.id); }
      }

      // Also search in Pedido.carnetDestinatario
      const allPedidos = await db.pedido.findMany({
        orderBy: { createdAt: 'desc' },
      });

      const carnetPedidos = allPedidos.filter(p => {
        if (!p.carnetDestinatario) return false;
        const pCarnet = p.carnetDestinatario.replace(/[^0-9]/g, '');
        return pCarnet.includes(normalizedCarnet) || normalizedCarnet.includes(pCarnet);
      });

      for (const p of carnetPedidos) {
        const alreadyExists = results.some(r => r.cpk === `PED-${p.id}`);
        if (!alreadyExists) {
          results.push({
            id: p.id,
            cpk: `PED-${p.id}`,
            fecha: p.createdAt?.toISOString().split('T')[0] || null,
            estado: p.estado,
            descripcion: p.producto,
            embarcador: p.nombreComprador,
            consignatario: p.nombreDestinatario,
            carnetPrincipal: p.carnetDestinatario,
            rawData: null,
            createdAt: p.createdAt,
            updatedAt: p.updatedAt,
          });
        }
      }
    }

    // ============================================
    // ALWAYS search SolvedCargo for FRESH data
    // This ensures the client always sees the latest status
    // ============================================
    let solvedcargoSource = false;
    let estadoUpdated = false;

    if (!noSolvedCargo) {
      const searchQuery = q || searchCPK || searchCarnet || '';
      try {
        const scResult = await searchSolvedCargo(searchQuery);

        if (scResult.found && scResult.results.length > 0) {
          solvedcargoSource = true;

          // Build a map of CPK -> fresh SolvedCargo data
          const scMap = new Map<string, any>();
          for (const scItem of scResult.results) {
            const cpkNorm = normalizarCPK(scItem.cpk);
            const estado = mapEstado(scItem.estado || '');
            scMap.set(cpkNorm, { ...scItem, estado });
          }

          // Update existing local results with fresh SolvedCargo data
          for (let i = 0; i < results.length; i++) {
            const entry = results[i];
            if (!entry.cpk || entry.cpk.startsWith('PED-')) continue; // Skip pedidos

            const cpkNorm = normalizarCPK(entry.cpk);
            const freshData = scMap.get(cpkNorm);

            if (freshData) {
              const newEstado = freshData.estado || 'EN AGENCIA';

              // Only update DB if the estado actually changed
              if (entry.estado !== newEstado) {
                estadoUpdated = true;
                console.log(`[Tracking] Estado actualizado: ${entry.cpk} "${entry.estado}" -> "${newEstado}"`);

                try {
                  await db.trackingEntry.updateMany({
                    where: { cpk: cpkNorm },
                    data: {
                      fecha: freshData.fecha || entry.fecha,
                      estado: newEstado,
                      descripcion: freshData.descripcion || entry.descripcion,
                      embarcador: freshData.embarcador || entry.embarcador,
                      consignatario: freshData.consignatario || entry.consignatario,
                      carnetPrincipal: freshData.carnetPrincipal || entry.carnetPrincipal,
                      updatedAt: new Date(),
                    },
                  });
                } catch (updateErr) {
                  console.error('[Tracking] Error actualizando estado en BD:', updateErr);
                }

                // Update the result object with fresh data
                results[i] = {
                  ...entry,
                  estado: newEstado,
                  fecha: freshData.fecha || entry.fecha,
                  descripcion: freshData.descripcion || entry.descripcion,
                  embarcador: freshData.embarcador || entry.embarcador,
                  consignatario: freshData.consignatario || entry.consignatario,
                  carnetPrincipal: freshData.carnetPrincipal || entry.carnetPrincipal,
                  _source: 'solvedcargo',
                  _estadoUpdated: true,
                };
              }

              scMap.delete(cpkNorm); // Mark as processed
            }
          }

          // Add any NEW results from SolvedCargo that weren't in local DB
          for (const [cpkNorm, scItem] of scMap) {
            try {
              const created = await db.trackingEntry.create({
                data: {
                  cpk: cpkNorm,
                  fecha: scItem.fecha,
                  estado: scItem.estado || 'EN AGENCIA',
                  descripcion: scItem.descripcion,
                  embarcador: scItem.embarcador,
                  consignatario: scItem.consignatario,
                  carnetPrincipal: scItem.carnetPrincipal,
                  rawData: scItem.rawData,
                },
              });
              results.push({ ...created, _source: 'solvedcargo', _isNew: true });
            } catch (saveError) {
              console.error('[Tracking] Error guardando nuevo resultado de SolvedCargo:', saveError);
              results.push({ ...scItem, id: Date.now(), _source: 'solvedcargo', _isNew: true });
            }
          }
        }
      } catch (scError) {
        // SolvedCargo might be down - return local data gracefully
        console.error('[Tracking] Error consultando SolvedCargo, se muestran datos locales:', scError);
      }
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

    // ============================================
    // AUTO-SUBSCRIBE: Save searched CPKs for user
    // If x-user-id header is present, automatically
    // track these CPKs so weekly email is personalized
    // ============================================
    const userIdHeader = request.headers.get('x-user-id');
    if (userIdHeader) {
      const userId = parseInt(userIdHeader, 10);
      if (!isNaN(userId)) {
        const cpksToTrack = results
          .filter(r => r.cpk && !r.cpk.startsWith('PED-'))
          .map(r => normalizarCPK(r.cpk));
        const uniqueCPKs = [...new Set(cpksToTrack)];

        for (const cpk of uniqueCPKs) {
          try {
            await db.userTrackingSearch.upsert({
              where: { userId_cpk: { userId, cpk } },
              update: {}, // No-op if already exists
              create: { userId, cpk },
            });
          } catch (trackErr) {
            console.error(`[Tracking] Error guardando seguimiento CPK ${cpk} para usuario ${userId}:`, trackErr);
          }
        }
        if (uniqueCPKs.length > 0) {
          console.log(`[Tracking] Auto-suscrito usuario ${userId} a ${uniqueCPKs.length} CPK(s)`);
        }
      }
    }

    return NextResponse.json({
      ok: true,
      data: results,
      meta: {
        solvedcargoSource,
        estadoUpdated,
        solvedcargoResults: results.filter(r => r._source === 'solvedcargo').length,
        totalResults: results.length,
      },
    });
  } catch (error) {
    console.error('Error searching tracking:', error);
    return NextResponse.json({ ok: false, error: 'Error al buscar en rastreo' }, { status: 500 });
  }
}
