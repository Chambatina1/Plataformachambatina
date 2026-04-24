// ============================================================
// SOLVEDCARGO - Shared API Integration Module
// ============================================================

const SOLVEDCARGO_BASE = 'https://www.solvedc.com/cargo/cargopack/v1';
const SOLVEDCARGO_USER = process.env.SOLVEDCARGO_USER || 'GEO MIA';
const SOLVEDCARGO_PASS = process.env.SOLVEDCARGO_PASS || 'GEO**091223';

export interface SolvedCargoSession {
  cookie: string;
  username: string;
  enterprise: string;
  iduser: string;
  agencies: string;
  expiresAt: number;
}

let cachedSession: SolvedCargoSession | null = null;

/**
 * Login to SolvedCargo and cache the session for 30 minutes
 */
export async function login(): Promise<SolvedCargoSession | null> {
  // Reuse cached session if still valid (within 30 minutes)
  if (cachedSession && Date.now() < cachedSession.expiresAt) {
    return cachedSession;
  }

  try {
    const loginRes = await fetch(`${SOLVEDCARGO_BASE}/php/solved/routing.php`, {
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
      // Response might be plain text
      if (loginText.includes('Not found') || loginText.includes('Error')) {
        console.error('SolvedCargo login failed:', loginText);
        return null;
      }
    }

    // Validate session
    const validRes = await fetch(`${SOLVEDCARGO_BASE}/php/solved/routing.php`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Cookie': `PHPSESSID=${sessionId}`,
      },
      body: `funcname=checkIfValidSession&username=${encodeURIComponent(SOLVEDCARGO_USER)}&password=${encodeURIComponent(SOLVEDCARGO_PASS)}`,
    });
    const validText = await validRes.text();

    if (validText.trim() !== 'true') {
      console.error('SolvedCargo session validation failed');
      return null;
    }

    cachedSession = {
      cookie: `PHPSESSID=${sessionId}`,
      username: SOLVEDCARGO_USER,
      enterprise: loginData?.enterprise || 'CHAMBATINA',
      iduser: loginData?.iduser || '',
      agencies: loginData?.agencies || '',
      expiresAt: Date.now() + 30 * 60 * 1000, // 30 min cache
    };

    console.log('SolvedCargo: Login successful');
    return cachedSession;
  } catch (error) {
    console.error('SolvedCargo login error:', error);
    return null;
  }
}

/**
 * Load all reservations from SolvedCargo
 */
export async function getAllReservations(session: SolvedCargoSession): Promise<any[]> {
  try {
    const res = await fetch(`${SOLVEDCARGO_BASE}/php/routing.php`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Cookie': session.cookie,
      },
      body: `funcname=loadContainer&name=${encodeURIComponent(session.username)}&password=${encodeURIComponent(SOLVEDCARGO_PASS)}&container=dcargo&mode=transcargo`,
    });

    const text = await res.text();

    try {
      const data = JSON.parse(text);
      if (data && data.datos && Array.isArray(data.datos)) {
        return data.datos;
      }
      if (Array.isArray(data)) {
        return data;
      }
    } catch {
      console.error('SolvedCargo: Failed to parse reservations response');
    }

    return [];
  } catch (error) {
    console.error('SolvedCargo getAllReservations error:', error);
    return [];
  }
}

/**
 * Trace a specific shipment by HAWB number from SolvedCargo
 */
export async function traceShipment(session: SolvedCargoSession, hawb: string): Promise<any | null> {
  try {
    const res = await fetch(`${SOLVEDCARGO_BASE}/php/routing.php`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Cookie': session.cookie,
      },
      body: `funcname=traceShipping&checked=${encodeURIComponent(hawb)}&name=${encodeURIComponent(session.username)}&password=${encodeURIComponent(SOLVEDCARGO_PASS)}`,
    });

    const text = await res.text();
    try {
      return JSON.parse(text);
    } catch {
      return null;
    }
  } catch (error) {
    console.error('SolvedCargo traceShipment error:', error);
    return null;
  }
}

/**
 * Search SolvedCargo for a specific CPK/HAWB or carnet number
 * Returns matching shipments and whether they came from SolvedCargo
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

    // Try traceShipment first if it looks like a CPK/HAWB
    if (/CPK/i.test(trimmed) || /^\d{1,8}$/.test(digitsOnly)) {
      let hawbToTrace = trimmed;
      // If it's just digits, pad to 7 digits and try with CPK prefix
      if (/^\d+$/.test(digitsOnly)) {
        hawbToTrace = `CPK-${digitsOnly.padStart(7, '0')}`;
      }

      const traceResult = await traceShipment(session, hawbToTrace);
      if (traceResult) {
        // traceShipping might return a single object or array
        const shipments = Array.isArray(traceResult) ? traceResult : [traceResult];
        const mapped = shipments.map(mapShipmentToTracking).filter(Boolean);
        if (mapped.length > 0) {
          return { found: true, results: mapped, source: 'solvedcargo' };
        }
      }
    }

    // Also try loading all reservations and filtering locally
    const allReservations = await getAllReservations(session);
    const normalizedQuery = digitsOnly || trimmed.toUpperCase();
    const matches: any[] = [];

    for (const r of allReservations) {
      const hawb = r.hawb || r.HAWB || r.cpk || '';
      const carnet = r.carnet || '';
      const consignatario = r.consignatario || r.Consignatario || '';

      const hawbDigits = hawb.replace(/[^0-9]/g, '');
      const carnetDigits = carnet.replace(/[^0-9]/g, '');

      // Match by CPK digits, HAWB, or carnet
      const matchCPK = digitsOnly && (hawbDigits.includes(digitsOnly) || digitsOnly.includes(hawbDigits));
      const matchCarnet = digitsOnly && carnetDigits && (carnetDigits.includes(digitsOnly) || digitsOnly.includes(carnetDigits));
      const matchName = trimmed.length >= 3 && consignatario.toUpperCase().includes(trimmed.toUpperCase());

      if (matchCPK || matchCarnet || matchName) {
        const mapped = mapShipmentToTracking(r);
        if (mapped) matches.push(mapped);
      }
    }

    if (matches.length > 0) {
      return { found: true, results: matches, source: 'solvedcargo' };
    }

    return { found: false, results: [], source: 'none' };
  } catch (error) {
    console.error('SolvedCargo search error:', error);
    return { found: false, results: [], source: 'none', error: 'Error al buscar en SolvedCargo' };
  }
}

/**
 * Map SolvedCargo estado string to our 13-stage system
 */
export function mapEstado(estadoRaw: string): string {
  const upper = (estadoRaw || '').toUpperCase().trim();

  if (upper.includes('ENTREGADO')) return 'ENTREGADO';
  if (upper.includes('DISTRIBUCION') || upper.includes('DISTRIBUCIÓN') || upper.includes('REPARTO')) return 'EN DISTRIBUCION';
  if (upper.includes('ALMACEN') && upper.includes('PROVINCIAL')) return 'ALMACEN PROVINCIAL';
  if (upper.includes('TRASLADO') || upper.includes('PROVINCIA')) return 'TRASLADO PROVINCIA';
  if (upper.includes('ALMACEN') && upper.includes('CENTRAL')) return 'ALMACEN CENTRAL';
  if (upper.includes('CLASIFICACION') || upper.includes('CLASIFICACIÓN')) return 'CLASIFICACION';
  if (upper.includes('ADUANA')) return 'EN ADUANA';
  if (upper.includes('DESGRUPE') || upper.includes('DESTUFFING')) return 'DESGRUPE';
  if (upper.includes('NAVIERA') || upper.includes('PUERTO') || upper.includes('ARRIBO')) return 'EN NAVIERA';
  if (upper.includes('TRANSITO') || upper.includes('TRÁNSITO') || upper.includes('RUMBO') || upper.includes('MAR')) return 'EN TRANSITO';
  if (upper.includes('CONTENEDOR') || upper.includes('ESTIBA') || upper.includes('CARGADO')) return 'EN CONTENEDOR';
  if (upper.includes('TRANSPORTE')) return 'TRANSPORTE A NAVIERA';
  if (upper.includes('AGENCIA') || upper.includes('RECIBIDO') || upper.includes('PENDIENTE')) return 'EN AGENCIA';

  return upper || 'EN AGENCIA';
}

/**
 * Map a SolvedCargo reservation object to our TrackingEntry format
 */
function mapShipmentToTracking(r: any): any {
  const cpkRaw = r.hawb || r.HAWB || r.cpk || '';
  if (!cpkRaw) return null;

  return {
    cpk: cpkRaw,
    fecha: r.fecha || r.date || r.Fecha || null,
    estado: mapEstado(r.estado || r.Estado || r.status || ''),
    descripcion: r.mercancia || r.mercancías || r.Mercancias || r.description || null,
    embarcador: r.embarcador || r.Embarcador || r.shipper || null,
    consignatario: r.consignatario || r.Consignatario || r.consignee || null,
    carnetPrincipal: r.carnet || null,
    rawData: JSON.stringify(r),
    _source: 'solvedcargo',
    _isNew: true,
  };
}

/**
 * Invalidate cached session
 */
export function clearSession(): void {
  cachedSession = null;
}
