// ============================================================
// SOLVEDCARGO - Shared API Integration Module
// ============================================================
// Uses the REAL SolvedCargo CargoPack API:
//   - Login: /php/solved/routing.php → loginUser
//   - Search: /php/solved/routing.php → getListRecord (returns HTML tables)
//   - Session: checkIfValidSession returns "1" (not "true")
// ============================================================

import * as cheerio from 'cheerio';

const SOLVEDCARGO_BASE = 'https://www.solvedc.com/cargo/cargopack/v1';
const API_PATH = `${SOLVEDCARGO_BASE}/php/solved/routing.php`;
const SOLVEDCARGO_USER = process.env.SOLVEDCARGO_USER || 'GEO MIA';
const SOLVEDCARGO_PASS = process.env.SOLVEDCARGO_PASS || 'GEO**091223';
const ENTERPRISE_ID = process.env.SOLVEDCARGO_ENTERPRISE_ID || '55';

export interface SolvedCargoSession {
  cookie: string;
  username: string;
  enterprise: string;
  iduser: string;
  expiresAt: number;
}

let cachedSession: SolvedCargoSession | null = null;

/**
 * Login to SolvedCargo and cache the session for 30 minutes
 */
export async function login(): Promise<SolvedCargoSession | null> {
  if (cachedSession && Date.now() < cachedSession.expiresAt) {
    return cachedSession;
  }

  try {
    const loginRes = await fetch(API_PATH, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: `funcname=loginUser&user=${encodeURIComponent(SOLVEDCARGO_USER)}&password=${encodeURIComponent(SOLVEDCARGO_PASS)}`,
    });

    const loginText = await loginRes.text();

    // Extract PHPSESSID cookie
    const setCookie = loginRes.headers.get('set-cookie') || '';
    const sessionIdMatch = setCookie.match(/PHPSESSID=([^;]+)/);
    const sessionId = sessionIdMatch ? sessionIdMatch[1] : '';

    if (!sessionId) {
      console.error('SolvedCargo: No session cookie received');
      return null;
    }

    let loginData: any = null;
    try {
      loginData = JSON.parse(loginText);
    } catch {
      if (loginText.includes('Not found') || loginText.includes('Error')) {
        console.error('SolvedCargo login failed:', loginText);
        return null;
      }
    }

    // Validate session — API returns "1", NOT "true"
    const validRes = await fetch(API_PATH, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Cookie': `PHPSESSID=${sessionId}`,
      },
      body: `funcname=checkIfValidSession&username=${encodeURIComponent(SOLVEDCARGO_USER)}&password=${encodeURIComponent(SOLVEDCARGO_PASS)}`,
    });
    const validText = await validRes.text();

    // FIX: API returns "1" for valid session, not "true"
    if (validText.trim() !== '1' && validText.trim().toLowerCase() !== 'true') {
      console.error('SolvedCargo session validation failed, got:', validText);
      return null;
    }

    cachedSession = {
      cookie: `PHPSESSID=${sessionId}`,
      username: SOLVEDCARGO_USER,
      enterprise: loginData?.enterprise || 'CHAMBATINA',
      iduser: loginData?.iduser || '',
      expiresAt: Date.now() + 30 * 60 * 1000,
    };

    console.log('SolvedCargo: Login successful');
    return cachedSession;
  } catch (error) {
    console.error('SolvedCargo login error:', error);
    return null;
  }
}

/**
 * Parse HTML table rows returned by getListRecord into structured data
 * Data is in the `title` attribute of each <td> element
 */
function parseHTMLRows(html: string): Record<string, string>[] {
  const $ = cheerio.load(html);
  const rows: Record<string, string>[] = [];

  $('tr[id^="id_tr_"]').each((_i, el) => {
    const row: Record<string, string> = {};
    $(el).find('td[id^="id_td_"]').each((_j, td) => {
      const tdId = $(td).attr('id') || '';
      // Extract field name from td id: id_td_{fieldname}_{option}_{kind}_{index}
      const parts = tdId.replace('id_td_', '').split('_');
      // The field name could be multi-part (e.g., "nameconsignee"), reconstruct
      // Format: id_td_{fieldname}_{option}_{kind}_{index}
      // We need to strip the last 3 parts (option, kind, index)
      if (parts.length >= 3) {
        const fieldName = parts.slice(0, parts.length - 3).join('_');
        const value = $(td).attr('title') || $(td).text().trim();
        if (fieldName && value) {
          row[fieldName] = value;
        }
      }
    });
    if (Object.keys(row).length > 0) {
      rows.push(row);
    }
  });

  return rows;
}

/**
 * Call getListRecord API with a WHERE clause
 * Returns parsed array of records
 */
async function getListRecords(session: SolvedCargoSession, option: string, whereClause: string): Promise<Record<string, string>[]> {
  try {
    const res = await fetch(API_PATH, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Cookie': session.cookie,
      },
      body: new URLSearchParams({
        funcname: 'getListRecord',
        option: option,
        kind: 'list',
        idrecord: '-1',
        where: whereClause,
        orderby: '',
        offset: '-1',
        onlytable: '1',
      }).toString(),
    });

    const html = await res.text();
    return parseHTMLRows(html);
  } catch (error) {
    console.error(`SolvedCargo getListRecords(${option}) error:`, error);
    return [];
  }
}

// Check if the estado string contains a Cuban province name
function hasProvincia(text: string): boolean {
  const provincias = [
    'PINAR DEL RIO', 'ARTEMISA', 'LA HABANA', 'MAYABEQUE', 'MATANZAS',
    'VILLA CLARA', 'CIENFUEGOS', 'SANCTI SPIRITUS', 'CIEGO DE AVILA',
    'CAMAGUEY', 'LAS TUNAS', 'HOLGUIN', 'GRANMA', 'SANTIAGO DE CUBA',
    'GUANTANAMO', 'ISLA DE LA JUVENTUD',
  ];
  return provincias.some(p => text.includes(p));
}

/**
 * Map SolvedCargo estado string to our 13-stage system
 *
 * Based on real SolvedCargo estados (extracted from 3611 records):
 *   EMBARCADO, EN ESPERA DE TRANSITO, EN TRANSITO [PROVINCIA], ARRIBO,
 *   EN ALMACEN [PROVINCIA], EN DISTRIBUCION [PROVINCIA], CLASIFICADO,
 *   DESAGRUPADO, PENDIENTE DESAGRUPE, DESPACHADO, ENTREGADO, ENTREGADO PP,
 *   ENTREGADO V, FALTANTE, PERDIDA, EN AGENCIA, EN TRANSITO (sin provincia)
 *
 * Logistics flow (real):
 *   EMBARCADO -> buque zarpo (EN TRANSITO marítimo)
 *   ARRIBO -> buque llegó al puerto de Cuba (EN NAVIERA)
 *   PENDIENTE DESAGRUPE / DESAGRUPADO -> vaciando contenedor (DESGRUPE)
 *   DESPACHADO -> proceso aduanero (EN ADUANA)
 *   CLASIFICADO -> clasificando por provincia (CLASIFICACION)
 *   EN ALMACEN (sin provincia) -> almacén central Habana (ALMACEN CENTRAL)
 *   EN ESPERA DE TRANSITO -> pasó aduana, espera transporte provincia (CLASIFICACION)
 *   EN TRANSITO [PROVINCIA] -> camión hacia provincia (TRASLADO PROVINCIA)
 *   EN ALMACEN [PROVINCIA] -> llegó a provincia (ALMACEN PROVINCIAL)
 *   EN DISTRIBUCION -> repartiendo al destinatario (EN DISTRIBUCION)
 *   ENTREGADO -> entregado al cliente (ENTREGADO)
 */
export function mapEstado(estadoRaw: string): string {
  const upper = (estadoRaw || '').toUpperCase().trim();

  // ─── ENTREGADO (todas las variantes) ───────────────────────────
  if (upper === 'ENTREGADO' || upper === 'ENTREGADO PP' || upper === 'ENTREGADO V') {
    return 'ENTREGADO';
  }

  // ─── EN DISTRIBUCION (con o sin provincia) ────────────────────
  if (upper.includes('DISTRIBUCION') || upper.includes('DISTRIBUCIÓN') || upper.includes('REPARTO')) {
    return 'EN DISTRIBUCION';
  }

  // ─── EN ALMACEN PROVINCIAL (con nombre de provincia) ──────────
  // Ej: "EN ALMACEN CAMAGUEY", "EN ALMACEN HOLGUIN", etc.
  if (upper.includes('ALMACEN') && hasProvincia(upper)) {
    return 'ALMACEN PROVINCIAL';
  }

  // ─── EN TRANSITO A PROVINCIA (en camión hacia provincia) ─────
  // Ej: "EN TRANSITO CAMAGUEY", "EN TRANSITO HOLGUIN"
  // MUY IMPORTANTE: "EN TRANSITO" sin provincia = tránsito marítimo
  // "EN TRANSITO CAMAGUEY" = ya en tierra, camión a provincia
  if (upper.startsWith('EN TRANSITO') && hasProvincia(upper)) {
    return 'TRASLADO PROVINCIA';
  }

  // ─── EN ESPERA DE TRANSITO ────────────────────────────────────
  // Pasó aduana, está esperando el transporte hacia provincia
  // Este es un estado POST-aduana, PRE-traslado
  if (upper.includes('ESPERA DE TRANSITO') || upper.includes('ESPERA DE TRÁNSITO')) {
    return 'CLASIFICACION';
  }

  // ─── ALMACEN CENTRAL (sin nombre de provincia) ───────────────
  if (upper.includes('ALMACEN')) {
    return 'ALMACEN CENTRAL';
  }

  // ─── CLASIFICACION / CLASIFICADO ─────────────────────────────
  if (upper === 'CLASIFICADO' || upper.includes('CLASIFICACION') || upper.includes('CLASIFICACIÓN')) {
    return 'CLASIFICACION';
  }

  // ─── DESPACHADO = en proceso aduanero ─────────────────────────
  if (upper === 'DESPACHADO') {
    return 'EN ADUANA';
  }

  // ─── ADUANA ──────────────────────────────────────────────────
  if (upper.includes('ADUANA')) {
    return 'EN ADUANA';
  }

  // ─── DESGRUPE / DESAGRUPADO / PENDIENTE DESAGRUPE ────────────
  if (upper === 'DESAGRUPADO' || upper === 'PENDIENTE DESAGRUPE' || upper.includes('DESGRUPE') || upper.includes('DESTUFFING')) {
    return 'DESGRUPE';
  }

  // ─── ARRIBO = buque llegó al puerto ──────────────────────────
  if (upper === 'ARRIBO' || upper.includes('ARRIBO')) {
    return 'EN NAVIERA';
  }

  // ─── EN TRANSITO (sin provincia) = tránsito marítimo ────────
  if (upper === 'EN TRANSITO' || upper === 'EN TRÁNSITO' || upper.includes('RUMBO') || upper.includes('NAVEGACION') || upper.includes('NAVEGACIÓN') || upper.includes('MAR')) {
    return 'EN TRANSITO';
  }

  // ─── EMBARCADO = contenedor zarpó, en tránsito marítimo ────
  if (upper === 'EMBARCADO') {
    return 'EN TRANSITO';
  }

  // ─── NAVIERA / PUERTO ───────────────────────────────────────
  if (upper.includes('NAVIERA') || upper.includes('PUERTO')) {
    return 'EN NAVIERA';
  }

  // ─── CONTENEDOR / ESTIBA / CARGADO ───────────────────────────
  if (upper.includes('CONTENEDOR') || upper.includes('ESTIBA') || upper.includes('CARGADO')) {
    return 'EN CONTENEDOR';
  }

  // ─── TRANSPORTE A NAVIERA ────────────────────────────────────
  if (upper.includes('TRANSPORTE')) {
    return 'TRANSPORTE A NAVIERA';
  }

  // ─── EN AGENCIA / RECIBIDO / PENDIENTE ───────────────────────
  if (upper.includes('AGENCIA') || upper.includes('RECIBIDO') || upper === 'PENDIENTE') {
    return 'EN AGENCIA';
  }

  // ─── FALTANTE / PERDIDA → se mantiene en agencia para revisión
  if (upper === 'FALTANTE' || upper === 'PERDIDA') {
    return 'EN AGENCIA';
  }

  return upper || 'EN AGENCIA';
}

/**
 * Map a parsed HTML row to our TrackingEntry format
 */
export function mapRowToTracking(row: Record<string, string>): any {
  const cpk = row.hbl || '';
  if (!cpk) return null;

  return {
    cpk: cpk.trim(),
    fecha: row.datereserve || null,
    estado: mapEstado(row.idreservestate || row.reservestate || ''),
    descripcion: row.description || row.mercancia || null,
    embarcador: row.enterprisename || SOLVEDCARGO_USER,
    consignatario: row.nameconsignee || row.cname || null,
    carnetPrincipal: row.cidentity || null,
    peso: row.weight || row.peso || null,
    _source: 'solvedcargo',
    _isNew: true,
  };
}

/**
 * Search SolvedCargo for a specific CPK/HAWB or carnet number
 * Uses getListRecord with appropriate WHERE clauses
 * Searches across all reservation types: reservea, reservem, reservec, reservef
 */
export async function searchSolvedCargo(query: string): Promise<{
  found: boolean;
  results: any[];
  source: 'solvedcargo' | 'none';
  error?: string;
}> {
  try {
    const session = await login();
    if (!session) {
      return { found: false, results: [], source: 'none', error: 'No se pudo conectar con SolvedCargo' };
    }

    const trimmed = query.trim();
    const digitsOnly = trimmed.replace(/[^0-9]/g, '');
    const upperTrimmed = trimmed.toUpperCase();

    // Build WHERE clauses to try
    const whereClauses: string[] = [];

    // If it looks like a CPK (has CPK prefix or short digits)
    if (/CPK/i.test(upperTrimmed) || /^\d{1,8}$/.test(digitsOnly)) {
      let cpkSearch = upperTrimmed;
      if (/^\d+$/.test(digitsOnly)) {
        // Pad to 7 digits for CPK format
        cpkSearch = `CPK-${digitsOnly.padStart(7, '0')}`;
      }
      whereClauses.push(`(hbl LIKE "%${cpkSearch}%")`);
      // Also try without CPK prefix in case the user typed just digits
      if (/^\d+$/.test(digitsOnly)) {
        whereClauses.push(`(hbl LIKE "%${digitsOnly}%")`);
      }
    }

    // If it looks like a carnet (9-12 digits), search by identity
    if (/^\d{9,12}$/.test(digitsOnly)) {
      whereClauses.push(`(cidentity LIKE "%${digitsOnly}%")`);
    }

    // If we couldn't determine the type, try both
    if (whereClauses.length === 0) {
      whereClauses.push(`(hbl LIKE "%${trimmed}%")`);
      if (digitsOnly.length >= 5) {
        whereClauses.push(`(cidentity LIKE "%${digitsOnly}%")`);
      }
    }

    // Search across all reservation types
    const reservationTypes = ['reservef', 'reservea', 'reservem', 'reservec'];
    const allResults: any[] = [];
    const seenCPKs = new Set<string>();

    for (const option of reservationTypes) {
      for (const wherePart of whereClauses) {
        const whereClause = `(${wherePart}) AND (r.identerprise = ${ENTERPRISE_ID})`;
        const rows = await getListRecords(session, option, whereClause);

        for (const row of rows) {
          const mapped = mapRowToTracking(row);
          if (mapped && !seenCPKs.has(mapped.cpk)) {
            seenCPKs.add(mapped.cpk);
            allResults.push(mapped);
          }
        }

        // If we already found results from this reservation type, no need to try more WHERE clauses
        if (rows.length > 0) break;
      }
    }

    if (allResults.length > 0) {
      return { found: true, results: allResults, source: 'solvedcargo' };
    }

    return { found: false, results: [], source: 'none' };
  } catch (error) {
    console.error('SolvedCargo search error:', error);
    return { found: false, results: [], source: 'none', error: 'Error al buscar en SolvedCargo' };
  }
}

/**
 * Get all reservations from SolvedCargo for this enterprise
 * Searches across all reservation types
 */
export async function getAllReservations(session: SolvedCargoSession): Promise<Record<string, string>[]> {
  const allRows: Record<string, string>[] = [];
  const reservationTypes = ['reservef', 'reservea', 'reservem', 'reservec'];

  for (const option of reservationTypes) {
    const whereClause = `(r.identerprise = ${ENTERPRISE_ID}) AND ((r.deleted = 0) OR (r.deleted IS NULL))`;
    const rows = await getListRecords(session, option, whereClause);
    allRows.push(...rows);
  }

  return allRows;
}

/**
 * Invalidate cached session
 */
export function clearSession(): void {
  cachedSession = null;
}
