import assert from 'node:assert/strict';
import { test } from 'node:test';

import { isDrawablePhoto, jpegRotation } from '@/lib/og-photo';

/** A minimal JPEG header with an EXIF block holding one orientation tag. */
function jpegWithOrientation(orientation: number, little = true): Uint8Array {
  const u16 = (n: number) => (little ? [n & 255, n >> 8] : [n >> 8, n & 255]);
  const u32 = (n: number) => (little ? [n, 0, 0, 0] : [0, 0, 0, n]);
  const tiff = [...(little ? [0x49, 0x49] : [0x4d, 0x4d]), ...u16(42), ...u32(8), ...u16(1), ...u16(0x0112), ...u16(3), ...u32(1), ...u16(orientation), 0, 0, ...u32(0)];
  const exif = [0x45, 0x78, 0x69, 0x66, 0, 0, ...tiff];
  const length = exif.length + 2;
  return Uint8Array.from([0xff, 0xd8, 0xff, 0xe1, length >> 8, length & 255, ...exif, 0xff, 0xda, 0, 2]);
}

test('turns phone photos upright, in either byte order', () => {
  for (const little of [true, false]) {
    assert.equal(jpegRotation(jpegWithOrientation(1, little)), 0);
    assert.equal(jpegRotation(jpegWithOrientation(3, little)), 180);
    assert.equal(jpegRotation(jpegWithOrientation(6, little)), 90);
    assert.equal(jpegRotation(jpegWithOrientation(8, little)), 270);
  }
});

test('a JPEG with no EXIF is left alone', () => {
  assert.equal(jpegRotation(Uint8Array.from([0xff, 0xd8, 0xff, 0xda, 0, 2])), 0);
});

test('malformed EXIF does not throw', () => {
  const cut = jpegWithOrientation(6).slice(0, 20);
  assert.equal(jpegRotation(cut), 0);
});

test('only formats the renderer can draw are accepted', () => {
  assert.equal(isDrawablePhoto(Uint8Array.from([0xff, 0xd8, 0xff, 0xe0])), true);
  assert.equal(isDrawablePhoto(Uint8Array.from([0x89, 0x50, 0x4e, 0x47])), true);
  const heic = Uint8Array.from([0, 0, 0, 36, 0x66, 0x74, 0x79, 0x70, 0x68, 0x65, 0x69, 0x63]);
  assert.equal(isDrawablePhoto(heic), false);
});
