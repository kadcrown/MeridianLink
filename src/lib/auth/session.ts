import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import { cookies } from 'next/headers';
import { prisma } from '../db';
import { env } from '../env';

const SESSION_COOKIE_NAME = 'meridian_session';
const SESSION_DURATION_HOURS = 24 * 7; // 7 days

export interface SessionData {
  ownerId: string;
  email: string;
  expiresAt: number;
}

/**
 * Creates a signed cryptographic token for the owner session.
 */
export function createSessionToken(data: SessionData): string {
  const payload = JSON.stringify(data);
  const base64Payload = Buffer.from(payload).toString('base64url');
  const signature = crypto
    .createHmac('sha256', env.APP_SECRET)
    .update(base64Payload)
    .digest('base64url');
  return `${base64Payload}.${signature}`;
}

/**
 * Verifies and decodes a session token.
 */
export function verifySessionToken(token: string): SessionData | null {
  try {
    const [base64Payload, signature] = token.split('.');
    if (!base64Payload || !signature) return null;

    const expectedSignature = crypto
      .createHmac('sha256', env.APP_SECRET)
      .update(base64Payload)
      .digest('base64url');

    // Constant-time signature comparison to prevent timing attacks
    if (!crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature))) {
      return null;
    }

    const payloadString = Buffer.from(base64Payload, 'base64url').toString('utf-8');
    const data: SessionData = JSON.parse(payloadString);

    if (Date.now() > data.expiresAt) {
      return null;
    }

    return data;
  } catch {
    return null;
  }
}

/**
 * Sets the owner session cookie.
 */
export async function setOwnerSessionCookie(owner: { id: string; email: string }) {
  const expiresAt = Date.now() + SESSION_DURATION_HOURS * 60 * 60 * 1000;
  const token = createSessionToken({
    ownerId: owner.id,
    email: owner.email,
    expiresAt,
  });

  const cookieStore = cookies();
  cookieStore.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: SESSION_DURATION_HOURS * 60 * 60,
  });
}

/**
 * Clears the owner session cookie.
 */
export async function clearOwnerSessionCookie() {
  const cookieStore = cookies();
  cookieStore.delete(SESSION_COOKIE_NAME);
}

/**
 * Gets the current active owner session or null.
 */
export async function getOwnerSession(): Promise<{ id: string; email: string; name: string } | null> {
  const cookieStore = cookies();
  const sessionCookie = cookieStore.get(SESSION_COOKIE_NAME);

  if (!sessionCookie?.value) {
    return null;
  }

  const session = verifySessionToken(sessionCookie.value);
  if (!session) {
    return null;
  }

  const owner = await prisma.owner.findUnique({
    where: { id: session.ownerId },
    select: { id: true, email: true, name: true },
  });

  return owner;
}

/**
 * Ensures the owner exists in the database on startup.
 */
export async function ensureOwnerExists(): Promise<void> {
  const existingOwner = await prisma.owner.findFirst();
  if (!existingOwner) {
    const passwordHash = await bcrypt.hash(env.OWNER_INITIAL_PASSWORD, 12);
    await prisma.owner.create({
      data: {
        email: env.OWNER_EMAIL,
        passwordHash,
        name: 'Site Owner',
      },
    });
  }
}
