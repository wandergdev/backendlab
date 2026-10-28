import { portable, type PortableProgress } from '../store/progress';

// Empaqueta el progreso en un texto corto (JSON → comprimido → base64url) para enlaces, QR o archivos.
const PREFIX = 'bl1.';

const toB64url = (bytes: Uint8Array) => {
  let bin = '';
  bytes.forEach((b) => (bin += String.fromCharCode(b)));
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
};
const fromB64url = (s: string) => {
  const bin = atob(s.replace(/-/g, '+').replace(/_/g, '/') + '==='.slice((s.length + 3) % 4));
  return Uint8Array.from(bin, (c) => c.charCodeAt(0));
};

async function pipe(bytes: Uint8Array, stream: CompressionStream | DecompressionStream): Promise<Uint8Array> {
  const out = new Blob([bytes as BlobPart]).stream().pipeThrough(stream);
  return new Uint8Array(await new Response(out).arrayBuffer());
}

export async function encodeProgress(p: PortableProgress = portable()): Promise<string> {
  const json = new TextEncoder().encode(JSON.stringify(p));
  return PREFIX + toB64url(await pipe(json, new CompressionStream('deflate-raw')));
}

export async function decodeProgress(code: string): Promise<PortableProgress> {
  const clean = code.trim().replace(/^.*[?&]d=/, '').replace(/&.*$/, '');
  if (!clean.startsWith(PREFIX)) throw new Error('format');
  const bytes = await pipe(fromB64url(clean.slice(PREFIX.length)), new DecompressionStream('deflate-raw'));
  const data = JSON.parse(new TextDecoder().decode(bytes)) as PortableProgress;
  if (data.version !== 1 || typeof data.xp !== 'number' || typeof data.cards !== 'object') throw new Error('format');
  return data;
}

export function syncLink(code: string): string {
  const base = location.href.split('#')[0];
  return `${base}#/sync?d=${code}`;
}

export function summarize(p: PortableProgress) {
  return {
    xp: p.xp,
    lessons: Object.values(p.lessons).filter((l) => l.done).length,
    cards: Object.keys(p.cards).length,
    tasks: Object.keys(p.tasks).length,
    streak: p.streak.count,
  };
}
