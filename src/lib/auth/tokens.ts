import crypto from 'crypto';
import { prisma } from '../db';
import { logger } from '../logger';

export type ApiTokenScope =
  | 'links:read'
  | 'links:write'
  | 'groups:read'
  | 'groups:write'
  | 'programs:read'
  | 'reports:read'
  | 'health:read'
  | 'youtube:scan'
  | 'youtube:write';

export const ALL_API_SCOPES: ApiTokenScope[] = [
  'links:read',
  'links:write',
  'groups:read',
  'groups:write',
  'programs:read',
  'reports:read',
  'health:read',
  'youtube:scan',
  'youtube:write',
];

/**
 * Computes a SHA-256 hash of a raw API token string.
 */
export function hashApiToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}

/**
 * Creates a new Personal Access Token for the owner.
 * Returns the raw token string (ONLY DISPLAYED ONCE).
 */
export async function createApiToken(
  ownerId: string,
  name: string,
  scopes: ApiTokenScope[],
  expiresInDays?: number,
  ipAllowlist?: string
) {
  const randomBytes = crypto.randomBytes(24).toString('hex');
  const rawToken = `mlk_live_${randomBytes}`;
  const tokenPrefix = `mlk_live_${randomBytes.slice(0, 4)}...`;
  const tokenHash = hashApiToken(rawToken);

  let expiresAt: Date | undefined = undefined;
  if (expiresInDays && expiresInDays > 0) {
    expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + expiresInDays);
  }

  const created = await prisma.apiToken.create({
    data: {
      ownerId,
      name,
      tokenHash,
      tokenPrefix,
      scopes: scopes.join(','),
      ipAllowlist: ipAllowlist || null,
      expiresAt: expiresAt || null,
    },
  });

  logger.info('Created new Personal Access Token', { id: created.id, name: created.name });

  return {
    id: created.id,
    name: created.name,
    token: rawToken, // Returned ONLY once
    tokenPrefix,
    scopes,
    expiresAt: created.expiresAt,
    createdAt: created.createdAt,
  };
}

/**
 * Verifies an incoming Bearer API token against required scopes.
 */
export async function verifyApiToken(tokenString: string, requiredScope?: ApiTokenScope) {
  if (!tokenString.startsWith('mlk_live_')) {
    return null;
  }

  const tokenHash = hashApiToken(tokenString);
  const tokenRecord = await prisma.apiToken.findUnique({
    where: { tokenHash },
    include: { owner: true },
  });

  if (!tokenRecord || tokenRecord.isRevoked) {
    return null;
  }

  if (tokenRecord.expiresAt && tokenRecord.expiresAt < new Date()) {
    return null;
  }

  const tokenScopes = tokenRecord.scopes.split(',').map((s) => s.trim());
  if (requiredScope && !tokenScopes.includes(requiredScope) && !tokenScopes.includes('*')) {
    return null;
  }

  // Update lastUsedAt asynchronously
  prisma.apiToken.update({
    where: { id: tokenRecord.id },
    data: { lastUsedAt: new Date() },
  }).catch(() => {});

  return {
    tokenId: tokenRecord.id,
    tokenName: tokenRecord.name,
    ownerId: tokenRecord.ownerId,
    scopes: tokenScopes,
  };
}
