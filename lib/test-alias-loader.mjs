/**
 * Resolves the "@/..." tsconfig path alias for `node --experimental-strip-types`
 * test runs, which do not read tsconfig.json. Used by `npm test`.
 */
import { fileURLToPath, pathToFileURL } from 'node:url';
import path from 'node:path';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = pathToFileURL(path.join(HERE, '..') + path.sep).href;

export function resolve(specifier, context, next) {
  if (specifier.startsWith('@/')) {
    return next(new URL(`${specifier.slice(2)}.ts`, ROOT).href, context);
  }
  return next(specifier, context);
}
