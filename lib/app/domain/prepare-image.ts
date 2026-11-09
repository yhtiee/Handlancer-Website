/**
 * Make a picked image one that every browser can show.
 *
 * iPhones shoot HEIC, which only Safari can display. Stored as is, the photo
 * downloads fine but renders as a broken image for everyone on Chrome. The
 * declared type can't be trusted to catch this: HEIC files reach us labelled
 * image/jpeg, or with no type at all, so the check reads the file's own bytes.
 *
 * Only HEIC pays for the converter, a 3 MB module loaded on first use.
 */

const HEIF_BRANDS = new Set(['heic', 'heix', 'heim', 'heis', 'hevc', 'hevx', 'hevm', 'hevs']);

/** True for HEIC/HEIF, judged from the start of the file (its `ftyp` box). */
export function isHeifBytes(bytes: Uint8Array): boolean {
  if (bytes.length < 12) return false;
  const ascii = (from: number) => String.fromCharCode(...bytes.subarray(from, from + 4));
  if (ascii(4) !== 'ftyp') return false;

  const boxSize = ((bytes[0] << 24) | (bytes[1] << 16) | (bytes[2] << 8) | bytes[3]) >>> 0;
  const end = Math.min(boxSize, bytes.length);
  const brands = [ascii(8)];
  for (let i = 16; i + 4 <= end; i += 4) brands.push(ascii(i));

  // AVIF shares the container and generic brands, but browsers display it.
  if (brands.includes('avif') || brands.includes('avis')) return false;
  return brands.some((b) => HEIF_BRANDS.has(b));
}

/**
 * The file to upload: HEIC becomes a JPEG, anything else comes back untouched.
 * Throws a message fit to show the person rather than uploading a photo nobody
 * could see.
 */
export async function prepareImage(file: File): Promise<File> {
  if (file.type.startsWith('video/')) return file;
  const head = new Uint8Array(await file.slice(0, 64).arrayBuffer());
  if (!isHeifBytes(head)) return file;
  try {
    const { heicTo } = await import('heic-to/next');
    const jpeg = await heicTo({ blob: file, type: 'image/jpeg', quality: 0.9 });
    return new File([jpeg], `${file.name.replace(/\.[^.]+$/, '')}.jpg`, { type: 'image/jpeg' });
  } catch {
    throw new Error('We could not process that photo. Check your connection, or choose a JPG or PNG.');
  }
}
