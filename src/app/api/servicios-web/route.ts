import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET /api/servicios-web — Returns all active web services
export async function GET() {
  try {
    const services = await db.webService.findMany({
      where: { active: true },
      orderBy: [
        { featured: 'desc' },
        { createdAt: 'desc' },
      ],
    });

    return NextResponse.json({
      ok: true,
      data: services,
    });
  } catch (error) {
    console.error('[ServiciosWeb] Error:', error);
    return NextResponse.json({ ok: false, error: 'Error al obtener servicios web' }, { status: 500 });
  }
}
