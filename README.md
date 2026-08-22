# HandLancer — marketing site

Landing page for the HandLancer mobile app (Expo/React Native, at
`../../HandLancer/handlancer`). Next.js 16 App Router, Tailwind v4, no runtime UI
dependencies.

```bash
npm run dev     # http://localhost:3000
npm run build
```

## Before going live

1. **Set the domain.** `SITE_URL` in [`lib/site.ts`](lib/site.ts) is the single
   place it appears — metadata, canonical, sitemap, robots and every JSON-LD
   `@id` derive from it. It is currently `https://handlancer.ng`.
2. **Set the store links.** `SITE.appStoreUrl` / `SITE.playStoreUrl` in the same
   file are `#` placeholders.
3. Confirm `SITE.email`.

## Where things live

| Path | What |
| --- | --- |
| `lib/site.ts` | All copy-level content: categories, trades, cities, FAQ, and `buildJsonLd()`. Change content here, not in components. |
| `app/globals.css` | Design tokens ported from the app's `src/constants/theme.ts`, plus the reveal/marquee keyframes. |
| `app/layout.tsx` | Fonts, metadata, JSON-LD injection. |
| `components/` | One file per section; `page.tsx` just composes them. |
| `public/brand/` | Logo and provider photography copied from the app's `assets/images` and converted to WebP (58 MB of PNG → 1.6 MB). |

## Design direction — "editorial ledger"

Tokens are the mobile app's **light** theme from `src/constants/theme.ts` (the app
is `userInterfaceStyle: "automatic"`, so light is as native to the brand as dark):

- Ink `#10151B`, paper `#FBFCFD`, band `#F1F4F6`, rule `#E5E9EC`
- Brand navy `#1E3A5F` for headings, teal `#0FB5A4` for fills

Three typefaces, three jobs — **Inter is deliberately not used**, because it is the
default in nearly every AI design tool and reads as a non-choice:

| Face | Job |
| --- | --- |
| Spline Sans | headings, UI, buttons — the app's own `--font-display` |
| Newsreader | ledes and italic emphasis (carries what a gradient used to) |
| IBM Plex Mono | naira figures, section numbers, the escrow log |

### Contrast rules (important)

On the light canvas, **teal is 2.3:1 and `--ok` green is 3.0:1** — both are fills
and graphics only, never type. Use `--navy` (11.2:1) or `--ok-ink` (6.0:1) for
coloured text. `--muted` is 5.2:1 on the band, and the teal button uses `#06201D`
ink at 7.1:1.

### The hero stage

The page is paper, but the hero is a dark navy **stage** the two artisan cut-outs
stand on — it is also the only ground the glowing brand mark was ever drawn for.
Teal reaches 5.7:1 against `--stage`, so it carries type there (it cannot on
paper). The nav rides transparently over it and inverts to paper once scrolled;
`LogoMark` takes an `onDark` prop for the same reason.

Content is centred between the figures, and the widths are load-bearing:

| Viewport | Figure width | Column | Clearance each side |
| --- | --- | --- | --- |
| 1024px | 20vw (205px) | 28rem | 67px |
| 1280px | 22vw (282px) | 34rem | 38px |
| 1440px | 22vw (317px) | 34rem | 83px |

Below `lg` the figures sit in the bottom corners and the section carries `pb-[54vw]`
so centred content clears them. **If you widen the column or the figures, re-check
that table** — at 1280px there is only 38px of slack.

#### Where the cut-outs came from

`public/brand/artisan-m.webp` and `artisan-w.webp` are derived from the app's
`assets/images/welcome.png` / `welcome-2.png`. Those files *look* transparent but
are not: they carry a fully-opaque alpha channel with the checkerboard **painted
into the pixels** (corner pixel is `206,206,206,255`). They were keyed with an
edge-seeded flood fill — only background connected to the border is removed, so
the subject's interior can never be eaten — then feathered, trimmed, and the
woman was cropped to the man's 880×1116 framing so both render at equal height.

Next's optimiser serves these as WebP with alpha to any browser sending
`Accept: image/webp`. A client that does not gets JPEG and loses the
transparency; that is fine for the browsers Next 16 supports (Chrome 111+,
Safari 16.4+), but do not swap these for `<img>` without checking.

### Deliberately absent

Gradient text, backdrop blur, glow blobs, icon-in-rounded-tile cards, hover-lift
shadows, and a label pill above every headline. Structure comes from hairline
rules, alternating paper bands, whitespace, and mono section numbers (01–06).

## Domain accuracy

The escrow simulator in `components/escrow-simulator.tsx` models the app's real
lifecycle — `fund_escrow` → `release_materials` →
`request_completion_review` → `review_and_release` — and the balances it shows
are the arithmetic those RPCs actually perform. The 12 categories mirror
`src/constants/categories.ts`. If the app's domain changes, update `lib/site.ts`
to match.

## SEO

- **Origin.** `NEXT_PUBLIC_SITE_URL` (see `.env.example`) is the single source of
  truth, read once in `lib/site.ts`. It drives `metadataBase`, every canonical,
  `og:url`, the sitemap and `robots.txt`. No `VERCEL_URL` fallback — preview
  builds must never emit canonicals on a `*.vercel.app` origin.
- **Per-page metadata.** `lib/seo.ts` → `buildMetadata({ path, title, … })`.
  Every route must call it. Metadata merges *shallowly* in Next, so a nested
  `openGraph` from the layout is replaced wholesale by any page that redefines
  it — the builder always emits a complete block. The root layout deliberately
  sets **no** `alternates`, so no page can inherit the homepage's canonical.
- **Social images** come from the `app/opengraph-image.png` /
  `app/twitter-image.png` file conventions (alt text in the matching
  `.alt.txt`), which resolve against `metadataBase` and carry their own
  dimensions. Do not hand-write absolute image URLs — that bypasses
  `metadataBase`.
- **Crawl.** `app/robots.ts` (allow all but `/api/`), `app/sitemap.ts` generated
  from `lib/routes.ts`, `app/manifest.ts`. Never put a `#fragment` in the
  sitemap; engines strip it and you end up declaring one URL many times.
- **Structured data.** `lib/schema.ts` holds typed builders; `components/json-ld.tsx`
  renders them. Site-wide nodes (Organization, WebSite) are emitted in
  `app/layout.tsx`; page-level nodes (FAQPage, ItemList, Service,
  BreadcrumbList) are emitted by the page that shows that content. Nodes
  cross-reference by `@id`, and Google merges every `ld+json` block on a page,
  so a page-level node can point at the layout's Organization.
  > **Rule:** every schema node must describe something visible on the page that
  > emits it. `MobileApplication` was removed for claiming a shipped app with an
  > `Offer` while `SITE.launched` is still `false`.
- One `<h1>` per page, headings descend without skipping, alt text on every
  image. The provider marquee duplicates its items for the CSS loop; the copies
  are `aria-hidden` with an empty `alt`.
- FAQ answers are collapsed with CSS grid rows, never unmounted, so crawlers read
  the same text that backs the FAQPage schema.
- No keyword meta tag and no visible keyword lists. Cards carry a conversational
  `demand` sentence instead.

> `app/opengraph-image.tsx` avoids the ₦ glyph — Satori has no font fallback for
> U+20A6 and the build warns, then renders tofu. Use `NGN` in OG images.

> Never edit these files with PowerShell `Get-Content`/`Set-Content`. PS 5.1 reads
> UTF-8 as ANSI, which turns every ₦, — and “ ” into mojibake. Use an editor or
> the `-Encoding utf8` flag on **both** ends.

## Motion

No animation library. Scroll reveals use one `IntersectionObserver` per element
(`components/reveal.tsx`) that disconnects after firing; everything else is CSS
keyframes. `prefers-reduced-motion` is honoured globally in `globals.css`, and
the escrow count-up snaps instead of animating.
