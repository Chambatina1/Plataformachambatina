import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

function generateReferralCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

// GET /api/referrals?userId=X — Get referral info
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const codigo = searchParams.get('codigo');
    const admin = searchParams.get('admin') === 'true';

    if (codigo) {
      // Lookup by code (for new user registration with referral)
      const referrer = await db.user.findFirst({
        where: { referralCode: codigo },
        select: { id: true, nombre: true, referralCode: true },
      });
      if (!referrer) {
        return NextResponse.json({ ok: false, error: 'Codigo de referido no encontrado' });
      }
      return NextResponse.json({ ok: true, data: referrer });
    }

    if (!userId) {
      return NextResponse.json({ ok: false, error: 'userId requerido' }, { status: 400 });
    }

    const user = await db.user.findUnique({
      where: { id: parseInt(userId) },
      select: { id: true, referralCode: true },
    });

    // Generate code if missing
    if (user && !user.referralCode) {
      let code = generateReferralCode();
      let attempts = 0;
      while (attempts < 10) {
        const existing = await db.user.findFirst({ where: { referralCode: code } });
        if (!existing) break;
        code = generateReferralCode();
        attempts++;
      }
      await db.user.update({
        where: { id: parseInt(userId) },
        data: { referralCode: code },
      });
      user.referralCode = code;
    }

    // Count referrals
    const totalReferrals = await db.referral.count({
      where: { referrerId: parseInt(userId) },
    });

    return NextResponse.json({
      ok: true,
      data: {
        code: user?.referralCode,
        totalReferrals,
        recompensa: '5% descuento',
      },
    });
  } catch (error) {
    console.error('[Referrals] Error:', error);
    return NextResponse.json({ ok: false, error: 'Error interno' }, { status: 500 });
  }
}

// POST /api/referrals — Record a referral (called when new user signs up with referral code)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { referrerId, referredId, codigo } = body;

    if (!referredId || !referrerId) {
      return NextResponse.json({ ok: false, error: 'Datos incompletos' }, { status: 400 });
    }

    // Check not self-referral
    if (referrerId === referredId) {
      return NextResponse.json({ ok: false, error: 'No puedes referirte a ti mismo' }, { status: 400 });
    }

    // Check referral doesn't already exist
    const existing = await db.referral.findUnique({ where: { referredId } });
    if (existing) {
      return NextResponse.json({ ok: false, error: 'Este usuario ya fue referido' });
    }

    const referral = await db.referral.create({
      data: {
        referrerId,
        referredId,
        codigo: codigo || '',
      },
    });

    return NextResponse.json({ ok: true, data: referral }, { status: 201 });
  } catch (error) {
    console.error('[Referrals] Error creating:', error);
    return NextResponse.json({ ok: false, error: 'Error al registrar referido' }, { status: 500 });
  }
}
