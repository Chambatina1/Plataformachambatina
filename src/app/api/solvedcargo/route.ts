import { NextRequest, NextResponse } from 'next/server';

// SolvedCargo CargoPack API integration
const SOLVEDCARGO_BASE = 'https://www.solvedc.com/cargo/cargopack/v1';
const SOLVEDCARGO_USER = process.env.SOLVEDCARGO_USER || 'GEO MIA';
const SOLVEDCARGO_PASS = process.env.SOLVEDCARGO_PASS || 'GEO**091223';

interface SolvedCargoSession {
  cookie: string;
  username: string;
  enterprise: string;
  iduser: string;
  agencies: string;
  expiresAt: number;
}

let cachedSession: SolvedCargoSession | null = null;

async function login(): Promise<SolvedCargoSession | null> {
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

async function getReservations(session: SolvedCargoSession): Promise<any[]> {
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
      // The response typically has a 'datos' array with reservation records
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
    console.error('SolvedCargo getReservations error:', error);
    return [];
  }
}

async function traceShipment(session: SolvedCargoSession, hawb: string): Promise<any | null> {
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

// Map SolvedCargo estados to our 13-stage system
function mapEstado(estadoRaw: string): string {
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

// GET /api/solvedcargo - Fetch all reservations from SolvedCargo
export async function GET(request: NextRequest) {
  try {
    const session = await login();
    if (!session) {
      return NextResponse.json({ ok: false, error: 'No se pudo conectar con SolvedCargo. Verifique las credenciales.' }, { status: 503 });
    }

    const reservations = await getReservations(session);
    
    // Map SolvedCargo data to our format
    const mapped = reservations.map((r: any) => ({
      cpk: r.hawb || r.HAWB || r.cpk || '',
      fecha: r.fecha || r.date || r.Fecha || null,
      estado: mapEstado(r.estado || r.Estado || r.status || ''),
      descripcion: r.mercancia || r.mercancías || r.Mercancias || r.description || null,
      embarcador: r.embarcador || r.Embarcador || r.shipper || null,
      consignatario: r.consignatario || r.Consignatario || r.consignee || null,
      carnetPrincipal: r.carnet || null,
      manifiesto: r.manifiesto || r.manifest || null,
      peso: r.peso || r.weight || null,
      _source: 'solvedcargo',
    }));

    return NextResponse.json({
      ok: true,
      data: mapped,
      count: mapped.length,
      source: 'solvedcargo',
      connected: true,
    });
  } catch (error) {
    console.error('SolvedCargo GET error:', error);
    return NextResponse.json({ ok: false, error: 'Error al consultar SolvedCargo' }, { status: 500 });
  }
}

// POST /api/solvedcargo - Sync SolvedCargo data into local database
export async function POST(request: NextRequest) {
  try {
    const session = await login();
    if (!session) {
      return NextResponse.json({ ok: false, error: 'No se pudo conectar con SolvedCargo' }, { status: 503 });
    }

    const { db } = await import('@/lib/db');
    const { normalizarCPK } = await import('@/lib/chambatina');
    
    const reservations = await getReservations(session);
    let synced = 0;
    let created = 0;
    let updated = 0;

    for (const r of reservations) {
      const cpkRaw = r.hawb || r.HAWB || r.cpk || '';
      if (!cpkRaw) continue;
      
      const cpk = normalizarCPK(cpkRaw);
      const estado = mapEstado(r.estado || r.Estado || r.status || '');
      const fecha = r.fecha || r.date || r.Fecha || null;
      const descripcion = r.mercancia || r.mercancías || r.Mercancias || null;
      const embarcador = r.embarcador || r.Embarcador || null;
      const consignatario = r.consignatario || r.Consignatario || null;
      const carnetPrincipal = r.carnet || null;

      const existing = await db.trackingEntry.findFirst({ where: { cpk } });
      
      if (existing) {
        await db.trackingEntry.update({
          where: { id: existing.id },
          data: {
            fecha: fecha || existing.fecha,
            estado: estado || existing.estado,
            descripcion: descripcion || existing.descripcion,
            embarcador: embarcador || existing.embarcador,
            consignatario: consignatario || existing.consignatario,
            carnetPrincipal: carnetPrincipal || existing.carnetPrincipal,
          },
        });
        updated++;
      } else {
        await db.trackingEntry.create({
          data: { cpk, fecha, estado, descripcion, embarcador, consignatario, carnetPrincipal },
        });
        created++;
      }
      synced++;
    }

    // Clear cache so next login is fresh
    cachedSession = null;

    return NextResponse.json({
      ok: true,
      message: `Sincronización completada`,
      synced,
      created,
      updated,
      total: reservations.length,
    });
  } catch (error) {
    console.error('SolvedCargo POST error:', error);
    return NextResponse.json({ ok: false, error: 'Error al sincronizar con SolvedCargo' }, { status: 500 });
  }
}
