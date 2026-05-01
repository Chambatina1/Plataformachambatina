import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET /api/public-forms/[code] — Get form by public code (for client form page)
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  try {
    const { code } = await params;

    if (!code || code.length < 4) {
      return NextResponse.json({ ok: false, error: 'Código inválido' }, { status: 400 });
    }

    const form = await db.publicForm.findUnique({
      where: { code: code.toUpperCase() },
    });

    if (!form) {
      return NextResponse.json({ ok: false, error: 'Formulario no encontrado' }, { status: 404 });
    }

    if (!form.activo) {
      return NextResponse.json({ ok: false, error: 'Este formulario está desactivado' }, { status: 410 });
    }

    // Return form without internal IDs — only what the client needs
    return NextResponse.json({
      ok: true,
      data: {
        nombre: form.nombre,
        descripcion: form.descripcion,
        campos: JSON.parse(form.campos),
      },
    });
  } catch (err: any) {
    console.error('Error fetching public form by code:', err);
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 });
  }
}
