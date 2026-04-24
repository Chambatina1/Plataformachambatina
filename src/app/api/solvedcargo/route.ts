import { NextRequest, NextResponse } from 'next/server';
import { login, getAllReservations, mapEstado, clearSession } from '@/lib/solvedcargo';

// GET /api/solvedcargo - Fetch all reservations from SolvedCargo
export async function GET(request: NextRequest) {
  try {
    const session = await login();
    if (!session) {
      return NextResponse.json({ ok: false, error: 'No se pudo conectar con SolvedCargo. Verifique las credenciales.' }, { status: 503 });
    }

    const reservations = await getAllReservations(session);

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

    const reservations = await getAllReservations(session);
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

    // Clear session so next login is fresh
    clearSession();

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
