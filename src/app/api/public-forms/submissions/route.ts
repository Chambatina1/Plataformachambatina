import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET /api/public-forms/submissions — List submissions for a form
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const formId = parseInt(searchParams.get('formId') || '0');
    const estado = searchParams.get('estado');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');

    if (!formId) {
      return NextResponse.json({ ok: false, error: 'formId es obligatorio' }, { status: 400 });
    }

    const where: any = { formId };
    if (estado && estado !== 'todos') where.estado = estado;

    const [submissions, total] = await Promise.all([
      db.publicFormSubmission.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      db.publicFormSubmission.count({ where }),
    ]);

    return NextResponse.json({
      ok: true,
      data: submissions,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (err: any) {
    console.error('Error fetching submissions:', err);
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 });
  }
}
