import assert from 'node:assert/strict';
import { test } from 'node:test';

import { isHeifBytes } from '@/lib/app/domain/prepare-image';

/** An ISO-BMFF `ftyp` box: size, 'ftyp', major brand, minor version, compatible brands. */
function ftyp(major: string, ...compatible: string[]): Uint8Array {
  const text = (s: string) => Array.from(s, (c) => c.charCodeAt(0));
  const size = 16 + compatible.length * 4;
  return Uint8Array.from([0, 0, 0, size, ...text('ftyp'), ...text(major), 0, 0, 0, 0, ...compatible.flatMap(text)]);
}

test('recognises an iPhone HEIC, whatever it was labelled as', () => {
  assert.equal(isHeifBytes(ftyp('heic', 'mif1', 'MiPr', 'miaf', 'MiHB', 'heic')), true);
});

test('recognises HEIC declared under the generic mif1 brand', () => {
  assert.equal(isHeifBytes(ftyp('mif1', 'heic')), true);
});

test('leaves AVIF alone, which shares the container but displays fine', () => {
  assert.equal(isHeifBytes(ftyp('avif', 'mif1', 'miaf')), false);
  assert.equal(isHeifBytes(ftyp('mif1', 'avif', 'miaf')), false);
});

test('leaves MP4 video alone', () => {
  assert.equal(isHeifBytes(ftyp('isom', 'iso2', 'mp41')), false);
});

test('leaves JPEG and PNG alone', () => {
  assert.equal(isHeifBytes(Uint8Array.from([0xff, 0xd8, 0xff, 0xe0, 0, 16, 74, 70, 73, 70, 0, 1])), false);
  assert.equal(isHeifBytes(Uint8Array.from([0x89, 80, 78, 71, 13, 10, 26, 10, 0, 0, 0, 13])), false);
});

test('does not read past a file too short to judge', () => {
  assert.equal(isHeifBytes(new Uint8Array(4)), false);
});
