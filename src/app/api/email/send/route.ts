import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { z } from 'zod';

// ─── Validación ────────────────────────────────────────────────────────
const emailSchema = z.object({
  to: z.string().email('Email destinatario inválido'),
  subject: z.string().min(1, 'El asunto es requerido'),
  html: z.string().min(1, 'El contenido HTML es requerido'),
  tipo: z.string().optional().default('general'),
});

// ─── Obtener API key de Resend ────────────────────────────────────────
async function getResendApiKey(): Promise<string | null> {
  // Priority: env var > config table
  if (process.env.RESEND_API_KEY) return process.env.RESEND_API_KEY;
  try {
    const entry = await db.config.findUnique({ where: { clave: 'RESEND_API_KEY' } });
    if (entry?.valor) return entry.valor;
  } catch {}
  return null;
}

// ─── Enviar con Resend ───────────────────────────────────────────────
async function sendWithResend(to: string, subject: string, html: string, fromEmail: string) {
  const apiKey = await getResendApiKey();
  if (!apiKey) return null;

  const { Resend } = await import('resend');
  const resend = new Resend(apiKey);

  // ALWAYS use Resend's onboarding domain for the FROM address.
  // Resend requires domain verification for any custom domain (gmail.com, etc.),
  // so we rewrite to onboarding@resend.dev which is pre-verified.
  // We preserve the configured display name.
  let displayName = 'Chambatina';
  if (fromEmail) {
    const match = fromEmail.match(/^(.+?)\s*<.*>$/);
    if (match) {
      displayName = match[1].replace(/["']/g, '');
    } else if (fromEmail.includes('@')) {
      displayName = fromEmail.split('@')[0];
    }
  }
  const resendFrom = `${displayName} <onboarding@resend.dev>`;

  console.log(`[Email] Resend FROM: ${resendFrom} (original: ${fromEmail})`);

  const { data, error } = await resend.emails.send({
    from: resendFrom,
    to,
    subject,
    html,
  });

  if (error) throw new Error(error.message);
  return data?.id;
}

// ─── Enviar con Nodemailer (Gmail SMTP fallback) ──────────────────────
async function sendWithNodemailer(to: string, subject: string, html: string, fromEmail: string) {
  const nodemailer = (await import('nodemailer')).default;

  let host = process.env.SMTP_HOST || '';
  let port = parseInt(process.env.SMTP_PORT || '587', 10);
  let user = process.env.SMTP_USER || '';
  let pass = process.env.SMTP_PASS || '';

  // Also check Config table
  try {
    const keys = ['SMTP_HOST', 'SMTP_PORT', 'SMTP_USER', 'SMTP_PASS'];
    const entries = await db.config.findMany({ where: { clave: { in: keys } } });
    for (const entry of entries) {
      if (entry.valor) {
        if (entry.clave === 'SMTP_HOST') host = entry.valor;
        if (entry.clave === 'SMTP_PORT') port = parseInt(entry.valor, 10);
        if (entry.clave === 'SMTP_USER') user = entry.valor;
        if (entry.clave === 'SMTP_PASS') pass = entry.valor;
      }
    }
  } catch {}

  if (!host || !user || !pass) return null;

  const transporter = nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass },
  });

  const info = await transporter.sendMail({ from: fromEmail, to, subject, html });
  return info.messageId;
}

// ─── POST /api/email/send ──────────────────────────────────────────────
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validated = emailSchema.safeParse(body);

    if (!validated.success) {
      return NextResponse.json(
        { ok: false, error: validated.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { to, subject, html, tipo } = validated.data;

    // Get "from" email
    let emailFrom = process.env.EMAIL_FROM || '';
    try {
      const cfg = await db.config.findUnique({ where: { clave: 'EMAIL_FROM' } });
      if (cfg?.valor) emailFrom = cfg.valor;
    } catch {}

    let messageId: string | undefined;
    let estado = 'enviado' as const;
    let errorMsg: string | null = null;
    let warning: string | null = null;

    // Try Resend first, then Nodemailer fallback
    try {
      // Try Resend
      const resendId = await sendWithResend(to, subject, html, emailFrom);
      if (resendId) {
        messageId = resendId;
        console.log(`[Email] Enviado via Resend a ${to} (${tipo}) - ${resendId}`);
      } else {
        // Try Nodemailer
        const smtpId = await sendWithNodemailer(to, subject, html, emailFrom);
        if (smtpId) {
          messageId = smtpId;
          console.log(`[Email] Enviado via SMTP a ${to} (${tipo}) - ${smtpId}`);
        } else {
          // No email provider configured
          console.log('[Email] No hay proveedor de email configurado');
          estado = 'enviado';
          warning = 'No hay proveedor de email configurado. Correo registrado pero no enviado.';
        }
      }
    } catch (sendErr) {
      const msg = sendErr instanceof Error ? sendErr.message : 'Error desconocido';
      console.error(`[Email] Error al enviar correo a ${to}:`, msg);
      estado = 'fallido';
      errorMsg = msg;
      return NextResponse.json(
        { ok: false, error: `Error al enviar correo: ${msg}` },
        { status: 500 }
      );
    }

    // Guardar log en EmailLog
    try {
      await db.emailLog.create({
        data: {
          userEmail: to,
          asunto: subject,
          tipo,
          estado,
          error: errorMsg,
        },
      });
    } catch (logErr) {
      console.error('[Email] Error al guardar log del correo:', logErr);
    }

    const response: Record<string, unknown> = {
      ok: true,
      data: { estado, tipo, to },
    };

    if (messageId) response.data.messageId = messageId;
    if (warning) response.warning = warning;

    return NextResponse.json(response);
  } catch (error) {
    console.error('[Email] Error general:', error);
    return NextResponse.json(
      { ok: false, error: 'Error al procesar el envío de correo' },
      { status: 500 }
    );
  }
}
