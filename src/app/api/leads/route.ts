import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// POST - Create new email lead
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, nombre, source, cupon } = body;

    if (!email || typeof email !== 'string' || !email.includes('@')) {
      return NextResponse.json({ ok: false, error: 'Email invalido' }, { status: 400 });
    }

    const cleanEmail = email.trim().toLowerCase();
    const cleanNombre = nombre?.trim() || null;
    const cuponCode = cupon || 'CHAMBA10';

    // Check if email already exists
    const existing = await prisma.emailLead.findUnique({
      where: { email: cleanEmail },
    });

    if (existing) {
      return NextResponse.json({
        ok: true,
        data: {
          id: existing.id,
          email: existing.email,
          cupon: existing.cupon,
          yaRegistrado: true,
        },
      });
    }

    const lead = await prisma.emailLead.create({
      data: {
        email: cleanEmail,
        nombre: cleanNombre,
        source: source || 'popup',
        cupon: cuponCode,
      },
    });

    return NextResponse.json({
      ok: true,
      data: {
        id: lead.id,
        email: lead.email,
        cupon: lead.cupon,
        yaRegistrado: false,
      },
    });
  } catch (error: any) {
    console.error('Error saving lead:', error);
    return NextResponse.json({ ok: false, error: 'Error al guardar' }, { status: 500 });
  }
}

// GET - List all leads (admin)
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const limit = parseInt(searchParams.get('limit') || '100');
    const offset = parseInt(searchParams.get('offset') || '0');

    const [leads, total] = await Promise.all([
      prisma.emailLead.findMany({
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
      }),
      prisma.emailLead.count(),
    ]);

    // Stats
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const weekAgo = new Date(today);
    weekAgo.setDate(weekAgo.getDate() - 7);

    const [todayCount, weekCount, usedCount] = await Promise.all([
      prisma.emailLead.count({
        where: { createdAt: { gte: today } },
      }),
      prisma.emailLead.count({
        where: { createdAt: { gte: weekAgo } },
      }),
      prisma.emailLead.count({
        where: { usado: true },
      }),
    ]);

    return NextResponse.json({
      ok: true,
      data: {
        leads,
        total,
        stats: {
          total,
          hoy: todayCount,
          estaSemana: weekCount,
          cuponesUsados: usedCount,
        },
      },
    });
  } catch (error: any) {
    console.error('Error fetching leads:', error);
    return NextResponse.json({ ok: false, error: 'Error al consultar' }, { status: 500 });
  }
}
