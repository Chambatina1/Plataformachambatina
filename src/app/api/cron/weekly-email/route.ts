import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { normalizarCPK } from '@/lib/chambatina';

// GET /api/cron/weekly-email
// Sends personalized weekly tracking emails ONLY to users who have tracked CPKs.
// Users with no tracked CPKs are skipped — no spam.
// Call manually: GET /api/cron/weekly-email?secret=CHAMBA_WEEKLY_2024
// Or set up a FREE external cron (cron-job.org, EasyCron) to hit this URL weekly.

export const dynamic = 'force-dynamic';
export const maxDuration = 60; // Allow up to 60s for sending many emails

export async function GET(req: Request) {
  const url = new URL(req.url);
  const manualSecret = url.searchParams.get('secret');
  const isManualCall = manualSecret === 'CHAMBA_WEEKLY_2024';

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

    // 2. Get tracked CPKs per user (from UserTrackingSearch)
    const allTrackingSearches = await db.userTrackingSearch.findMany({
      select: { userId: true, cpk: true },
    });

    // Build userId -> Set<cpk> map
    const userTrackedCPKs = new Map<number, Set<string>>();
    for (const ts of allTrackingSearches) {
      if (!userTrackedCPKs.has(ts.userId)) {
        userTrackedCPKs.set(ts.userId, new Set());
      }
      userTrackedCPKs.get(ts.userId)!.add(ts.cpk);
    }

    // Only process users who have tracked CPKs
    const userIdsWithTracking = [...userTrackedCPKs.keys()];
    if (userIdsWithTracking.length === 0) {
      return NextResponse.json({ ok: true, message: 'Ningun usuario tiene CPKs rastreando', sent: 0 });
    }

    const users = await db.user.findMany({
      where: { id: { in: userIdsWithTracking }, email: { not: null }, isActive: true },
      select: { id: true, nombre: true, email: true },
    });

    if (users.length === 0) {
      return NextResponse.json({ ok: true, message: 'No hay usuarios activos con CPKs rastreando', sent: 0 });
    }

    // 3. Get SolvedCargo data (once for all users)
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

    // Normalize CPKs in SolvedCargo results for matching
    const normalizedSC = solvedCargoResults.map(r => ({
      ...r,
      cpkNorm: normalizarCPK(r.cpk),
    }));

    // 4. Build email HTML template
    const today = new Date().toLocaleDateString('es-US', {
      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
    });
    const siteUrl = process.env.NEXT_PUBLIC_URL || 'https://plataformachambatina.onrender.com';

    // Email wrapper
    const emailWrapper = (body: string) => `
<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#f9fafb;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
<div style="max-width:600px;margin:0 auto;padding:20px;">
  <div style="background:linear-gradient(135deg,#f59e0b,#d97706);padding:30px;border-radius:16px 16px 0 0;text-align:center;">
    <h1 style="margin:0;color:white;font-size:24px;font-weight:800;">CHAMBATINA</h1>
    <p style="margin:8px 0 0;color:#fef3c7;font-size:14px;">Tu Reporte de Envios</p>
  </div>
  <div style="background:white;padding:30px;border-radius:0 0 16px 16px;box-shadow:0 4px 6px -1px rgba(0,0,0,0.1);">
    ${body}
    <div style="text-align:center;padding:20px;background:linear-gradient(135deg,#fffbeb,#fef3c7);border-radius:12px;margin-top:24px;">
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

    // Build personalized email for a user with their tracked CPKs
    const buildPersonalizedHtml = (nombre: string, userCPKs: string[]) => {
      const cpkNormSet = new Set(userCPKs.map(c => normalizarCPK(c)));

      // Filter SolvedCargo results for this user's CPKs
      const userPackages = normalizedSC.filter(r => cpkNormSet.has(r.cpkNorm));

      // Count estados
      const userEstadoCount: Record<string, number> = {};
      userPackages.forEach(r => {
        const estado = r.estado || 'EN AGENCIA';
        userEstadoCount[estado] = (userEstadoCount[estado] || 0) + 1;
      });

      const userTotal = userPackages.length;
      const userEntregados = userEstadoCount['ENTREGADO'] || 0;
      const userEnCamino = (userEstadoCount['EN TRANSITO'] || 0) + (userEstadoCount['TRASLADO PROVINCIA'] || 0);

      // Color for estado badge
      const estadoColor = (estado: string) => {
        const upper = estado.toUpperCase().trim();
        if (upper.includes('ENTREGADO')) return '#166534';
        if (upper.includes('TRANSITO') || upper.includes('TRASLADO') || upper.includes('TRANSPORTE')) return '#1e40af';
        if (upper.includes('ADUANA')) return '#7c2d12';
        return '#92400e';
      };

      const body = `
    <p style="margin:0 0 20px;color:#374151;font-size:15px;line-height:1.6;">
      Hola, <strong>${nombre}</strong>! Aqui tienes el resumen semanal de <strong>${userTotal} paquete(s)</strong> que estas rastreando.
    </p>
    <div style="background:#fffbeb;border:1px solid #fde68a;border-radius:12px;padding:16px;margin-bottom:24px;">
      <p style="margin:0 0 4px;font-size:12px;color:#92400e;font-weight:600;">FECHA DEL REPORTE</p>
      <p style="margin:0;font-size:16px;color:#78350f;font-weight:700;">${today}</p>
    </div>
    ${solvedCargoError ? `
      <div style="background:#fef2f2;border:1px solid #fecaca;border-radius:12px;padding:16px;margin-bottom:24px;">
        <p style="margin:0;color:#991b1b;font-size:14px;"><strong>Aviso:</strong> No se pudieron obtener datos frescos de SolvedCargo (${solvedCargoError}). Mostrando datos locales.</p>
      </div>
    ` : ''}
    ${userTotal > 0 ? `
      <div style="display:flex;gap:12px;margin-bottom:24px;">
        <div style="flex:1;background:#f0fdf4;border-radius:12px;padding:16px;text-align:center;">
          <p style="margin:0;font-size:28px;font-weight:800;color:#166534;">${userTotal}</p>
          <p style="margin:4px 0 0;font-size:12px;color:#166534;font-weight:500;">Mis Paquetes</p>
        </div>
        <div style="flex:1;background:#f0fdf4;border-radius:12px;padding:16px;text-align:center;">
          <p style="margin:0;font-size:28px;font-weight:800;color:#166534;">${userEntregados}</p>
          <p style="margin:4px 0 0;font-size:12px;color:#166534;font-weight:500;">Entregados</p>
        </div>
        <div style="flex:1;background:#eff6ff;border-radius:12px;padding:16px;text-align:center;">
          <p style="margin:0;font-size:28px;font-weight:800;color:#1e40af;">${userEnCamino}</p>
          <p style="margin:4px 0 0;font-size:12px;color:#1e40af;font-weight:500;">En Camino</p>
        </div>
      </div>
      <h3 style="margin:0 0 12px;font-size:16px;color:#18181b;font-weight:700;">Detalle de tus Envios</h3>
      ${userPackages.map(pkg => `
        <div style="border:1px solid #f3f4f6;border-radius:12px;padding:14px;margin-bottom:10px;background:#fafafa;">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;">
            <span style="font-weight:700;color:#18181b;font-size:14px;">${pkg.cpk}</span>
            <span style="background:${estadoColor(pkg.estado)};color:white;padding:3px 10px;border-radius:6px;font-size:11px;font-weight:600;">${pkg.estado}</span>
          </div>
          ${pkg.consignatario ? `<p style="margin:0 0 4px;font-size:13px;color:#374151;">Destinatario: <strong>${pkg.consignatario}</strong></p>` : ''}
          ${pkg.descripcion ? `<p style="margin:0 0 4px;font-size:12px;color:#6b7280;">${pkg.descripcion}</p>` : ''}
          ${pkg.fecha ? `<p style="margin:0;font-size:11px;color:#9ca3af;">Fecha: ${pkg.fecha}</p>` : ''}
        </div>
      `).join('')}
    ` : `
      <div style="text-align:center;padding:24px;background:#f9fafb;border-radius:12px;margin-bottom:24px;">
        <p style="margin:0 0 8px;color:#6b7280;font-size:14px;">No encontramos movimientos en los CPKs que rastreas.</p>
        <p style="margin:0;font-size:12px;color:#9ca3af;">Usa el rastreador para buscar tus paquetes y te notificaremos automaticamente.</p>
      </div>
    `}`;

      return emailWrapper(body);
    };

    // 5. Email sending — try Resend first, then SMTP
    let sent = 0;
    let failed = 0;
    const errors: string[] = [];
    const emailFrom = process.env.EMAIL_FROM || 'Chambatina <geochambatina@gmail.com>';

    // Check for Resend API key
    let resendApiKey = process.env.RESEND_API_KEY || '';
    try {
      const cfg = await db.config.findUnique({ where: { clave: 'RESEND_API_KEY' } });
      if (cfg?.valor) resendApiKey = cfg.valor;
    } catch {}

    // Check for SMTP config
    const smtpConfig = await getSmtpConfig();
    const host = smtpConfig.SMTP_HOST || process.env.SMTP_HOST || '';
    const port = parseInt(smtpConfig.SMTP_PORT || process.env.SMTP_PORT || '587', 10);
    const smtpUser = smtpConfig.SMTP_USER || process.env.SMTP_USER || '';
    const smtpPass = smtpConfig.SMTP_PASS || process.env.SMTP_PASS || '';
    const smtpReady = !!(host && smtpUser && smtpPass);

    if (resendApiKey) {
      // Send via Resend
      const { Resend } = await import('resend');
      const resend = new Resend(resendApiKey);

      let displayName = 'Chambatina';
      if (emailFrom) {
        const match = emailFrom.match(/^(.+?)\s*<.*>$/);
        if (match) {
          displayName = match[1].replace(/["']/g, '');
        } else if (emailFrom.includes('@')) {
          displayName = emailFrom.split('@')[0];
        }
      }
      const resendFrom = `${displayName} <onboarding@resend.dev>`;
      console.log(`[WeeklyEmail] Resend FROM: ${resendFrom} (original: ${emailFrom})`);

      for (const u of users) {
        if (!u.email) continue;
        const trackedCPKs = userTrackedCPKs.get(u.id);
        if (!trackedCPKs || trackedCPKs.size === 0) continue;

        const subject = `Tu Reporte de Envios - Chambatina (${today})`;
        const html = buildPersonalizedHtml(u.nombre || 'Cliente', [...trackedCPKs]);

        try {
          const { error } = await resend.emails.send({
            from: resendFrom,
            to: u.email,
            subject,
            html,
          });
          if (error) throw new Error(error.message);
          sent++;
          await db.emailLog.create({
            data: { userId: u.id, userEmail: u.email, asunto: subject, tipo: 'weekly-personalized', estado: 'enviado' },
          });
        } catch (err: any) {
          failed++;
          errors.push(`${u.email}: ${err.message}`);
          await db.emailLog.create({
            data: { userId: u.id, userEmail: u.email, asunto: subject, tipo: 'weekly-personalized', estado: 'fallido', error: err.message },
          });
        }
        await new Promise(r => setTimeout(r, 500));
      }
    } else if (smtpReady) {
      // Send via Nodemailer SMTP
      const nodemailer = (await import('nodemailer')).default;
      const transporter = nodemailer.createTransport({
        host, port, secure: port === 465, auth: { user: smtpUser, pass: smtpPass },
      });

      for (const u of users) {
        if (!u.email) continue;
        const trackedCPKs = userTrackedCPKs.get(u.id);
        if (!trackedCPKs || trackedCPKs.size === 0) continue;

        const subject = `Tu Reporte de Envios - Chambatina (${today})`;
        const html = buildPersonalizedHtml(u.nombre || 'Cliente', [...trackedCPKs]);

        try {
          await transporter.sendMail({
            from: emailFrom,
            to: u.email,
            subject,
            html,
          });
          sent++;
          await db.emailLog.create({
            data: { userId: u.id, userEmail: u.email, asunto: subject, tipo: 'weekly-personalized', estado: 'enviado' },
          });
        } catch (err: any) {
          failed++;
          errors.push(`${u.email}: ${err.message}`);
          await db.emailLog.create({
            data: { userId: u.id, userEmail: u.email, asunto: subject, tipo: 'weekly-personalized', estado: 'fallido', error: err.message },
          });
        }
        await new Promise(r => setTimeout(r, 500));
      }
    } else {
      console.log(`[WeeklyEmail] No email provider configured. ${users.length} usuarios con CPKs.`);
    }

    // 6. Update last sent timestamp
    await db.config.upsert({
      where: { clave: 'weekly_email_last_sent' },
      update: { valor: new Date().toISOString() },
      create: { clave: 'weekly_email_last_sent', valor: new Date().toISOString() },
    });

    return NextResponse.json({
      ok: true,
      message: 'Reporte semanal procesado',
      totalUsers: users.length,
      usersWithTracking: userTrackedCPKs.size,
      sent,
      failed,
      skipped: userIdsWithTracking.length - users.length,
      solvedCargoError,
      emailProvider: resendApiKey ? 'resend' : smtpReady ? 'smtp' : 'none',
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
