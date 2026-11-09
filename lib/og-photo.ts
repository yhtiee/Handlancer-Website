/**
 * Getting a profile photo onto a generated share card. The renderer draws only
 * JPEG and PNG (older uploads are HEIC, and it can't read WebP) and ignores the
 * rotation phones record in EXIF, so a portrait would land on its side.
 */

const MAX_PHOTO_BYTES = 8 * 1024 * 1024;

export function isDrawablePhoto(b: Uint8Array): boolean {
  const jpeg = b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff;
  const png = b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47;
  return jpeg || png;
}

/** Clockwise degrees to turn a JPEG upright, from its EXIF orientation. Mirrored values are left alone. */
export function jpegRotation(b: Uint8Array): 0 | 90 | 180 | 270 {
  if (b[0] !== 0xff || b[1] !== 0xd8) return 0;
  const view = new DataView(b.buffer, b.byteOffset, b.byteLength);
  try {
    let i = 2;
    while (i + 4 < b.length && b[i] === 0xff) {
      const marker = b[i + 1];
      if (marker === 0xda) return 0; // Image data: no EXIF ahead of it.
      const length = view.getUint16(i + 2);
      const isExif = marker === 0xe1 && String.fromCharCode(...b.subarray(i + 4, i + 8)) === 'Exif';
      if (isExif) {
        const tiff = i + 10;
        const little = b[tiff] === 0x49;
        const ifd = tiff + view.getUint32(tiff + 4, little);
        const entries = view.getUint16(ifd, little);
        for (let n = 0; n < entries; n++) {
          const entry = ifd + 2 + n * 12;
          if (view.getUint16(entry, little) !== 0x0112) continue;
          const orientation = view.getUint16(entry + 8, little);
          return orientation === 3 ? 180 : orientation === 6 ? 90 : orientation === 8 ? 270 : 0;
        }
        return 0;
      }
      i += 2 + length;
    }
  } catch {
    // Malformed metadata: draw the photo as stored.
  }
  return 0;
}

/** Ready to draw, or null if the card should use initials instead. A bad photo must never break the card. */
export async function loadCardPhoto(url: string | null): Promise<{ src: string; rotate: number } | null> {
  if (!url) return null;
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(4000) });
    if (!res.ok) return null;
    const bytes = new Uint8Array(await res.arrayBuffer());
    if (bytes.length > MAX_PHOTO_BYTES || !isDrawablePhoto(bytes)) return null;
    const type = bytes[0] === 0xff ? 'image/jpeg' : 'image/png';
    return { src: `data:${type};base64,${Buffer.from(bytes).toString('base64')}`, rotate: jpegRotation(bytes) };
  } catch {
    return null;
  }
}
