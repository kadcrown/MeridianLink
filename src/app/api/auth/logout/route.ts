import { NextResponse } from 'next/server';
import { clearOwnerSessionCookie } from '@/lib/auth/session';

export async function POST() {
  await clearOwnerSessionCookie();
  return NextResponse.json({ success: true });
}
