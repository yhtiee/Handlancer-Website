import { readFile } from 'node:fs/promises';
import { join } from 'node:path';

import { ImageResponse } from 'next/og';
import { notFound } from 'next/navigation';

import { formatMoney } from '@/lib/app/domain/money';
import { rateUnitLabel } from '@/lib/app/domain/rates';
import { mainServiceLabel } from '@/lib/app/domain/trades';
import { loadCardPhoto } from '@/lib/og-photo';
import { getPublicProvider } from '@/lib/public-provider';

/*
 * The card shown when an artisan's link is posted. Generated rather than using
 * their photo directly: raw phone photos are several MB, and WhatsApp shows no
 * preview at all for an image that large.
 */

export const alt = 'Hire this artisan on HandLancer';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

const NAVY = '#1e3a5f';
const TEAL = '#0fb5a4';
const MUTED = '#5b6772';
const PAPER = '#fbfcfd';
const PHOTO = 320;

/*
 * The site's typeface, plus a sliver of Noto Sans for what it lacks: ₦ and the
 * Yoruba and Igbo letters (ọ, ṣ, ẹ, ṅ…) that real names here use. Loaded from
 * disk once, because relying on the renderer to fetch missing glyphs left ₦ as
 * an empty box.
 */
const font = (file: string) => readFile(join(process.cwd(), 'assets/fonts', file));
const fonts = Promise.all([font('SplineSans-500.ttf'), font('SplineSans-700.ttf'), font('NotoSans-Extras-500.ttf'), font('NotoSans-Extras-700.ttf')]);

function clip(text: string, max: number) {
  return text.length > max ? `${text.slice(0, max - 1).trimEnd()}…` : text;
}

export default async function Image({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const provider = await getPublicProvider(id);
  if (!provider) notFound();

  const name = provider.name?.trim() || 'HandLancer artisan';
  const first = name.split(' ')[0];
  const initials = name.split(/\s+/).slice(0, 2).map((w) => w[0]).join('').toUpperCase();
  const trade = mainServiceLabel(provider.services);
  const [photo, [spline500, spline700, extras500, extras700]] = await Promise.all([loadCardPhoto(provider.avatar_url), fonts]);
  const facts = [
    provider.review_count > 0 && provider.rating != null ? `${Number(provider.rating).toFixed(1)} rating` : null,
    provider.location?.trim() ? clip(provider.location.trim(), 34) : null,
  ].filter(Boolean).join('  ·  ');
  const rate = provider.hourly_rate ? `From ${formatMoney(Number(provider.hourly_rate))} ${rateUnitLabel(provider.rate_unit)}` : null;

  return new ImageResponse(
    (
      <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', background: PAPER, fontFamily: 'Spline Sans', fontWeight: 500 }}>
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', padding: '0 64px', gap: 56 }}>
          <div style={{ width: PHOTO, height: PHOTO, display: 'flex', flexShrink: 0, borderRadius: 28, overflow: 'hidden', background: NAVY, alignItems: 'center', justifyContent: 'center' }}>
            {photo ? (
              // eslint-disable-next-line @next/next/no-img-element, jsx-a11y/alt-text -- Drawn into a PNG, not rendered as HTML.
              <img src={photo.src} width={PHOTO} height={PHOTO} style={{ width: PHOTO, height: PHOTO, objectFit: 'cover', transform: `rotate(${photo.rotate}deg)` }} />
            ) : (
              <div style={{ display: 'flex', color: '#ffffff', fontSize: 120, fontWeight: 700 }}>{initials}</div>
            )}
          </div>
          <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
            {trade && <div style={{ display: 'flex', color: '#0b8577', fontSize: 34, lineHeight: 1.2 }}>{clip(trade, 42)}</div>}
            <div style={{ display: 'flex', color: NAVY, fontSize: 78, fontWeight: 700, lineHeight: 1.08, marginTop: 10, letterSpacing: -2 }}>{clip(name, 36)}</div>
            {facts && <div style={{ display: 'flex', color: MUTED, fontSize: 32, marginTop: 20 }}>{facts}</div>}
            {rate && <div style={{ display: 'flex', color: NAVY, fontSize: 36, fontWeight: 700, marginTop: 14 }}>{rate}</div>}
          </div>
        </div>
        <div style={{ height: 112, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 64px', background: NAVY }}>
          <div style={{ display: 'flex', color: '#ffffff', fontSize: 40, fontWeight: 700 }}>{clip(`Hire ${first} on HandLancer`, 40)}</div>
          <div style={{ display: 'flex', color: TEAL, fontSize: 30 }}>Paid through escrow</div>
        </div>
      </div>
    ),
    {
      ...size,
      fonts: [
        { name: 'Spline Sans', data: spline500, weight: 500, style: 'normal' },
        { name: 'Spline Sans', data: spline700, weight: 700, style: 'normal' },
        { name: 'Noto Sans', data: extras500, weight: 500, style: 'normal' },
        { name: 'Noto Sans', data: extras700, weight: 700, style: 'normal' },
      ],
    },
  );
}
