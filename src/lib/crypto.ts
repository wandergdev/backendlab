// Ayudantes criptográficos con la Web Crypto API del navegador (reales, no simulados).

const enc = new TextEncoder();

export async function sha256Hex(text: string): Promise<string> {
  const buf = await crypto.subtle.digest('SHA-256', enc.encode(text));
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

export function b64url(bytes: Uint8Array | string): string {
  const arr = typeof bytes === 'string' ? enc.encode(bytes) : bytes;
  let bin = '';
  arr.forEach((b) => (bin += String.fromCharCode(b)));
  return btoa(bin).replace(/=+$/, '').replace(/\+/g, '-').replace(/\//g, '_');
}

export function b64urlDecode(s: string): string {
  const pad = s.replace(/-/g, '+').replace(/_/g, '/') + '==='.slice((s.length + 3) % 4);
  const bin = atob(pad);
  return new TextDecoder().decode(Uint8Array.from(bin, (c) => c.charCodeAt(0)));
}

export async function hmacSha256(secret: string, data: string): Promise<string> {
  const key = await crypto.subtle.importKey('raw', enc.encode(secret || ' '), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const sig = await crypto.subtle.sign('HMAC', key, enc.encode(data));
  return b64url(new Uint8Array(sig));
}

export async function signJwt(payload: object, secret: string): Promise<string> {
  const head = b64url(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const body = b64url(JSON.stringify(payload));
  return `${head}.${body}.${await hmacSha256(secret, `${head}.${body}`)}`;
}

export async function verifyJwt(token: string, secret: string): Promise<{ valid: boolean; payload?: unknown; error?: string }> {
  const parts = token.trim().split('.');
  if (parts.length !== 3) return { valid: false, error: 'format' };
  let payload: unknown;
  try {
    payload = JSON.parse(b64urlDecode(parts[1]));
  } catch {
    return { valid: false, error: 'payload' };
  }
  const expected = await hmacSha256(secret, `${parts[0]}.${parts[1]}`);
  return { valid: expected === parts[2], payload };
}

export function randomSalt(len = 8): string {
  const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789./';
  return Array.from(crypto.getRandomValues(new Uint8Array(len)), (b) => chars[b % chars.length]).join('');
}
