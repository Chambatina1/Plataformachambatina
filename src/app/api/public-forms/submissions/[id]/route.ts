import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// POST /api/public-forms/submissions/[id] — Approve or reject a submission
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();
    const { accion, motivoRechazo, adminNotas, crearPedido } = body; // accion: "aprobar" | "rechazar"

    if (accion !== 'aprobar' && accion !== 'rechazar') {
      return NextResponse.json({ ok: false, error: 'Acción inválida' }, { status: 400 });
    }

    const submissionId = parseInt(id);
    const submission = await db.publicFormSubmission.findUnique({
      where: { id: submissionId },
      include: { form: true },
    });

    if (!submission) {
      return NextResponse.json({ ok: false, error: 'Solicitud no encontrada' }, { status: 404 });
    }

    if (submission.estado !== 'pendiente') {
      return NextResponse.json({ ok: false, error: 'Esta solicitud ya fue procesada' }, { status: 400 });
    }

    const updateData: any = { adminNotas: adminNotas || null };
    let pedidoId: number | null = null;

    if (accion === 'aprobar') {
      updateData.estado = 'aprobado';

      if (crearPedido) {
        const datos = JSON.parse(submission.datos);
        try {
          const pedido = await db.pedido.create({
            data: {
              nombreComprador: datos.nombre_comprador || datos.nombre || 'N/A',
              emailComprador: datos.email || datos.email_comprador || '',
              telefonoComprador: datos.telefono || datos.telefono_comprador || '',
              nombreDestinatario: datos.nombre_destinatario || datos.destinatario || '',
              telefonoDestinatario: datos.telefono_destinatario || datos.tel_destinatario || '',
              carnetDestinatario: datos.carnet || datos.carnet_destinatario || '',
              direccionDestinatario: datos.direccion || datos.direccion_destinatario || '',
              producto: datos.producto || datos.descripcion_producto || '',
              notas: `Solicitud desde formulario público: ${submission.form.nombre} (ID: ${submission.form.codigo})`,
              linkProducto: datos.link || datos.link_producto || null,
              plataforma: datos.plataforma || null,
            },
          });
          updateData.pedidoCreado = true;
          pedidoId = pedido.id;
        } catch (pedidoErr: any) {
          console.error('Error creating pedido from submission:', pedidoErr);
        }
      }
    } else {
      updateData.estado = 'rechazado';
      updateData.motivoRechazo = motivoRechazo || null;
    }

    const updated = await db.publicFormSubmission.update({
      where: { id: submissionId },
      data: updateData,
    });

    return NextResponse.json({
      ok: true,
      data: {
        submission: updated,
        pedidoId,
      },
    });
  } catch (err: any) {
    console.error('Error processing submission:', err);
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 });
  }
}
