import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// POST /api/visits — Register a visit
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, page } = body;

    if (!userId || typeof userId !== 'number') {
      return NextResponse.json(
        { ok: false, error: 'userId es requerido' },
        { status: 400 }
      );
    }

    // Extract IP and user agent from headers
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 
               request.headers.get('x-real-ip') || 
               null;
    const userAgent = request.headers.get('user-agent') || null;

    // Create visit record
    const visit = await db.userVisit.create({
      data: {
        userId,
        userAgent: userAgent?.substring(0, 500) || null,
        ip: ip?.substring(0, 45) || null,
        page: page || '/',
      },
    });

    return NextResponse.json({ ok: true, data: visit });
  } catch (error) {
    console.error('[Visits] Error registering visit:', error);
    return NextResponse.json(
      { ok: false, error: 'Error al registrar visita' },
      { status: 500 }
    );
  }
}

// GET /api/visits — Get all visits (admin)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100);
    const userId = searchParams.get('userId');

    const where = userId ? { userId: parseInt(userId) } : {};

    const [visits, total] = await Promise.all([
      db.userVisit.findMany({
        where,
        include: {
          user: {
            select: { id: true, nombre: true, email: true, ciudad: true },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      db.userVisit.count({ where }),
    ]);

    return NextResponse.json({
      ok: true,
      data: visits,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    });
  } catch (error) {
    console.error('[Visits] Error fetching visits:', error);
    return NextResponse.json(
      { ok: false, error: 'Error al obtener visitas' },
      { status: 500 }
    );
  }
}
