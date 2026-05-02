// ============================================================
// SOLVEDCARGO - Shared API Integration Module (v4)
// ============================================================
// Uses SolvedCargo CargoPack API v4:
//   - Token: getConfigData (required for v4)
//   - Login: loginUser (with token)
//   - Search: getListRecord (returns HTML tables)
//   - Session: checkIfValidSession returns "1"
// ============================================================

import * as cheerio from 'cheerio';

const SOLVEDCARGO_BASE = 'https://www.solvedc.com/cargo/cargopack/v4';
const API_PATH = `${SOLVEDCARGO_BASE}/php/solved/routing.php`;
const SOLVEDCARGO_USER = process.env.SOLVEDCARGO_USER || 'GEO MIA';
const SOLVEDCARGO_PASS = process.env.SOLVEDCARGO_PASS || 'GEO**091223';
const ENTERPRISE_ID = process.env.SOLVEDCARGO_ENTERPRISE_ID || '55';

export interface SolvedCargoSession {
  cookie: string;
  username: string;
  enterprise: string;
  iduser: string;
  token: string;
  expiresAt: number;
}

let cachedSession: SolvedCargoSession | null = null;

/**
 * Get config token required by v4 API
 */
async function getToken(): Promise<{ token: string; phpsessid: string }> {
  console.log('[SolvedCargo] Obteniendo token v4...');
  const res = await fetch(API_PATH, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      funcname: 'getConfigData',
      lang: 'es',
    }).toString(),
    redirect: 'manual',
  });

  if (!res.ok) throw new Error(`getConfigData fallo: ${res.status}`);

  const setCookie = res.headers.get('set-cookie') || '';
  const match = setCookie.match(/PHPSESSID=([^;]+)/);
  const phpsessid = match ? match[1] : '';

  const data = await res.json();
  if (!data.token) throw new Error('No se obtuvo token de SolvedCargo v4');

  console.log(`[SolvedCargo] Token obtenido: ${data.token.substring(0, 8)}...`);
  return { token: data.token, phpsessid };
}

/**
 * Login to SolvedCargo v4 (with token) and cache session for 25 minutes
 */
export async function login(): Promise<SolvedCargoSession | null> {
  if (cachedSession && Date.now() < cachedSession.expiresAt) {
    return cachedSession;
  }

  try {
    // Step 1: Get token
    const { token: cfgToken, phpsessid } = await getToken();
    if (!phpsessid) {
      console.error('SolvedCargo: No PHPSESSID received');
      return null;
    }

    // Step 2: Login with token
    const loginRes = await fetch(API_PATH, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Cookie': `PHPSESSID=${phpsessid}`,
      },
      body: new URLSearchParams({
        token: cfgToken,
        funcname: 'loginUser',
        user: SOLVEDCARGO_USER,
        password: SOLVEDCARGO_PASS,
      }).toString(),
    });

    if (!loginRes.ok) {
      console.error(`SolvedCargo login failed: ${loginRes.status}`);
      return null;
    }

    const loginData = await loginRes.json();
    if (!loginData.iduser) {
      console.error('SolvedCargo: Login did not return user data');
      return null;
    }

    // Step 3: Validate session
    const validRes = await fetch(API_PATH, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Cookie': `PHPSESSID=${phpsessid}`,
      },
      body: new URLSearchParams({
        token: cfgToken,
        funcname: 'checkIfValidSession',
        username: SOLVEDCARGO_USER,
        password: SOLVEDCARGO_PASS,
      }).toString(),
    });
    const validText = await validRes.text();

    if (validText.trim() !== '1' && validText.trim().toLowerCase() !== 'true') {
      console.error('SolvedCargo session validation failed, got:', validText);
      return null;
    }

    cachedSession = {
      cookie: `PHPSESSID=${phpsessid}`,
      username: SOLVEDCARGO_USER,
      enterprise: loginData.enterprise || 'CHAMBATINA',
      iduser: loginData.iduser || '',
      token: cfgToken,
      expiresAt: Date.now() + 25 * 60 * 1000,
    };

    console.log(`SolvedCargo v4: Login successful (iduser=${loginData.iduser})`);
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
      const parts = tdId.replace('id_td_', '').split('_');
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
 * Call getListRecord API with a WHERE clause (v4 with token)
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
        token: session.token,
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
 */
export function mapEstado(estadoRaw: string): string {
  const upper = (estadoRaw || '').toUpperCase().trim();

  if (upper === 'ENTREGADO' || upper === 'ENTREGADO PP' || upper === 'ENTREGADO V') return 'ENTREGADO';
  if (upper.includes('DISTRIBUCION') || upper.includes('DISTRIBUCIÓN') || upper.includes('REPARTO')) return 'EN DISTRIBUCION';
  if (upper.includes('ALMACEN') && hasProvincia(upper)) return 'ALMACEN PROVINCIAL';
  if (upper.startsWith('EN TRANSITO') && hasProvincia(upper)) return 'TRASLADO PROVINCIA';
  if (upper.includes('ESPERA DE TRANSITO') || upper.includes('ESPERA DE TRÁNSITO')) return 'CLASIFICACION';
  if (upper.includes('ALMACEN')) return 'ALMACEN CENTRAL';
  if (upper === 'CLASIFICADO' || upper.includes('CLASIFICACION') || upper.includes('CLASIFICACIÓN')) return 'CLASIFICACION';
  if (upper === 'DESPACHADO') return 'EN ADUANA';
  if (upper.includes('ADUANA')) return 'EN ADUANA';
  if (upper === 'DESAGRUPADO' || upper === 'PENDIENTE DESAGRUPE' || upper.includes('DESGRUPE') || upper.includes('DESTUFFING')) return 'DESGRUPE';
  if (upper === 'ARRIBO' || upper.includes('ARRIBO')) return 'EN NAVIERA';
  if (upper === 'EN TRANSITO' || upper === 'EN TRÁNSITO' || upper.includes('RUMBO') || upper.includes('NAVEGACION') || upper.includes('NAVEGACIÓN') || upper.includes('MAR')) return 'EN TRANSITO';
  if (upper === 'EMBARCADO') return 'EN TRANSITO';
  if (upper.includes('NAVIERA') || upper.includes('PUERTO')) return 'EN NAVIERA';
  if (upper.includes('CONTENEDOR') || upper.includes('ESTIBA') || upper.includes('CARGADO')) return 'EN CONTENEDOR';
  if (upper.includes('TRANSPORTE')) return 'TRANSPORTE A NAVIERA';
  if (upper.includes('AGENCIA') || upper.includes('RECIBIDO') || upper === 'PENDIENTE') return 'EN AGENCIA';
  if (upper === 'FALTANTE' || upper === 'PERDIDA') return 'EN AGENCIA';

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

    const whereClauses: string[] = [];

    if (/CPK/i.test(upperTrimmed) || /^\d{1,8}$/.test(digitsOnly)) {
      let cpkSearch = upperTrimmed;
      if (/^\d+$/.test(digitsOnly)) {
        cpkSearch = `CPK-${digitsOnly.padStart(7, '0')}`;
      }
      whereClauses.push(`(hbl LIKE "%${cpkSearch}%")`);
      if (/^\d+$/.test(digitsOnly)) {
        whereClauses.push(`(hbl LIKE "%${digitsOnly}%")`);
      }
    }

    if (/^\d{9,12}$/.test(digitsOnly)) {
      whereClauses.push(`(cidentity LIKE "%${digitsOnly}%")`);
    }

    if (whereClauses.length === 0) {
      whereClauses.push(`(hbl LIKE "%${trimmed}%")`);
      if (digitsOnly.length >= 5) {
        whereClauses.push(`(cidentity LIKE "%${digitsOnly}%")`);
      }
    }

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
