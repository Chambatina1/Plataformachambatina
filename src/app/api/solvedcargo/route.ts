import { NextRequest, NextResponse } from 'next/server';
import { login, getAllReservations, mapEstado, clearSession, mapRowToTracking } from '@/lib/solvedcargo';

// GET /api/solvedcargo - Fetch all reservations from SolvedCargo
export async function GET(request: NextRequest) {
  try {
    const session = await login();
    if (!session) {
      return NextResponse.json({ ok: false, error: 'No se pudo conectar con SolvedCargo. Verifique las credenciales.' }, { status: 503 });
    }

    const rows = await getAllReservations(session);

    // Map SolvedCargo data to our format
    const mapped = rows.map(mapRowToTracking).filter(Boolean);

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

    const rows = await getAllReservations(session);
    let synced = 0;
    let created = 0;
    let updated = 0;

    for (const row of rows) {
      const item = mapRowToTracking(row);
      if (!item) continue;

      const cpk = normalizarCPK(item.cpk);
      const estado = mapEstado(item.estado || '');
      const fecha = item.fecha;
      const descripcion = item.descripcion;
      const embarcador = item.embarcador;
      const consignatario = item.consignatario;
      const carnetPrincipal = item.carnetPrincipal;

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
      total: rows.length,
    });
  } catch (error) {
    console.error('SolvedCargo POST error:', error);
    return NextResponse.json({ ok: false, error: 'Error al sincronizar con SolvedCargo' }, { status: 500 });
  }
}
