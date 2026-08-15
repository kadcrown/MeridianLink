export interface EdgeSessionData {
  ownerId: string;
  email: string;
  expiresAt: number;
}

/**
 * Fast Edge-compatible session verification using Web Crypto API.
 */
export async function verifySessionTokenEdge(token: string, secret: string): Promise<EdgeSessionData | null> {
  try {
    const parts = token.split('.');
    if (parts.length !== 2) return null;

    const [base64Payload, signature] = parts;
    if (!base64Payload || !signature) return null;

    // Decode payload
    const decodedPayload = atob(base64Payload.replace(/-/g, '+').replace(/_/g, '/'));
    const data: EdgeSessionData = JSON.parse(decodedPayload);

    if (Date.now() > data.expiresAt) {
      return null;
    }

    const encoder = new TextEncoder();
    const key = await crypto.subtle.importKey(
      'raw',
      encoder.encode(secret),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    );

    const signatureBuffer = await crypto.subtle.sign('HMAC', key, encoder.encode(base64Payload));
    const base64Computed = btoa(String.fromCharCode(...new Uint8Array(signatureBuffer)))
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');

    if (base64Computed !== signature) {
      return null;
    }

    return data;
  } catch {
    return null;
  }
}
