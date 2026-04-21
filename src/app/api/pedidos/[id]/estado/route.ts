import { NextRequest, NextResponse } from 'next/server';
import { pool } from '@/lib/pg';

// PATCH /api/pedidos/[id]/estado - Update pedido status
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    const { estado } = body;

    if (!estado || typeof estado !== 'string' || estado.trim() === '') {
      return NextResponse.json(
        { success: false, error: 'El estado es requerido' },
        { status: 400 }
      );
    }

    const validEstados = ['pendiente', 'en_proceso', 'entregado', 'cancelado'];
    if (!validEstados.includes(estado.trim())) {
      return NextResponse.json(
        {
          success: false,
          error: `Estado no válido. Estados permitidos: ${validEstados.join(', ')}`,
        },
        { status: 400 }
      );
    }

    const existing = await pool.query('SELECT * FROM pedidos WHERE id = $1', [id]);
    if (existing.rows.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Pedido no encontrado' },
        { status: 404 }
      );
    }

    const result = await pool.query(
      'UPDATE pedidos SET estado = $1 WHERE id = $2 RETURNING *',
      [estado.trim(), id]
    );

    return NextResponse.json({
      success: true,
      data: result.rows[0],
      message: 'Estado actualizado exitosamente',
    });
  } catch (error) {
    console.error('Error updating estado:', error);
    return NextResponse.json(
      { success: false, error: 'Error al actualizar el estado' },
      { status: 500 }
    );
  }
}
