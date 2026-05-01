import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Helper: parse date string to midnight
function parseDate(dateStr: string): Date {
  const d = new Date(dateStr + 'T00:00:00');
  return d;
}

// ============== GET ==============
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const type = searchParams.get('type');

    // --- STATS ---
    if (type === 'stats') {
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const weekStart = new Date(today);
      weekStart.setDate(weekStart.getDate() - weekStart.getDay() + 1); // Monday
      weekStart.setHours(0, 0, 0, 0);

      const [appointmentsToday, appointmentsWeek, pendingAppointments, completedWeek, totalNotes, dayRecordToday] = await Promise.all([
        prisma.tatiAppointment.count({
          where: { fecha: today, estado: { not: 'cancelada' } },
        }),
        prisma.tatiAppointment.count({
          where: {
            fecha: { gte: weekStart, lte: today },
            estado: { not: 'cancelada' },
          },
        }),
        prisma.tatiAppointment.count({
          where: { estado: 'pendiente', fecha: { gte: today } },
        }),
        prisma.tatiAppointment.count({
          where: {
            fecha: { gte: weekStart, lte: today },
            estado: 'completada',
          },
        }),
        prisma.tatiNote.count(),
        prisma.tatiDayRecord.findUnique({ where: { fecha: today } }),
      ]);

      return NextResponse.json({
        ok: true,
        data: {
          citasHoy: appointmentsToday,
          citasSemana: appointmentsWeek,
          pendientes: pendingAppointments,
          completadasSemana: completedWeek,
          notasActivas: totalNotes,
          registroHoy: dayRecordToday ? true : false,
        },
      });
    }

    // --- APPOINTMENTS ---
    if (type === 'appointments') {
      const fecha = searchParams.get('fecha');
      const from = searchParams.get('from');
      const to = searchParams.get('to');

      let where: any = {};

      if (fecha) {
        where.fecha = parseDate(fecha);
      } else if (from && to) {
        where.fecha = {
          gte: parseDate(from),
          lte: parseDate(to),
        };
      }

      const appointments = await prisma.tatiAppointment.findMany({
        where,
        orderBy: [{ fecha: 'asc' }, { hora: 'asc' }],
      });

      return NextResponse.json({ ok: true, data: appointments });
    }

    // --- NOTES ---
    if (type === 'notes') {
      const notes = await prisma.tatiNote.findMany({
        orderBy: [{ pinned: 'desc' }, { createdAt: 'desc' }],
      });
      return NextResponse.json({ ok: true, data: notes });
    }

    // --- DAY RECORD ---
    if (type === 'day-record') {
      const fecha = searchParams.get('fecha');
      if (!fecha) {
        return NextResponse.json({ ok: false, error: 'Fecha requerida' }, { status: 400 });
      }
      const record = await prisma.tatiDayRecord.findUnique({
        where: { fecha: parseDate(fecha) },
      });
      return NextResponse.json({ ok: true, data: record });
    }

    // --- DAY RECORDS (range) ---
    if (type === 'day-records') {
      const from = searchParams.get('from');
      const to = searchParams.get('to');

      let where: any = {};
      if (from && to) {
        where.fecha = {
          gte: parseDate(from),
          lte: parseDate(to),
        };
      }

      const records = await prisma.tatiDayRecord.findMany({
        where,
        orderBy: { fecha: 'desc' },
      });
      return NextResponse.json({ ok: true, data: records });
    }

    return NextResponse.json({ ok: false, error: 'Tipo no valido' }, { status: 400 });
  } catch (error: any) {
    console.error('El Tati GET error:', error);
    return NextResponse.json({ ok: false, error: 'Error al consultar datos' }, { status: 500 });
  }
}

// ============== POST ==============
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { type } = body;

    if (type === 'appointment') {
      const { titulo, descripcion, fecha, hora, duracion, prioridad, estado, tipo, ubicacion, contacto, link } = body;

      if (!titulo || !fecha) {
        return NextResponse.json({ ok: false, error: 'Titulo y fecha son requeridos' }, { status: 400 });
      }

      const appointment = await prisma.tatiAppointment.create({
        data: {
          titulo,
          descripcion: descripcion || null,
          fecha: parseDate(fecha),
          hora: hora || null,
          duracion: duracion || 30,
          prioridad: prioridad || 'media',
          estado: estado || 'pendiente',
          tipo: tipo || 'cita',
          ubicacion: ubicacion || null,
          contacto: contacto || null,
          link: link || null,
        },
      });

      return NextResponse.json({ ok: true, data: appointment });
    }

    if (type === 'note') {
      const { titulo, contenido, color, categoria, pinned } = body;

      if (!titulo) {
        return NextResponse.json({ ok: false, error: 'Titulo es requerido' }, { status: 400 });
      }

      const note = await prisma.tatiNote.create({
        data: {
          titulo,
          contenido: contenido || null,
          color: color || 'amber',
          categoria: categoria || 'general',
          pinned: pinned || false,
        },
      });

      return NextResponse.json({ ok: true, data: note });
    }

    if (type === 'day-record') {
      const { fecha, resumen, logros, pendientes, notas, estado } = body;

      if (!fecha) {
        return NextResponse.json({ ok: false, error: 'Fecha es requerida' }, { status: 400 });
      }

      // Upsert by fecha
      const record = await prisma.tatiDayRecord.upsert({
        where: { fecha: parseDate(fecha) },
        update: {
          resumen: resumen !== undefined ? resumen : undefined,
          logros: logros !== undefined ? logros : undefined,
          pendientes: pendientes !== undefined ? pendientes : undefined,
          notas: notas !== undefined ? notas : undefined,
          estado: estado || undefined,
        },
        create: {
          fecha: parseDate(fecha),
          resumen: resumen || null,
          logros: logros || [],
          pendientes: pendientes || [],
          notas: notas || null,
          estado: estado || 'activo',
        },
      });

      return NextResponse.json({ ok: true, data: record });
    }

    return NextResponse.json({ ok: false, error: 'Tipo no valido' }, { status: 400 });
  } catch (error: any) {
    console.error('El Tati POST error:', error);
    return NextResponse.json({ ok: false, error: 'Error al crear registro' }, { status: 500 });
  }
}

// ============== PUT ==============
export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const { type, id } = body;

    if (!id) {
      return NextResponse.json({ ok: false, error: 'ID es requerido' }, { status: 400 });
    }

    if (type === 'appointment') {
      const { action, titulo, descripcion, fecha, hora, duracion, prioridad, estado, tipo, ubicacion, contacto, link } = body;

      // Handle special actions
      if (action === 'completar') {
        const updated = await prisma.tatiAppointment.update({
          where: { id },
          data: { estado: 'completada' },
        });
        return NextResponse.json({ ok: true, data: updated });
      }

      if (action === 'cancelar') {
        const updated = await prisma.tatiAppointment.update({
          where: { id },
          data: { estado: 'cancelada' },
        });
        return NextResponse.json({ ok: true, data: updated });
      }

      // Regular update
      const data: any = {};
      if (titulo !== undefined) data.titulo = titulo;
      if (descripcion !== undefined) data.descripcion = descripcion;
      if (fecha !== undefined) data.fecha = parseDate(fecha);
      if (hora !== undefined) data.hora = hora;
      if (duracion !== undefined) data.duracion = duracion;
      if (prioridad !== undefined) data.prioridad = prioridad;
      if (estado !== undefined) data.estado = estado;
      if (tipo !== undefined) data.tipo = tipo;
      if (ubicacion !== undefined) data.ubicacion = ubicacion;
      if (contacto !== undefined) data.contacto = contacto;
      if (link !== undefined) data.link = link;

      const updated = await prisma.tatiAppointment.update({
        where: { id },
        data,
      });

      return NextResponse.json({ ok: true, data: updated });
    }

    if (type === 'note') {
      const { titulo, contenido, color, categoria, pinned } = body;

      const data: any = {};
      if (titulo !== undefined) data.titulo = titulo;
      if (contenido !== undefined) data.contenido = contenido;
      if (color !== undefined) data.color = color;
      if (categoria !== undefined) data.categoria = categoria;
      if (pinned !== undefined) data.pinned = pinned;

      const updated = await prisma.tatiNote.update({
        where: { id },
        data,
      });

      return NextResponse.json({ ok: true, data: updated });
    }

    if (type === 'day-record') {
      const { resumen, logros, pendientes, notas, estado } = body;

      const data: any = {};
      if (resumen !== undefined) data.resumen = resumen;
      if (logros !== undefined) data.logros = logros;
      if (pendientes !== undefined) data.pendientes = pendientes;
      if (notas !== undefined) data.notas = notas;
      if (estado !== undefined) data.estado = estado;

      const updated = await prisma.tatiDayRecord.update({
        where: { id },
        data,
      });

      return NextResponse.json({ ok: true, data: updated });
    }

    return NextResponse.json({ ok: false, error: 'Tipo no valido' }, { status: 400 });
  } catch (error: any) {
    console.error('El Tati PUT error:', error);
    return NextResponse.json({ ok: false, error: 'Error al actualizar registro' }, { status: 500 });
  }
}

// ============== DELETE ==============
export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const type = searchParams.get('type');
    const id = parseInt(searchParams.get('id') || '0');

    if (!id) {
      return NextResponse.json({ ok: false, error: 'ID es requerido' }, { status: 400 });
    }

    if (type === 'appointment') {
      await prisma.tatiAppointment.delete({ where: { id } });
      return NextResponse.json({ ok: true, message: 'Cita eliminada' });
    }

    if (type === 'note') {
      await prisma.tatiNote.delete({ where: { id } });
      return NextResponse.json({ ok: true, message: 'Nota eliminada' });
    }

    return NextResponse.json({ ok: false, error: 'Tipo no valido' }, { status: 400 });
  } catch (error: any) {
    console.error('El Tati DELETE error:', error);
    return NextResponse.json({ ok: false, error: 'Error al eliminar registro' }, { status: 500 });
  }
}
