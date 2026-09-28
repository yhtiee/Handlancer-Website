import Image from 'next/image';

/**
 * The real HandLancer mark — public/brand/logo.png (the file the Organization
 * schema points at), trimmed of its padding into logo-mark.webp so it can sit
 * at nav size. Not the simplified <LogoMark> SVG redraw.
 */
const RATIO = 161 / 128;

export function BrandLogo({ height = 28, priority = false }: { height?: number; priority?: boolean }) {
  return (
    <Image
      src="/brand/logo-mark.webp"
      alt=""
      width={Math.round(height * RATIO)}
      height={height}
      priority={priority}
      className="shrink-0"
    />
  );
}
