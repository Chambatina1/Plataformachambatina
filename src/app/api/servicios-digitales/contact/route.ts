import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// POST /api/servicios-digitales/contact — Save contact request
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { nombre, email, telefono, mensaje, servicio, precio } = body;

    if (!nombre?.trim() || !email?.trim() || !mensaje?.trim()) {
      return NextResponse.json({ ok: false, error: 'Nombre, email y mensaje son obligatorios' }, { status: 400 });
    }

    // Save as EmailLead for tracking
    await prisma.emailLead.create({
      data: {
        nombre: nombre.trim(),
        email: email.trim(),
        source: 'servicio-digital',
        cupon: servicio ? `Servicio: ${servicio}` : 'Consulta general',
      },
    });

    // Save detailed message in EmailLog for admin to review
    await prisma.emailLog.create({
      data: {
        userEmail: email.trim(),
        asunto: `Solicitud de servicio: ${servicio || 'Consulta general'}`,
        tipo: 'servicio-contacto',
        estado: 'pendiente',
        error: JSON.stringify({
          nombre: nombre.trim(),
          telefono: telefono?.trim() || null,
          servicio: servicio || null,
          precio: precio || null,
          mensaje: mensaje.trim(),
        }),
      },
    });

    return NextResponse.json({ ok: true, message: 'Solicitud enviada correctamente' });
  } catch (error: any) {
    console.error('Error saving service contact:', error);
    return NextResponse.json({ ok: false, error: 'Error al guardar la solicitud' }, { status: 500 });
  }
}
