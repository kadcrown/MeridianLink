import crypto from 'crypto';

const APP_SECRET = process.env.APP_SECRET || 'meridianlink_production_secure_master_key_random_seed_9876543210';
// Derive 32-byte encryption key
const ENCRYPTION_KEY = crypto.createHash('sha256').update(APP_SECRET).digest();

export interface EncryptedPayload {
  encryptedVal: string;
  iv: string;
  authTag: string;
  maskedSuffix: string;
}

/**
 * Encrypts a sensitive credential using AES-256-GCM.
 */
export function encryptSecret(plainText: string): EncryptedPayload {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', ENCRYPTION_KEY, iv);

  let encrypted = cipher.update(plainText, 'utf8', 'hex');
  encrypted += cipher.final('hex');

  const authTag = cipher.getAuthTag().toString('hex');
  const maskedSuffix = plainText.length > 4 ? '••••••••' + plainText.slice(-4) : '••••';

  return {
    encryptedVal: encrypted,
    iv: iv.toString('hex'),
    authTag,
    maskedSuffix,
  };
}

/**
 * Decrypts a sensitive credential using AES-256-GCM.
 */
export function decryptSecret(encryptedVal: string, ivHex: string, authTagHex: string): string {
  try {
    const decipher = crypto.createDecipheriv('aes-256-gcm', ENCRYPTION_KEY, Buffer.from(ivHex, 'hex'));
    decipher.setAuthTag(Buffer.from(authTagHex, 'hex'));

    let decrypted = decipher.update(encryptedVal, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  } catch (error) {
    throw new Error('Failed to decrypt stored credential.');
  }
}
