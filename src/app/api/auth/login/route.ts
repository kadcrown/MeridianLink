import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { prisma } from '@/lib/db';
import { setOwnerSessionCookie, ensureOwnerExists } from '@/lib/auth/session';
import { logger } from '@/lib/logger';

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

// Simple in-memory rate limiting for login attempts to mitigate brute-force
const loginAttempts = new Map<string, { count: number; resetTime: number }>();

export async function POST(request: NextRequest) {
  try {
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || '127.0.0.1';
    const now = Date.now();
    const attempt = loginAttempts.get(ip);

    if (attempt && attempt.resetTime > now && attempt.count >= 10) {
      return NextResponse.json(
        { error: 'Too many failed attempts. Please try again in 5 minutes.' },
        { status: 429 }
      );
    }

    const body = await request.json();
    const parseResult = loginSchema.safeParse(body);

    if (!parseResult.success) {
      return NextResponse.json({ error: 'Invalid email or password format' }, { status: 400 });
    }

    const { email, password } = parseResult.data;

    // Ensure owner exists if freshly deployed
    await ensureOwnerExists();

    const owner = await prisma.owner.findUnique({
      where: { email: email.toLowerCase().trim() },
    });

    if (!owner) {
      // Record failed attempt
      const currentCount = (attempt && attempt.resetTime > now ? attempt.count : 0) + 1;
      loginAttempts.set(ip, { count: currentCount, resetTime: now + 5 * 60 * 1000 });

      return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 });
    }

    const isValid = await bcrypt.compare(password, owner.passwordHash);
    if (!isValid) {
      const currentCount = (attempt && attempt.resetTime > now ? attempt.count : 0) + 1;
      loginAttempts.set(ip, { count: currentCount, resetTime: now + 5 * 60 * 1000 });

      return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 });
    }

    // Reset attempt counter on success
    loginAttempts.delete(ip);

    // Set HTTP-only cryptographic session cookie
    await setOwnerSessionCookie({ id: owner.id, email: owner.email });

    logger.info('Owner logged in successfully', { email: owner.email });

    return NextResponse.json({
      success: true,
      owner: {
        id: owner.id,
        email: owner.email,
        displayName: owner.name,
      },
    });
  } catch (error) {
    logger.error('Login error', error);
    return NextResponse.json({ error: 'An unexpected error occurred during login' }, { status: 500 });
  }
}
