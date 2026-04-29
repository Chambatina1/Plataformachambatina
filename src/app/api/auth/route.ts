import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { z } from 'zod';

// POST /api/auth/login — Login with email (no password required)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, nombre, telefono } = body;

    if (!email || typeof email !== 'string') {
      return NextResponse.json(
        { ok: false, error: 'Email es requerido' },
        { status: 400 }
      );
    }

    const cleanEmail = email.toLowerCase().trim();

    // Try to find existing user
    let user = await db.user.findUnique({ where: { email: cleanEmail } });

    if (user) {
      // Check if user is active
      if (user.isActive === false) {
        return NextResponse.json(
          { ok: false, error: 'Tu cuenta ha sido desactivada. Contacta al administrador.' },
          { status: 403 }
        );
      }

      // Update last seen (updatedAt) and optional fields
      user = await db.user.update({
        where: { id: user.id },
        data: {
          updatedAt: new Date(),
          ...(nombre ? { nombre } : {}),
          ...(telefono ? { telefono } : {}),
        },
      });
    } else {
      // Auto-register new user with minimal data
      user = await db.user.create({
        data: {
          nombre: nombre || cleanEmail.split('@')[0] || 'Usuario',
          email: cleanEmail,
          telefono: telefono || null,
        },
      });
    }

    // Return user data (without password)
    const { password: _pw, ...userSafe } = user;

    return NextResponse.json({ ok: true, data: userSafe });
  } catch (error) {
    console.error('[Auth] Error in login:', error);
    return NextResponse.json(
      { ok: false, error: 'Error interno' },
      { status: 500 }
    );
  }
}
