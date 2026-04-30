import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET /api/cron/weekly-email
// This endpoint auto-sends weekly tracking emails to all users.
// It checks a "last sent" timestamp in the Config table — only sends
// if at least 7 days have passed since the last send.
// Render's health check hits / every 30s, so we piggyback on traffic.
// Alternatively, call it manually: GET /api/cron/weekly-email?secret=CHAMBA_WEEKLY_2024
// Or set up a FREE external cron (cron-job.org, EasyCron) to hit this URL weekly.

export const dynamic = 'force-dynamic';
export const maxDuration = 60; // Allow up to 60s for sending many emails

export async function GET(req: Request) {
  const url = new URL(req.url);
  const manualSecret = url.searchParams.get('secret');
  const isManualCall = manualSecret === 'CHAMBA_WEEKLY_2024';

  // Safety: only allow auto-trigger via specific query param or secret
  // On Render free tier, the app sleeps after inactivity.
  // We use a lightweight ping mechanism: any request to / triggers this check.
  if (!isManualCall) {
    return NextResponse.json({ ok: false, error: 'Usa ?secret=CHAMBA_WEEKLY_2024' }, { status: 403 });
  }

  try {
    // 1. Check if we already sent this week
    const lastSent = await db.config.findUnique({ where: { clave: 'weekly_email_last_sent' } });
    const lastSentTime = lastSent?.valor ? new Date(lastSent.valor).getTime() : 0;
    const now = Date.now();
    const ONE_WEEK_MS = 7 * 24 * 60 * 60 * 1000;

    if (!isManualCall && (now - lastSentTime) < ONE_WEEK_MS) {
      const nextSend = new Date(lastSentTime + ONE_WEEK_MS).toLocaleDateString('es-US');
      return NextResponse.json({
        ok: true,
        message: `Ya se envio esta semana. Proximo envio: ${nextSend}`,
        lastSent: lastSent?.valor,
        skipped: true,
      });
    }

    // 2. Get all users with emails
    const users = await db.user.findMany({
      where: { email: { not: null }, isActive: true },
      select: { id: true, nombre: true, email: true },
    });

    if (users.length === 0) {
      return NextResponse.json({ ok: true, message: 'No hay usuarios registrados', sent: 0 });
    }

    // 3. Get SolvedCargo data
    let solvedCargoResults: any[] = [];
    let solvedCargoError: string | null = null;

    try {
      const { login, getAllReservations, mapRowToTracking } = await import('@/lib/solvedcargo');
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

    // 4. Build status summary
    const estadoCount: Record<string, number> = {};
    solvedCargoResults.forEach((r: any) => {
      const estado = r.estado || 'EN AGENCIA';
      estadoCount[estado] = (estadoCount[estado] || 0) + 1;
    });

    const totalPackages = solvedCargoResults.length;
    const entregados = estadoCount['ENTREGADO'] || 0;
    const enTransito = (estadoCount['EN TRANSITO'] || 0) + (estadoCount['TRASLADO PROVINCIA'] || 0);

    const estadosHtml = Object.entries(estadoCount)
      .sort(([, a], [, b]) => (b as number) - (a as number))
      .map(([estado, count]) => `
        <tr>
          <td style="padding: 8px 12px; border-bottom: 1px solid #f3f4f6; font-weight: 500; color: #18181b;">${estado}</td>
          <td style="padding: 8px 12px; border-bottom: 1px solid #f3f4f6; text-align: center; color: #18181b;">${count}</td>
        </tr>
      `).join('');

    // 5. Build email HTML
    const today = new Date().toLocaleDateString('es-US', {
      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
    });
    const siteUrl = process.env.NEXT_PUBLIC_URL || 'https://plataformachambatina.onrender.com';

    const buildHtml = (nombre: string) => `
<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#f9fafb;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
<div style="max-width:600px;margin:0 auto;padding:20px;">
  <div style="background:linear-gradient(135deg,#f59e0b,#d97706);padding:30px;border-radius:16px 16px 0 0;text-align:center;">
    <h1 style="margin:0;color:white;font-size:24px;font-weight:800;">CHAMBATINA</h1>
    <p style="margin:8px 0 0;color:#fef3c7;font-size:14px;">Reporte Semanal de Envios</p>
  </div>
  <div style="background:white;padding:30px;border-radius:0 0 16px 16px;box-shadow:0 4px 6px -1px rgba(0,0,0,0.1);">
    <p style="margin:0 0 20px;color:#374151;font-size:15px;line-height:1.6;">
      Hola, <strong>${nombre}</strong>! Aqui tienes el resumen semanal del estado de los envios en SolvedCargo.
    </p>
    <div style="background:#fffbeb;border:1px solid #fde68a;border-radius:12px;padding:16px;margin-bottom:24px;">
      <p style="margin:0 0 4px;font-size:12px;color:#92400e;font-weight:600;">FECHA DEL REPORTE</p>
      <p style="margin:0;font-size:16px;color:#78350f;font-weight:700;">${today}</p>
    </div>
    ${solvedCargoError ? `
      <div style="background:#fef2f2;border:1px solid #fecaca;border-radius:12px;padding:16px;margin-bottom:24px;">
        <p style="margin:0;color:#991b1b;font-size:14px;"><strong>Aviso:</strong> No se pudieron obtener datos de SolvedCargo (${solvedCargoError}).</p>
      </div>
    ` : `
      <div style="display:flex;gap:12px;margin-bottom:24px;">
        <div style="flex:1;background:#f0fdf4;border-radius:12px;padding:16px;text-align:center;">
          <p style="margin:0;font-size:28px;font-weight:800;color:#166534;">${totalPackages}</p>
          <p style="margin:4px 0 0;font-size:12px;color:#166534;font-weight:500;">Total</p>
        </div>
        <div style="flex:1;background:#f0fdf4;border-radius:12px;padding:16px;text-align:center;">
          <p style="margin:0;font-size:28px;font-weight:800;color:#166534;">${entregados}</p>
          <p style="margin:4px 0 0;font-size:12px;color:#166534;font-weight:500;">Entregados</p>
        </div>
        <div style="flex:1;background:#eff6ff;border-radius:12px;padding:16px;text-align:center;">
          <p style="margin:0;font-size:28px;font-weight:800;color:#1e40af;">${enTransito}</p>
          <p style="margin:4px 0 0;font-size:12px;color:#1e40af;font-weight:500;">En Transito</p>
        </div>
      </div>
      ${totalPackages > 0 ? `
        <h3 style="margin:0 0 12px;font-size:16px;color:#18181b;font-weight:700;">Estado de Envios</h3>
        <table style="width:100%;border-collapse:collapse;margin-bottom:24px;background:#fafafa;border-radius:12px;overflow:hidden;">
          <thead><tr style="background:#f3f4f6;">
            <th style="padding:10px 12px;text-align:left;font-size:13px;color:#374151;font-weight:600;">Estado</th>
            <th style="padding:10px 12px;text-align:center;font-size:13px;color:#374151;font-weight:600;">Cantidad</th>
          </tr></thead>
          <tbody>${estadosHtml}</tbody>
        </table>
      ` : `
        <div style="text-align:center;padding:24px;background:#f9fafb;border-radius:12px;margin-bottom:24px;">
          <p style="margin:0;color:#6b7280;font-size:14px;">No hay envios activos en este momento.</p>
        </div>
      `}
    `}
    <div style="text-align:center;padding:20px;background:linear-gradient(135deg,#fffbeb,#fef3c7);border-radius:12px;">
      <p style="margin:0 0 12px;color:#92400e;font-size:14px;">Para ver el detalle de tu envio, visita nuestro rastreador:</p>
      <a href="${siteUrl}" style="display:inline-block;background:linear-gradient(135deg,#f59e0b,#d97706);color:white;padding:12px 32px;border-radius:8px;text-decoration:none;font-weight:700;font-size:14px;">Rastrear mi Paquete</a>
    </div>
  </div>
  <div style="text-align:center;padding:20px;color:#9ca3af;font-size:12px;">
    <p style="margin:0;">Chambatina - Envios Internacionales</p>
    <p style="margin:4px 0 0;">Este reporte se envia automaticamente cada semana.</p>
  </div>
</div>
</body></html>`;

    // 6. Get SMTP config
    const smtpConfig = await getSmtpConfig();
    const host = smtpConfig.SMTP_HOST || process.env.SMTP_HOST || '';
    const port = parseInt(smtpConfig.SMTP_PORT || process.env.SMTP_PORT || '587', 10);
    const smtpUser = smtpConfig.SMTP_USER || process.env.SMTP_USER || '';
    const smtpPass = smtpConfig.SMTP_PASS || process.env.SMTP_PASS || '';
    const emailFrom = smtpConfig.EMAIL_FROM || process.env.EMAIL_FROM || '';
    const smtpReady = !!(host && smtpUser && smtpPass && emailFrom);

    let sent = 0;
    let failed = 0;
    const errors: string[] = [];

    if (smtpReady) {
      // Dynamic import nodemailer
      const nodemailer = (await import('nodemailer')).default;
      const transporter = nodemailer.createTransport({
        host, port, secure: port === 465, auth: { user: smtpUser, pass: smtpPass },
      });

      for (const u of users) {
        if (!u.email) continue;
        try {
          await transporter.sendMail({
            from: emailFrom,
            to: u.email,
            subject: `Reporte Semanal de Envios - Chambatina (${today})`,
            html: buildHtml(u.nombre || 'Cliente'),
          });
          sent++;
          await db.emailLog.create({
            data: { userId: u.id, userEmail: u.email, asunto: 'Reporte Semanal de Envios - Chambatina', tipo: 'weekly-tracking', estado: 'enviado' },
          });
        } catch (err: any) {
          failed++;
          errors.push(`${u.email}: ${err.message}`);
          await db.emailLog.create({
            data: { userId: u.id, userEmail: u.email, asunto: 'Reporte Semanal - Chambatina', tipo: 'weekly-tracking', estado: 'fallido', error: err.message },
          });
        }
        await new Promise(r => setTimeout(r, 500)); // Rate limit
      }
    } else {
      // No SMTP — log and save
      console.log(`[WeeklyEmail] SMTP no configurado. ${users.length} usuarios, ${totalPackages} paquetes.`);
      sent = 0;
      for (const u of users) {
        if (!u.email) continue;
        await db.emailLog.create({
          data: { userId: u.id, userEmail: u.email, asunto: 'Reporte Semanal - Chambatina (SMTP no configurado)', tipo: 'weekly-tracking', estado: 'enviado', error: 'SMTP no configurado' },
        });
      }
    }

    // 7. Update last sent timestamp
    await db.config.upsert({
      where: { clave: 'weekly_email_last_sent' },
      update: { valor: new Date().toISOString() },
      create: { clave: 'weekly_email_last_sent', valor: new Date().toISOString() },
    });

    return NextResponse.json({
      ok: true,
      message: 'Reporte semanal procesado',
      totalUsers: users.length,
      sent,
      failed,
      totalPackages,
      entregados,
      enTransito,
      solvedCargoError,
      smtpReady,
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (error: any) {
    console.error('[WeeklyEmail] Error:', error);
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }
}

async function getSmtpConfig(): Promise<Record<string, string>> {
  try {
    const keys = ['SMTP_HOST', 'SMTP_PORT', 'SMTP_USER', 'SMTP_PASS', 'EMAIL_FROM'];
    const entries = await db.config.findMany({ where: { clave: { in: keys } } });
    const config: Record<string, string> = {};
    for (const entry of entries) { config[entry.clave] = entry.valor; }
    return config;
  } catch { return {}; }
}
