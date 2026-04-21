import { NextResponse } from 'next/server';
import { pool } from '@/lib/pg';

// GET /api/stats - Dashboard statistics
export async function GET() {
  try {
    // Total pedidos
    const totalResult = await pool.query('SELECT COUNT(*) as total FROM pedidos');
    const totalPedidos = parseInt(totalResult.rows[0].total, 10);

    // Count by estado
    const estadoResult = await pool.query(
      `SELECT estado, COUNT(*) as count FROM pedidos GROUP BY estado`
    );
    const porEstado: Record<string, number> = {
      pendiente: 0,
      en_proceso: 0,
      entregado: 0,
      cancelado: 0,
    };
    for (const row of estadoResult.rows) {
      porEstado[row.estado] = parseInt(row.count, 10);
    }

    // Last 5 orders
    const ultimosResult = await pool.query(
      'SELECT * FROM pedidos ORDER BY created_at DESC LIMIT 5'
    );

    return NextResponse.json({
      success: true,
      data: {
        totalPedidos,
        porEstado,
        ultimosPedidos: ultimosResult.rows,
      },
    });
  } catch (error) {
    console.error('Error fetching stats:', error);
    return NextResponse.json(
      { success: false, error: 'Error al obtener las estadísticas' },
      { status: 500 }
    );
  }
}
