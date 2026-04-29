import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET /api/dashboard?userId=X — Returns user data, pedidos, stats, spending data
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ ok: false, error: 'userId requerido' }, { status: 400 });
    }

    const user = await db.user.findUnique({
      where: { id: parseInt(userId, 10) },
    });

    if (!user) {
      return NextResponse.json({ ok: false, error: 'Usuario no encontrado' }, { status: 404 });
    }

    // Fetch pedidos with tracking for this user (match by email or phone)
    const pedidos = await db.pedido.findMany({
      where: {
        OR: [
          { emailComprador: user.email },
          { telefonoComprador: user.telefono || '' },
        ],
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    // Calculate stats
    const totalEnvios = pedidos.length;
    const enTransito = pedidos.filter(
      (p) => !['entregado', 'cancelado'].includes(p.estado.toLowerCase())
    ).length;
    const entregados = pedidos.filter(
      (p) => p.estado.toLowerCase() === 'entregado'
    ).length;

    // Fetch tracking entries for pedidos with CPK
    const cpkNumbers = pedidos.map((p) => p.producto).filter(Boolean);
    const trackingEntries = cpkNumbers.length > 0
      ? await db.trackingEntry.findMany({
          where: {
            cpk: { in: cpkNumbers },
          },
          orderBy: { createdAt: 'desc' },
        })
      : [];

    // Monthly spending data for the last 6 months
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
    sixMonthsAgo.setDate(1);

    const monthlyPedidos = pedidos.filter(
      (p) => new Date(p.createdAt) >= sixMonthsAgo
    );

    const monthlySpending: { month: string; total: number; count: number }[] = [];
    const monthNames = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];

    for (let i = 5; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      const monthStart = new Date(d.getFullYear(), d.getMonth(), 1);
      const monthEnd = new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59);

      const monthPedidos = pedidos.filter(
        (p) => new Date(p.createdAt) >= monthStart && new Date(p.createdAt) <= monthEnd
      );

      monthlySpending.push({
        month: `${monthNames[d.getMonth()]} ${d.getFullYear().toString().slice(2)}`,
        total: monthPedidos.length,
        count: monthPedidos.length,
      });
    }

    // Total gasto (estimate based on pedido count - real pricing would need weight data)
    const gastoTotal = pedidos.length * 25; // estimate $25 per pedido

    return NextResponse.json({
      ok: true,
      data: {
        user: {
          id: user.id,
          nombre: user.nombre,
          email: user.email,
          telefono: user.telefono,
          direccion: user.direccion,
          ciudad: user.ciudad,
        },
        pedidos: pedidos.map((p) => ({
          id: p.id,
          nombreComprador: p.nombreComprador,
          nombreDestinatario: p.nombreDestinatario,
          producto: p.producto,
          estado: p.estado,
          plataforma: p.plataforma,
          createdAt: p.createdAt,
          updatedAt: p.updatedAt,
        })),
        tracking: trackingEntries,
        stats: {
          totalEnvios,
          enTransito,
          entregados,
          gastoTotal,
        },
        monthlySpending,
      },
    });
  } catch (error) {
    console.error('[Dashboard] Error:', error);
    return NextResponse.json({ ok: false, error: 'Error al cargar dashboard' }, { status: 500 });
  }
}
