import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import nodemailer from 'nodemailer';

// ─── GET /api/email/weekly-tracking ──────────────────────────────────────
// Sends weekly tracking status email to all registered users
// Can be triggered by: curl /api/email/weekly-tracking?secret=CHAMBA_WEEKLY_2024
// Or scheduled via Render cron job

export async function GET(req: NextRequest) {
  const searchParams = req.nextUrl.searchParams;
  const secret = searchParams.get('secret');

  // Simple auth to prevent unauthorized calls
  if (secret !== 'CHAMBA_WEEKLY_2024') {
    return NextResponse.json({ ok: false, error: 'No autorizado' }, { status: 403 });
  }

  try {
    // 1. Get all users with emails
    const users = await db.user.findMany({
      where: { email: { not: null }, isActive: true },
      select: { id: true, nombre: true, email: true },
    });

    if (users.length === 0) {
      return NextResponse.json({ ok: true, message: 'No hay usuarios registrados', sent: 0 });
    }

    // 2. Get SolvedCargo data (using the existing module)
    let solvedCargoResults: any[] = [];
    let solvedCargoError: string | null = null;

    try {
      const { login, getAllReservations, mapRowToTracking, mapEstado } = await import('@/lib/solvedcargo');
      const session = await login();

      if (session) {
        const rows = await getAllReservations(session);
        solvedCargoResults = rows.map(mapRowToTracking).filter(Boolean);
      } else {
        solvedCargoError = 'No se pudo conectar con SolvedCargo';
      }
    } catch (scErr: any) {
      solvedCargoError = scErr.message || 'Error al consultar SolvedCargo';
    }

    // 3. Build tracking data summary
    const estadoCount: Record<string, number> = {};
    solvedCargoResults.forEach((r: any) => {
      const estado = r.estado || 'EN AGENCIA';
      estadoCount[estado] = (estadoCount[estado] || 0) + 1;
    });

    const totalPackages = solvedCargoResults.length;
    const estadosHtml = Object.entries(estadoCount)
      .sort(([, a], [, b]) => (b as number) - (a as number))
      .map(([estado, count]) => `
        <tr>
          <td style="padding: 8px 12px; border-bottom: 1px solid #f3f4f6; font-weight: 500; color: #18181b;">${estado}</td>
          <td style="padding: 8px 12px; border-bottom: 1px solid #f3f4f6; text-align: center; color: #18181b;">${count}</td>
        </tr>
      `).join('');

    // 4. Build HTML email template
    const today = new Date().toLocaleDateString('es-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });

    const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; background-color: #f9fafb; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
  <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
    <!-- Header -->
    <div style="background: linear-gradient(135deg, #f59e0b, #d97706); padding: 30px; border-radius: 16px 16px 0 0; text-align: center;">
      <h1 style="margin: 0; color: white; font-size: 24px; font-weight: 800;">CHAMBATINA</h1>
      <p style="margin: 8px 0 0; color: #fef3c7; font-size: 14px;">Reporte Semanal de Envios</p>
    </div>

    <!-- Body -->
    <div style="background: white; padding: 30px; border-radius: 0 0 16px 16px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1);">
      <p style="margin: 0 0 20px; color: #374151; font-size: 15px; line-height: 1.6;">
       Hola, <strong>${'{nombre}'}</strong>! Aqui tienes el resumen semanal del estado de los envios en SolvedCargo.
      </p>

      <div style="background: #fffbeb; border: 1px solid #fde68a; border-radius: 12px; padding: 16px; margin-bottom: 24px;">
        <p style="margin: 0 0 4px; font-size: 12px; color: #92400e; font-weight: 600;">FECHA DEL REPORTE</p>
        <p style="margin: 0; font-size: 16px; color: #78350f; font-weight: 700;">${today}</p>
      </div>

      ${solvedCargoError ? `
        <div style="background: #fef2f2; border: 1px solid #fecaca; border-radius: 12px; padding: 16px; margin-bottom: 24px;">
          <p style="margin: 0; color: #991b1b; font-size: 14px;">
            <strong>Aviso:</strong> No se pudieron obtener los datos de SolvedCargo en este momento (${solvedCargoError}). Intentaremos nuevamente la proxima semana.
          </p>
        </div>
      ` : `
        <!-- Stats Cards -->
        <div style="display: flex; gap: 12px; margin-bottom: 24px;">
          <div style="flex: 1; background: #f0fdf4; border-radius: 12px; padding: 16px; text-align: center;">
            <p style="margin: 0; font-size: 28px; font-weight: 800; color: #166534;">${totalPackages}</p>
            <p style="margin: 4px 0 0; font-size: 12px; color: #166534; font-weight: 500;">Envios Totales</p>
          </div>
          ${estadoCount['ENTREGADO'] ? `
          <div style="flex: 1; background: #f0fdf4; border-radius: 12px; padding: 16px; text-align: center;">
            <p style="margin: 0; font-size: 28px; font-weight: 800; color: #166534;">${estadoCount['ENTREGADO']}</p>
            <p style="margin: 4px 0 0; font-size: 12px; color: #166534; font-weight: 500;">Entregados</p>
          </div>
          ` : ''}
          ${estadoCount['EN TRANSITO'] || estadoCount['TRASLADO PROVINCIA'] ? `
          <div style="flex: 1; background: #eff6ff; border-radius: 12px; padding: 16px; text-align: center;">
            <p style="margin: 0; font-size: 28px; font-weight: 800; color: #1e40af;">${(estadoCount['EN TRANSITO'] || 0) + (estadoCount['TRASLADO PROVINCIA'] || 0)}</p>
            <p style="margin: 4px 0 0; font-size: 12px; color: #1e40af; font-weight: 500;">En Transito</p>
          </div>
          ` : ''}
        </div>

        <!-- Status Table -->
        ${totalPackages > 0 ? `
        <h3 style="margin: 0 0 12px; font-size: 16px; color: #18181b; font-weight: 700;">Estado de Envios</h3>
        <table style="width: 100%; border-collapse: collapse; margin-bottom: 24px; background: #fafafa; border-radius: 12px; overflow: hidden;">
          <thead>
            <tr style="background: #f3f4f6;">
              <th style="padding: 10px 12px; text-align: left; font-size: 13px; color: #374151; font-weight: 600;">Estado</th>
              <th style="padding: 10px 12px; text-align: center; font-size: 13px; color: #374151; font-weight: 600;">Cantidad</th>
            </tr>
          </thead>
          <tbody>
            ${estadosHtml}
          </tbody>
        </table>
        ` : `
        <div style="text-align: center; padding: 24px; background: #f9fafb; border-radius: 12px; margin-bottom: 24px;">
          <p style="margin: 0; color: #6b7280; font-size: 14px;">No hay envios activos en este momento.</p>
        </div>
        `}
      `}

      <!-- CTA -->
      <div style="text-align: center; padding: 20px; background: linear-gradient(135deg, #fffbeb, #fef3c7); border-radius: 12px;">
        <p style="margin: 0 0 12px; color: #92400e; font-size: 14px;">Para ver el detalle de tu envio, visita nuestro rastreador:</p>
        <a href="${process.env.NEXT_PUBLIC_URL || 'https://plataformachambatina.onrender.com'}" 
           style="display: inline-block; background: linear-gradient(135deg, #f59e0b, #d97706); color: white; padding: 12px 32px; border-radius: 8px; text-decoration: none; font-weight: 700; font-size: 14px;">
          Rastrear mi Paquete
        </a>
      </div>
    </div>

    <!-- Footer -->
    <div style="text-align: center; padding: 20px; color: #9ca3af; font-size: 12px;">
      <p style="margin: 0;">Chambatina - Envios Internacionales</p>
      <p style="margin: 4px 0 0;">Este reporte se envia automaticamente cada semana.</p>
      <p style="margin: 4px 0 0;">
        <a href="${process.env.NEXT_PUBLIC_URL || 'https://plataformachambatina.onrender.com'}" style="color: #f59e0b; text-decoration: none;">Plataforma Chambatina</a>
      </p>
    </div>
  </div>
</body>
</html>`;

    // 5. Setup email transporter
    const smtpConfig = await getSmtpConfig();
    const host = smtpConfig.SMTP_HOST || process.env.SMTP_HOST || '';
    const port = parseInt(smtpConfig.SMTP_PORT || process.env.SMTP_PORT || '587', 10);
    const user = smtpConfig.SMTP_USER || process.env.SMTP_USER || '';
    const pass = smtpConfig.SMTP_PASS || process.env.SMTP_PASS || '';
    const emailFrom = smtpConfig.EMAIL_FROM || process.env.EMAIL_FROM || '';

    let sent = 0;
    let failed = 0;
    const errors: string[] = [];

    if (host && user && pass && emailFrom) {
      // Real email sending
      const transporter = nodemailer.createTransport({
        host, port, secure: port === 465, auth: { user, pass },
      });

      for (const u of users) {
        if (!u.email) continue;
        try {
          const personalHtml = html.replace(/{nombre}/g, u.nombre || 'Cliente');
          await transporter.sendMail({
            from: emailFrom,
            to: u.email,
            subject: `Reporte Semanal de Envios - Chambatina (${today})`,
            html: personalHtml,
          });
          sent++;

          // Log email
          await db.emailLog.create({
            data: {
              userId: u.id,
              userEmail: u.email,
              asunto: `Reporte Semanal de Envios - Chambatina`,
              tipo: 'weekly-tracking',
              estado: 'enviado',
            },
          });
        } catch (err: any) {
          failed++;
          errors.push(`${u.email}: ${err.message}`);
          console.error(`[WeeklyEmail] Error sending to ${u.email}:`, err.message);

          await db.emailLog.create({
            data: {
              userId: u.id,
              userEmail: u.email,
              asunto: `Reporte Semanal de Envios - Chambatina`,
              tipo: 'weekly-tracking',
              estado: 'fallido',
              error: err.message,
            },
          });
        }

        // Small delay between emails to avoid rate limiting
        await new Promise(r => setTimeout(r, 500));
      }
    } else {
      // SMTP not configured - log what would be sent
      console.log('╔══════════════════════════════════════════════════════════╗');
      console.log('║  EMAIL SEMANAL - SMTP NO CONFIGURADO                    ║');
      console.log('╠══════════════════════════════════════════════════════════╣');
      console.log(`║  Usuarios: ${users.length}  |  Paquetes SolvedCargo: ${totalPackages}   ║`);
      if (solvedCargoError) {
      console.log(`║  SolvedCargo Error: ${solvedCargoError}`);
      }
      console.log('║  Configure SMTP en .env o Config panel para enviar     ║');
      console.log('╚══════════════════════════════════════════════════════════╝');

      sent = users.length;

      for (const u of users) {
        if (!u.email) continue;
        await db.emailLog.create({
          data: {
            userId: u.id,
            userEmail: u.email,
            asunto: `Reporte Semanal de Envios - Chambatina (SMTP no configurado)`,
            tipo: 'weekly-tracking',
            estado: 'enviado',
            error: 'SMTP no configurado. Correo registrado pero no enviado.',
          },
        });
      }
    }

    return NextResponse.json({
      ok: true,
      message: 'Reporte semanal procesado',
      totalUsers: users.length,
      sent,
      failed,
      totalPackages,
      solvedCargoError,
      smtpConfigured: !!(host && user && pass),
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (error: any) {
    console.error('[WeeklyEmail] Error:', error);
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }
}

// ─── SMTP Config Helper ──────────────────────────────────────────────────
async function getSmtpConfig(): Promise<Record<string, string>> {
  try {
    const keys = ['SMTP_HOST', 'SMTP_PORT', 'SMTP_USER', 'SMTP_PASS', 'EMAIL_FROM'];
    const entries = await db.config.findMany({ where: { clave: { in: keys } } });
    const config: Record<string, string> = {};
    for (const entry of entries) {
      config[entry.clave] = entry.valor;
    }
    return config;
  } catch {
    return {};
  }
}
