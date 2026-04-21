import { NextRequest, NextResponse } from 'next/server';
import { pool } from '@/lib/pg';

// GET /api/pedidos/[id] - Get single pedido
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const result = await pool.query('SELECT * FROM pedidos WHERE id = $1', [id]);

    if (result.rows.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Pedido no encontrado' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: result.rows[0],
    });
  } catch (error) {
    console.error('Error fetching pedido:', error);
    return NextResponse.json(
      { success: false, error: 'Error al obtener el pedido' },
      { status: 500 }
    );
  }
}

// PUT /api/pedidos/[id] - Update a pedido
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    const {
      nombre_comprador,
      email_comprador,
      telefono_comprador,
      nombre_destinatario,
      telefono_destinatario,
      carnet_destinatario,
      direccion_destinatario,
      producto,
      notas,
      estado,
    } = body;

    // Validate required fields
    const requiredFields = [
      'nombre_comprador',
      'telefono_comprador',
      'nombre_destinatario',
      'telefono_destinatario',
      'direccion_destinatario',
      'producto',
    ];

    const missingFields = requiredFields.filter(
      (field) => !body[field] || String(body[field]).trim() === ''
    );
    if (missingFields.length > 0) {
      return NextResponse.json(
        {
          success: false,
          error: `Campos requeridos faltantes: ${missingFields.join(', ')}`,
        },
        { status: 400 }
      );
    }

    // Check if pedido exists
    const existing = await pool.query('SELECT * FROM pedidos WHERE id = $1', [id]);
    if (existing.rows.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Pedido no encontrado' },
        { status: 404 }
      );
    }

    const result = await pool.query(
      `UPDATE pedidos SET
        nombre_comprador = $1,
        email_comprador = $2,
        telefono_comprador = $3,
        nombre_destinatario = $4,
        telefono_destinatario = $5,
        carnet_destinatario = $6,
        direccion_destinatario = $7,
        producto = $8,
        notas = $9,
        estado = $10
       WHERE id = $11 RETURNING *`,
      [
        nombre_comprador.trim(),
        email_comprador?.trim() || null,
        telefono_comprador.trim(),
        nombre_destinatario.trim(),
        telefono_destinatario.trim(),
        carnet_destinatario?.trim() || null,
        direccion_destinatario.trim(),
        producto.trim(),
        notas?.trim() || null,
        estado || 'pendiente',
        id,
      ]
    );

    return NextResponse.json({
      success: true,
      data: result.rows[0],
      message: 'Pedido actualizado exitosamente',
    });
  } catch (error) {
    console.error('Error updating pedido:', error);
    return NextResponse.json(
      { success: false, error: 'Error al actualizar el pedido' },
      { status: 500 }
    );
  }
}

// DELETE /api/pedidos/[id] - Delete a pedido
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const existing = await pool.query('SELECT * FROM pedidos WHERE id = $1', [id]);
    if (existing.rows.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Pedido no encontrado' },
        { status: 404 }
      );
    }

    await pool.query('DELETE FROM pedidos WHERE id = $1', [id]);

    return NextResponse.json({
      success: true,
      message: 'Pedido eliminado exitosamente',
    });
  } catch (error) {
    console.error('Error deleting pedido:', error);
    return NextResponse.json(
      { success: false, error: 'Error al eliminar el pedido' },
      { status: 500 }
    );
  }
}
