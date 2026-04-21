import { NextRequest, NextResponse } from 'next/server';
import { pool } from '@/lib/pg';

// GET /api/pedidos - List all pedidos with filtering, search, and pagination
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const estado = searchParams.get('estado') || '';
    const search = searchParams.get('search') || '';
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
    const limit = Math.max(1, Math.min(100, parseInt(searchParams.get('limit') || '10', 10)));
    const offset = (page - 1) * limit;

    let whereClause = 'WHERE 1=1';
    const params: (string | number)[] = [];
    let paramIndex = 1;

    if (estado) {
      whereClause += ` AND estado = $${paramIndex}`;
      params.push(estado);
      paramIndex++;
    }

    if (search) {
      whereClause += ` AND (nombre_comprador ILIKE $${paramIndex} OR nombre_destinatario ILIKE $${paramIndex} OR producto ILIKE $${paramIndex})`;
      params.push(`%${search}%`);
      paramIndex++;
    }

    // Get total count
    const countResult = await pool.query(
      `SELECT COUNT(*) as total FROM pedidos ${whereClause}`,
      params
    );
    const total = parseInt(countResult.rows[0].total, 10);

    // Get paginated data
    const dataResult = await pool.query(
      `SELECT * FROM pedidos ${whereClause} ORDER BY created_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
      [...params, limit, offset]
    );

    return NextResponse.json({
      success: true,
      data: dataResult.rows,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error('Error fetching pedidos:', error);
    return NextResponse.json(
      { success: false, error: 'Error al obtener los pedidos' },
      { status: 500 }
    );
  }
}

// POST /api/pedidos - Create a new pedido
export async function POST(request: NextRequest) {
  try {
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

    const missingFields = requiredFields.filter((field) => !body[field] || String(body[field]).trim() === '');
    if (missingFields.length > 0) {
      return NextResponse.json(
        {
          success: false,
          error: `Campos requeridos faltantes: ${missingFields.join(', ')}`,
        },
        { status: 400 }
      );
    }

    // Validate email format if provided
    if (email_comprador && email_comprador.trim() !== '') {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email_comprador)) {
        return NextResponse.json(
          { success: false, error: 'El formato del email no es válido' },
          { status: 400 }
        );
      }
    }

    const result = await pool.query(
      `INSERT INTO pedidos (nombre_comprador, email_comprador, telefono_comprador, nombre_destinatario, telefono_destinatario, carnet_destinatario, direccion_destinatario, producto, notas, estado)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING *`,
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
      ]
    );

    return NextResponse.json(
      {
        success: true,
        data: result.rows[0],
        message: 'Pedido creado exitosamente',
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating pedido:', error);
    return NextResponse.json(
      { success: false, error: 'Error al crear el pedido' },
      { status: 500 }
    );
  }
}
