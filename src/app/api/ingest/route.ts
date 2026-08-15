import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { parseAmazonUrl } from '@/lib/amazon/parser';
import { getOwnerSession } from '@/lib/auth/session';
import { logger } from '@/lib/logger';

const ingestSchema = z.object({
  url: z.string().min(1),
});

export async function POST(request: NextRequest) {
  try {
    const session = await getOwnerSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const parsed = ingestSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid URL input' }, { status: 400 });
    }

    const result = await parseAmazonUrl(parsed.data.url);

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to parse Amazon URL';
    logger.warn('Amazon URL ingestion failed', { error: message });
    return NextResponse.json({ error: message }, { status: 422 });
  }
}
