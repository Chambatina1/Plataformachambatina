import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// POST /api/public-forms/submit — Client submits a public form
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { codigo, datos } = body;

    if (!codigo || typeof codigo !== 'string') {
      return NextResponse.json({ ok: false, error: 'Código de formulario es obligatorio' }, { status: 400 });
    }

    if (!datos || typeof datos !== 'object') {
      return NextResponse.json({ ok: false, error: 'Datos inválidos' }, { status: 400 });
    }

    // Verify form exists and is active
    const form = await db.publicForm.findUnique({
      where: { codigo: codigo.toUpperCase() },
    });

    if (!form) {
      return NextResponse.json({ ok: false, error: 'Formulario no encontrado' }, { status: 404 });
    }

    if (!form.activo) {
      return NextResponse.json({ ok: false, error: 'Este formulario está desactivado temporalmente' }, { status: 410 });
    }

    // Validate required fields against form definition
    const camposDef = JSON.parse(form.campos);
    const requiredFields = camposDef.filter((c: any) => c.requerido);
    const missingFields: string[] = [];
    for (const field of requiredFields) {
      const val = datos[field.nombre];
      if (val === undefined || val === null || String(val).trim() === '') {
        missingFields.push(field.etiqueta || field.nombre);
      }
    }

    if (missingFields.length > 0) {
      return NextResponse.json({
        ok: false,
        error: `Faltan campos obligatorios: ${missingFields.join(', ')}`,
      }, { status: 400 });
    }

    // Create submission
    const submission = await db.publicFormSubmission.create({
      data: {
        formId: form.id,
        datos: JSON.stringify(datos),
      },
    });

    return NextResponse.json({
      ok: true,
      data: {
        id: submission.id,
        message: 'Tu solicitud fue enviada correctamente. Te contactaremos pronto.',
      },
    }, { status: 201 });
  } catch (err: any) {
    console.error('Error submitting public form:', err);
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 });
  }
}
