/**
 * Web counterpart of mobile src/lib/file-bytes.ts.
 *
 * On the web a picked file is a `File`; components turn it into an object URL
 * (`URL.createObjectURL`) so the ported services can keep passing `uri` strings
 * exactly as they do on mobile. Reading a blob: URL back is a plain fetch — the
 * React Native empty-buffer trap the mobile version guards against does not
 * exist in browsers, but the size floor stays as a sanity check.
 */
const MIN_UPLOAD_BYTES = 256;

export async function readFileBytes(uri: string): Promise<Uint8Array> {
  const res = await fetch(uri);
  const bytes = new Uint8Array(await res.arrayBuffer());
  if (bytes.byteLength < MIN_UPLOAD_BYTES) {
    throw new Error('That file could not be read. Please pick it again.');
  }
  return bytes;
}

/** File extension from a MIME type, for storage paths (blob: URLs carry none). */
export function extensionForMime(mimeType: string | null | undefined, fallback = 'jpg'): string {
  const sub = mimeType?.split('/')[1]?.split(';')[0]?.toLowerCase();
  if (!sub) return fallback;
  if (sub === 'jpeg') return 'jpg';
  if (sub === 'quicktime') return 'mov';
  return /^[a-z0-9]{2,5}$/.test(sub) ? sub : fallback;
}
