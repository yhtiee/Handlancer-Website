# HandLancer — Design System

Reference document for the existing landing page, produced before any SEO/IA work
so that new pages can be built from the same parts. **Every value here was read
out of the code**, with file and line references. Nothing is inferred.

Stack: Next.js 16.3.1 (App Router) · React 19.2.8 · Tailwind CSS v4 · TypeScript
strict. **Zero runtime UI dependencies** — no component library, no icon package,
no animation library. `package.json` dependencies are exactly `next`, `react`,
`react-dom`.

---

## 1. Colour

### Where it is defined

There is **no `tailwind.config.js`**. Tailwind v4 is wired up through PostCSS
(`postcss.config.mjs` → `@tailwindcss/postcss`) and everything lives in
[`app/globals.css`](app/globals.css):

- **`:root` block, lines 16–50** — plain CSS custom properties. This is the real
  source of truth.
- **`@theme inline` block, lines 52–64** — maps a subset of those onto Tailwind
  theme keys.

### The tokens (`app/globals.css:16-50`)

Ported verbatim from the mobile app's **light** theme (`src/constants/theme.ts`).

| Token | Value | Role |
| --- | --- | --- |
| `--ink` | `#10151b` | Body text, marker numerals |
| `--paper` | `#fbfcfd` | Page background, card fill |
| `--band` | `#f1f4f6` | Alternating section band, card hover |
| `--band-deep` | `#e4e9ec` | Split-bar track, slider track |
| `--muted` | `#5b6772` | Secondary text, ledes, mono labels |
| `--rule` | `#e5e9ec` | Default hairline |
| `--rule-strong` | `#c9d2d8` | Emphasised panel border, ghost button, input border |
| `--teal` | `#0fb5a4` | Primary button fill, active tab underline, `.ulink` underline |
| `--navy` | `#1e3a5f` | **All headings**, icons, figures, emphasis |
| `--ok` | `#16a34a` | Released-state fill in the split bar |
| `--ok-ink` | `#0e6b33` | The legible green, for type only |
| `--warn` | `#c77700` | **Defined, never used** |
| `--bad` | `#e5484d` | Form validation errors |
| `--teal-wash` | `#e7f7f5` | Current-step row background in the simulator |
| `--navy-wash` | `#eaeff5` | **Defined, never used** |
| `--stage-top` / `--stage-bot` | `#ffffff` / `#e7ecf0` | Hero gradient stops |
| `--grid-line` | `rgba(16, 21, 27, 0.055)` | Hero drafting grid, resting |
| `--grid-line-hot` | `rgba(30, 58, 95, 0.26)` | Hero grid under the pointer |
| `--grid-cell` | `72px` | Grid pitch (mirrored as `CELL = 72` in `components/hero.tsx:32`) |
| `--s1` … `--s6` | `4 / 8 / 16 / 24 / 32 / 64px` | 4pt scale — **defined, never referenced** |

`color-scheme: light` is pinned on `:root` (line 49).

### Exact names used in class strings

Components **do not** use the Tailwind colour utilities. They use arbitrary-value
syntax against the CSS variables:

```tsx
text-[var(--muted)]   bg-[var(--paper)]   border-[var(--rule)]
text-[var(--navy)]    bg-[var(--band)]    border-[var(--rule-strong)]
text-[var(--ink)]     text-[var(--ok-ink)]  text-[var(--bad)]
```

Dynamic colour (active/current state) is set through inline `style` rather than
conditional classes, because the value comes from a variable:

```tsx
style={{ color: isOpen ? 'var(--navy)' : 'var(--ink)' }}
style={{ background: current ? 'var(--teal-wash)' : undefined }}
style={{ borderBottom: `2px solid ${active ? 'var(--teal)' : 'transparent'}` }}
```

**Grep confirms `text-navy`, `bg-band`, `border-rule`, `font-mono` etc. appear
zero times in the repo** — the entire `@theme inline` block is currently dead
code. New pages should follow the majority convention (`var(--…)` in arbitrary
values), not resurrect the theme keys, unless we decide to migrate all of it.

### Contrast rules (documented in README, enforced in code)

On paper, `--teal` is **2.3:1** and `--ok` is **3.0:1** — both are fills and
graphics only, never type. Coloured type uses `--navy` (11.2:1) or `--ok-ink`
(6.0:1). `--muted` is 5.2:1 on `--band`. `.btn-primary` uses `#06201d` ink on
teal for 7.1:1. `components/services.tsx:41` carries an inline comment
reiterating this for the category icons.

### Colours hard-coded outside the token set

These exist and are intentional, but are worth knowing before adding new surfaces:

| Value | Where |
| --- | --- |
| `#06201d` | `.btn-primary` text; skip-link text (`globals.css:186`, `nav.tsx:41`) |
| `#0da294` | `.btn-primary:hover` (`globals.css:187`) |
| `#f4f7f9` | Mid stop of the `.stage` gradient (`globals.css:210`) |
| `#0f1720`, `#cbd6e0`, `#7c8b99`, `#4ade9b`, `#4dd3c4`, `#f2f5f7` | The `.log` console block (`globals.css:281-294`) |
| `rgba(255,255,255,.72)` | Hero ticker rail (`hero.tsx:145`) |
| `rgba(15,181,164,.11)` / `.4` | `.stage-cell` fill and border (`globals.css:244-245`) |
| `#FBFCFD` | `viewport.themeColor` (`layout.tsx:37`) |
| `#0E1116` | Manifest `background_color` / `theme_color` (`manifest.ts:11-12`) — see §12 |

---

## 2. Typography

### Families — `app/layout.tsx:15-34`

Three faces loaded via `next/font/google`. Inter is deliberately excluded (the
comment at `layout.tsx:6-14` explains why).

| Face | CSS variable | Weights / styles | Job |
| --- | --- | --- | --- |
| **Spline Sans** | `--font-spline` | `400, 500, 600, 700` | Headings, UI, buttons, body |
| **Newsreader** | `--font-newsreader` | `normal` + `italic` (variable weight, no weight array) | Ledes, italic emphasis |
| **IBM Plex Mono** | `--font-plex-mono` | `400, 500, 600` | Every naira figure, section number, mono label, the escrow log |

All three use `display: 'swap'`. The variables are attached to `<html>`:
`className={`${spline.variable} ${newsreader.variable} ${plexMono.variable} h-full antialiased`}`
(`layout.tsx:116`).

Mono is applied in components with the **`font-[family-name:var(--font-plex-mono)]`**
utility — that exact string, 14 occurrences. Never `font-mono`.

### Base rules — `app/globals.css:76-116`

```css
body   { font: 17px/1.6 Spline Sans; color: var(--ink); background: var(--paper); }
h1–h4  { font-family: Spline Sans; font-weight: 700; color: var(--navy);
         letter-spacing: -0.03em; line-height: 1.05; }
em, h1 em, h2 em, h3 em, .lede em
       { font-family: Newsreader; font-style: italic; font-weight: 400;
         letter-spacing: -0.01em; color: var(--navy); }
.lede  { font-family: Newsreader; font-size: clamp(1.12rem, 1.9vw, 1.34rem);
         line-height: 1.55; color: var(--muted); font-weight: 380; }
```

Note `h1–h4` set `color: var(--navy)` globally — headings never need a colour class.

### The heading scale as actually used

| Level | Size class | Where |
| --- | --- | --- |
| `h1` | `text-[clamp(2.4rem,5.4vw,3.85rem)]` | Hero only (`hero.tsx:114`) |
| `h2` (section) | `text-[clamp(2rem,4.4vw,3.05rem)]` | All seven numbered sections |
| `h2` (closing CTA) | `text-[clamp(2.2rem,5.4vw,3.6rem)]` | `cta.tsx:12` |
| `h2` (footer column) | `text-[11px] font-medium uppercase tracking-[0.13em]` + mono + `--muted` | `cta.tsx:93` |
| `h3` | `text-[22px]` | Waitlist success panel |
| `h3` | `text-[21px]` | Escrow simulator step detail |
| `h3` | `text-[19px]` | How-it-works step title |
| `h3` | `text-[17px]` | Service card title |
| `h3` | `text-[16.5px]` | Escrow guarantee rows |
| `dt` (heading-weight, not a heading tag) | `text-[18px] font-bold leading-snug tracking-[-0.02em] text-[var(--navy)]` | Trust pillars (`trust.tsx:59`) |
| FAQ question (a `<span>` in a button) | `text-[17px] font-semibold leading-snug tracking-[-0.02em]` | `faq.tsx:49` |

Heading width is controlled by a **character measure**, not a pixel width:
`max-w-[14ch]`, `[16ch]`, `[17ch]`, `[18ch]`, `[19ch]`, `[20ch]`. Ledes use
`max-w-[42ch]` / `[44ch]` / `[46ch]`; body copy `max-w-[34ch]` … `[64ch]`.

### The display-heading + italic-emphasis pattern

This is the signature move. **There is no component and no class on the `<em>`** —
it is a bare `<em>` inside the heading, styled entirely by `globals.css:95-101`.

Exact markup, from `components/escrow-simulator.tsx:151-153`:

```tsx
<h2 className="max-w-[19ch] text-[clamp(2rem,4.4vw,3.05rem)]">
  Nobody pays first. Nobody works <em>for free</em>.
</h2>
```

Every instance in the repo:

| File:line | Markup |
| --- | --- |
| `hero.tsx:114` | `Hire an artisan. Hold the money <em>until the work is done</em>.` (h1) |
| `escrow-simulator.tsx:151` | `Nobody pays first. Nobody works <em>for free</em>.` |
| `services.tsx:18` | `Twelve trades, <em>one</em> job post` |
| `how-it-works.tsx:76` | `One app, <em>two</em> doors` |
| `trust.tsx:38` | `Everyone has heard both <em>horror stories</em>` |
| `earnings.tsx:76` | `The work was never the hard part. <em>Getting paid</em> was.` |
| `faq.tsx:25` | `Asked before <em>every</em> first job` |
| `waitlist.tsx:96` | `We are not live yet. <em>Get in first.</em>` |
| `cta.tsx:12` | `Your next repair deserves a receipt, not <em>a leap of faith</em>` |

The emphasis is sometimes a single word (`one`, `two`, `every`) and sometimes a
trailing phrase. It is never the whole heading and never at the very start.

---

## 3. The section-header (marker) pattern

Also **not a component** — repeated markup, always wrapped in `<Reveal>`.

```tsx
<Reveal>
  <p className="marker">
    <b>02</b> <span>What you can hire for</span>
  </p>
</Reveal>
```

`.marker` — `app/globals.css:143-156`:

```css
.marker {
  display: flex; align-items: baseline; gap: 12px;
  padding-top: 14px; border-top: 1.5px solid var(--ink);
  font-family: var(--font-plex-mono), ui-monospace, monospace;
  font-size: 12px; font-weight: 500;
  letter-spacing: 0.12em; text-transform: uppercase;
  color: var(--muted);
}
.marker b { color: var(--ink); font-weight: 600; }
```

Numbers currently allocated on the landing page:

| # | Label | Section id | File |
| --- | --- | --- | --- |
| 01 | The escrow engine | `#escrow` | `escrow-simulator.tsx:145` |
| 02 | What you can hire for | `#services` | `services.tsx:12` |
| 03 | How it works | `#how` | `how-it-works.tsx:70` |
| 04 | Trust & safety | `#trust` | `trust.tsx:32` |
| 05 | For artisans | `#earn` | `earnings.tsx:70` |
| 06 | Questions | `#faq` | `faq.tsx:19` |
| 07 | Waitlist | `#waitlist` | `waitlist.tsx:89` |
| — | *(none)* | `#download` | `cta.tsx` — the closing CTA has **no** marker |

### The head block that follows it

The dominant form (escrow, services, trust — `mt-9` off the marker):

```tsx
<div className="mt-9 grid gap-10 lg:grid-cols-[1.05fr_.95fr] lg:gap-16">
  <Reveal>
    <h2 className="max-w-[19ch] text-[clamp(2rem,4.4vw,3.05rem)]">…<em>…</em>…</h2>
  </Reveal>
  <Reveal delay={80}>
    <p className="lede max-w-[42ch] lg:pt-2">…</p>
  </Reveal>
</div>
```

Documented variants:

| Section | Head-block container |
| --- | --- |
| Escrow / Services / Trust | `mt-9 grid gap-10 lg:grid-cols-[1.05fr_.95fr] lg:gap-16` |
| How it works | `mt-9 flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between` (right side is the role tablist, not a lede) |
| Earnings | `mt-9 grid gap-12 lg:grid-cols-[1fr_1fr] lg:gap-16` — lede lives *inside* the left `<Reveal>`, `mt-6` under the h2 |
| Waitlist | `mt-9 grid gap-12 lg:grid-cols-[1fr_1.05fr] lg:gap-16` — same, lede inside left column |
| FAQ | `mt-9 grid gap-10 lg:grid-cols-[.85fr_1.15fr] lg:gap-16` — h2 is `lg:sticky lg:top-24` |

**For new pages: use the escrow/services/trust form.** It is the most common and
the most neutral.

---

## 4. Spacing, rhythm and layout

### Container

```css
.shell {                       /* app/globals.css:122-128 */
  width: 100%;
  max-width: 1180px;
  margin-inline: auto;
  padding-inline: 22px;
}
@media (min-width: 900px) { .shell { padding-inline: 40px; } }
```

Gutters: **22px** below 900px, **40px** at and above. Max content width **1180px**.
Note the 900px breakpoint is bespoke and does not match any Tailwind breakpoint.

### Vertical rhythm

| Element | Value |
| --- | --- |
| Numbered section | `py-20 md:py-28` (80px → 112px) |
| Closing CTA | `py-24 md:py-32` (96px → 128px) |
| Footer | `py-14` (56px) |
| Hero | `pt-28 pb-[54vw] sm:pb-[40vw] lg:pt-32 lg:pb-28`, `min-h-[90svh] lg:min-h-[86vh]` |
| Marker → head block | `mt-9` (36px) |
| Head block → main content | `mt-12` (48px), or `mt-14` (56px) for `<dl>`-style lists |
| Section anchor offset | `scroll-mt-20` on every section; `scroll-padding-top: 88px` on `html` |
| Sticky-column offset | `lg:top-24` (96px) |

Sections are separated by `rule-b` (a 1px bottom hairline) and alternate paper /
`band` backgrounds. The alternation on the landing page runs:

```
Hero (stage) → Escrow (band) → Services (paper) → How (band) →
Trust (paper) → Earnings (band) → FAQ (paper) → Waitlist (band) →
CTA (paper) → Footer (band)
```

The `--s1…--s6` 4pt scale is declared in `:root` but **never referenced**. Real
spacing comes from Tailwind's default `0.25rem` scale plus arbitrary px/vw values.

---

## 5. Borders, radii, shadows, cards

### Shadows

**There are none.** Zero occurrences of `shadow-` in the repo. `globals.css:165`
says it explicitly: *"Flat bordered cell. No lift, no glow, no shadow."* README
lists "hover-lift shadows" under **Deliberately absent**. Do not introduce any.

### Radii

| Radius | Where |
| --- | --- |
| `6px` | `.btn` (`globals.css:179`) |
| `8px` | `.log` console block |
| `rounded-sm` | Marquee image tiles, how-it-works image, the escrow split bar |
| `rounded-md` | Form inputs and the `<select>` in the waitlist |
| `rounded` | Mobile menu button, skip link |
| `rounded-full` | Range-slider thumb + track, waitlist success badge |

Panels and cards are **square** — the escrow panel, the earnings worksheet, the
waitlist card and the service cards all have no radius at all.

### Borders

| Weight / colour | Use |
| --- | --- |
| `1px solid var(--rule)` | Default hairline — section dividers, list dividers, image frames |
| `1px solid var(--rule-strong)` | Emphasised panels (escrow, worksheet, waitlist card), `.btn-ghost`, form inputs, the how-it-works step list |
| `1.5px solid var(--ink)` | `.marker` top rule only |
| `2px solid var(--teal)` | Active tab underline (how-it-works, waitlist role switch) |

Helpers: `.rule` (`border-top`) and `.rule-b` (`border-bottom`), `globals.css:134-135`.

### Card treatments

There are exactly **two** card idioms, plus one unused utility.

1. **Grid-lines-are-real** (`services.tsx:31-62`) — the only true "card grid".
   The gap *is* the border:

   ```tsx
   <div className="mt-12 grid gap-px border border-[var(--rule)] sm:grid-cols-2 lg:grid-cols-3"
        style={{ background: 'var(--rule)' }}>
     <article className="group h-full bg-[var(--paper)] p-6 transition-colors duration-200 hover:bg-[var(--band)]">
   ```

2. **Bordered panel** — `border border-[var(--rule-strong)] bg-[var(--paper)]`,
   internally divided by `border-t border-[var(--rule)]` bands with `px-5/6 py-5/6/7`.
   Used by the escrow simulator, the earnings worksheet and the waitlist form.

3. **`.cell`** (`globals.css:166-171`) — declared with a hover border transition,
   but **never applied to any element**. Dead code.

### Divided lists

The recurring non-card list treatment:

```tsx
<ul className="divide-y divide-[var(--rule)] border-y border-[var(--rule)]">
```

Used in earnings bullets, waitlist bullets, the FAQ `<dl>`, the trust `<dl>`, and
(with `--rule-strong`) the how-it-works `<ol>`.

---

## 6. Buttons and links

Defined in `app/globals.css:174-203`. There are **two** button variants, not three.

```css
.btn {
  display: inline-flex; align-items: center; justify-content: center; gap: 9px;
  padding: 13px 22px; border-radius: 6px;
  font-size: 15px; font-weight: 600; cursor: pointer;
  transition: background-color 180ms ease, border-color 180ms ease, color 180ms ease;
}
.btn-primary       { background: var(--teal); color: #06201d; }
.btn-primary:hover { background: #0da294; }
.btn-ghost         { border: 1px solid var(--rule-strong); color: var(--ink); background: transparent; }
.btn-ghost:hover   { border-color: var(--ink); background: var(--band); }
```

| Variant | Class | Notes |
| --- | --- | --- |
| Primary | `btn btn-primary` | Always the waitlist CTA |
| Ghost / secondary | `btn btn-ghost` | The "See how escrow works" / role CTA slot |
| **No `.btn-secondary` exists.** | | |
| Text link | `ulink` | Navy 600 text with a teal underline that grows `2px → 6px` on hover (`globals.css:192-203`) |
| Quiet text button | `underline underline-offset-4 text-[var(--muted)] hover:text-[var(--ink)]` | The simulator's "Reset" (`escrow-simulator.tsx:282`) |
| Nav link | `text-[14.5px] font-medium text-[var(--muted)] transition-colors duration-200 hover:text-[var(--ink)]` | `nav.tsx:63` |

**Conventions:**

- A button that advances the user carries a trailing icon:
  `<IconArrowRight className="h-4 w-4" />`.
- Size overrides use `!` important utilities rather than new variants:
  nav → `!py-2.5 !text-[14.5px]`; mobile menu → `!py-4 !text-base`.
- Full-width forms: `w-full`; hero/CTA pairs: `w-full sm:w-auto`.
- Focus is global: `:focus-visible { outline: 2px solid var(--navy); outline-offset: 2px; }`
  (`globals.css:113-116`). Never override it.

---

## 7. Animation and motion

**No animation library.** No Framer Motion, no GSAP — `package.json` has three
dependencies and none of them animate anything. All motion is CSS keyframes plus
two hand-written `requestAnimationFrame` loops.

### Scroll reveal — the standard entrance

[`components/reveal.tsx`](components/reveal.tsx) — a `'use client'` wrapper:

```tsx
<Reveal delay={80} as="li" className="shell">…</Reveal>
```

- One `IntersectionObserver` per element, `{ rootMargin: '0px 0px -12% 0px', threshold: 0.08 }`.
- Sets `data-reveal="in"` then **disconnects** — reveals once, never re-animates.
- Falls back to visible if `IntersectionObserver` is undefined.
- Props: `children`, `delay` (ms, default 0), `as` (default `'div'`), `className`.
- `delay` is written as the `--reveal-delay` inline custom property.

CSS (`globals.css:300-307`):

```css
[data-reveal]      { opacity: 0; transform: translateY(14px);
                     transition: opacity 620ms cubic-bezier(0.2, 0.7, 0.3, 1),
                                 transform 620ms cubic-bezier(0.2, 0.7, 0.3, 1);
                     transition-delay: var(--reveal-delay, 0ms); }
[data-reveal="in"] { opacity: 1; transform: none; }
```

`app/layout.tsx:122-124` ships a `<noscript>` style that forces everything visible
when JS is off.

**Stagger conventions:**

| Pattern | Delay |
| --- | --- |
| Lede beside a heading | `delay={80}` |
| Large panel below a head block | `delay={100}` or `delay={120}` |
| 3-column card grid | `delay={(i % 3) * 60}` |
| Step / row list | `delay={i * 70}` |
| Long list (capped) | `delay={Math.min(i, 3) * 60}` |

### The marquee (providers strip)

`components/services.tsx:95-127` + `globals.css:309-318`.

```css
@keyframes hl-marquee { from { transform: translate3d(0,0,0); }
                        to   { transform: translate3d(-50%,0,0); } }
.marquee-track { display: flex; width: max-content;
                 animation: hl-marquee var(--marquee-duration, 78s) linear infinite; }
.marquee:hover .marquee-track { animation-play-state: paused; }
```

- The track renders `[...TRADES, ...TRADES]` — **the set is duplicated** to make
  the `-50%` loop seamless. Keys are `` `${t.slug}-${i}` ``.
- Edge fade is an inline mask on the wrapper, both prefixed and unprefixed:
  `linear-gradient(90deg, transparent, #000 6%, #000 94%, transparent)`.
- Items: `w-[196px] shrink-0 sm:w-[224px]`, `gap-3` on the track.
- Duration is a variable (`--marquee-duration`, default 78s) but is never
  overridden anywhere.

### Other motion

| Thing | Detail |
| --- | --- |
| Hero pointer grid | `pointermove` → rAF-coalesced writes of `--mx/--my/--cx/--cy`; `--hot` gates opacity. Disabled unless `(pointer: fine)` (`hero.tsx:37-77`) |
| Naira count-up | Hand-rolled rAF, `520ms`, ease-out cubic `1 - (1-p)³`; snaps instantly under reduced motion (`escrow-simulator.tsx:85-115`) |
| FAQ accordion | `grid-template-rows: 0fr → 1fr`, `duration-300 ease-out`. **Content is never unmounted** — deliberate, so crawlers read the same text that backs the FAQ schema |
| Caret blink | `@keyframes hl-caret`, `1.1s steps(1) infinite` |
| Split bar | `transition-all duration-500` |

### Standard durations and easings

| Duration | Easing | Use |
| --- | --- | --- |
| `130ms` | `cubic-bezier(0.2, 0.7, 0.3, 1)` | Stage cell snap |
| `150ms` | `ease` | Simulator step rows, form input borders |
| `180ms` | `ease` | Buttons, `.cell` |
| `200ms` | `ease` | Nav links, tabs, card hover, `.ulink` |
| `300ms` | `ease-out` | FAQ rows, nav border, FAQ plus/minus |
| `420ms` | `ease` | Hero hot-grid fade |
| `500ms` | — | Split bar |
| `620ms` | `cubic-bezier(0.2, 0.7, 0.3, 1)` | **Scroll reveal — the house easing** |

### Reduced motion

Honoured globally (`globals.css:323-332`): `scroll-behavior: auto`, all
animations and transitions clamped to `0.001ms`, reveals forced visible, marquee
animation removed. New motion must survive this block.

---

## 8. Images

All images are local, under `public/brand/`. `next.config.ts` is empty — no
`images` config, no remote patterns.

### The `/brand/` convention

```
public/brand/logo.png  logo.webp  logo-glow.webp  icon.webp
public/brand/artisan-m.webp  artisan-w.webp          ← hero cut-outs, 880×1116
public/brand/working-man.webp  working-woman.webp    ← how-it-works, 640×640
public/brand/providers/{slug}.webp                   ← 16 files, one per TRADES entry
```

`TRADES[].slug` in `lib/site.ts:129-146` **is** the provider filename. Adding a
trade means adding `public/brand/providers/<slug>.webp`.

### `next/image` usage

| Surface | width×height | loading | `sizes` | classes |
| --- | --- | --- | --- | --- |
| Hero figures | `880×1116` | `priority={i === 0}` | `(max-width: 640px) 36vw, (max-width: 1024px) 28vw, (max-width: 1280px) 20vw, 340px` | `h-auto w-full` |
| Provider marquee | `224×272` | `lazy` | `(max-width: 640px) 196px, 224px` | `h-[248px] w-full object-cover sm:h-[272px]` |
| How-it-works | `640×640` | `lazy` | `(max-width: 1024px) 100vw, 400px` | `h-auto w-full object-cover` |

Aspect ratios are carried by the intrinsic `width`/`height` props; the marquee is
the only place that crops (`object-cover` into a fixed height).

Image frames: `overflow-hidden rounded-sm border border-[var(--rule)]`, with the
caption below on a `border-t border-[var(--rule)] pt-2` rule.

The logo is **inline SVG** (`LogoMark` in `components/icons.tsx:137-165`) so the
nav makes no image request.

### Alt text convention

Descriptive and brand/country-loaded rather than bare labels:

- `"Verified HandLancer artisan in work uniform, arms folded"`
- `` `${t.label} available for hire on HandLancer in Nigeria` ``
- `"Nigerian artisan ready to take on a job booked through HandLancer"`

⚠️ The marquee's duplicated half currently carries the **same non-empty alt** as
the first half — see §13.

---

## 9. Responsive breakpoints

Tailwind v4 defaults, all four in use:

| Prefix | Min-width | Primary job |
| --- | --- | --- |
| `sm` | 640px | 1 → 2 column card grids; hero button row goes horizontal; balance strip splits into 3 |
| `md` | 768px | Section padding `py-20 → py-28`; nav FAQ + CTA appear; footer becomes 4-column |
| `lg` | 1024px | The main layout break — two-column head blocks, sticky columns, desktop nav, mobile menu disappears |
| `xl` | 1280px | Hero figure sizing only (`xl:left-12`, `xl:max-w-[34rem]`, `xl:w-[clamp(240px,22vw,340px)]`) |

Non-Tailwind media queries in `globals.css`:

- `@media (min-width: 900px)` — `.shell` gutter 22px → 40px
- `@media (pointer: coarse)` — hides `.stage-grid-hot` and `.stage-cell`
- `@media (prefers-reduced-motion: reduce)` — the global motion kill switch

### How sections reflow

| Section | < lg | ≥ lg |
| --- | --- | --- |
| Hero | Figures pinned bottom-left/right, section carries `pb-[54vw]` (`sm:pb-[40vw]`) so centred type clears them; column `max-w-[34rem]` | Column narrows to `max-w-[28rem]` (`xl:34rem`) and sits *between* the figures; `lg:pb-28` |
| Head blocks | Single column, `gap-10`/`gap-12` | `lg:grid-cols-[1.05fr_.95fr] lg:gap-16` |
| Service cards | 1 col → `sm:grid-cols-2` | `lg:grid-cols-3` |
| Escrow panel | Balances stack (`divide-y`), steps above detail | `sm:grid-cols-3 sm:divide-x`; `lg:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)]` steps beside detail |
| How-it-works | Steps then image | `lg:grid-cols-[1.15fr_.85fr]`; image `lg:sticky lg:top-24`; even steps get `lg:pl-10` |
| Trust `<dl>` | `dt` above `dd` | `md:grid-cols-[minmax(0,15rem)_minmax(0,1fr)] md:gap-10` |
| FAQ | Heading then list | `lg:grid-cols-[.85fr_1.15fr]`, heading `lg:sticky lg:top-24` |
| Nav | Hamburger → full-screen `fixed inset-0 pt-[70px]` menu | `lg:flex` link row, hamburger `lg:hidden` |
| Footer | Stacked | `md:grid-cols-[1.5fr_1fr_1fr_1fr]` |

⚠️ `README.md:63-74` documents a hero clearance table with only **38px of slack at
1280px**. Do not widen the hero column or the figures without re-checking it.

---

## 10. Dark mode

**It does not exist.** Confirmed by grep:

- No `dark:` variant anywhere in `app/` or `components/`.
- No `prefers-color-scheme` media query anywhere.
- No `.dark` class, no `data-theme` attribute, no theme provider, no toggle.
- `:root` pins `color-scheme: light` (`globals.css:49`).
- `viewport.themeColor` is `'#FBFCFD'` — the paper colour.

The design is deliberately single-mode light ("a paper canvas is what keeps this
from reading like every other dark, teal-glow SaaS page" — `globals.css:7-9`).

The one dark surface on the page is the `.log` console block inside the escrow
simulator, which is hard-coded dark by design.

---

## 11. Component inventory

Twelve files. **Only two are genuinely reusable** — everything else is a one-off
landing-page section.

### Reusable primitives

| Component | File | Client? | Description | Used by |
| --- | --- | --- | --- | --- |
| `Reveal` | `components/reveal.tsx` | ✅ | Scroll-reveal wrapper. Props `children`, `delay`, `as`, `className`. | Every section |
| `LogoMark` | `components/icons.tsx:137` | server | Inline-SVG brand mark. Prop: `className` only. | `Nav`, `Footer` |
| Icon set | `components/icons.tsx` | server | 12 category icons + 15 UI icons, all through one `Svg` wrapper: `viewBox 0 0 24 24`, `fill="none"`, `stroke="currentColor"`, `strokeWidth={1.7}`, round caps/joins, `aria-hidden`. Sized at the call site (`h-4 w-4`, `h-[18px] w-[18px]`). | Everywhere |
| `CATEGORY_ICONS` | `components/icons.tsx:68` | — | `Record<categoryId, Icon>` map, with `IconGrid` as the fallback. | `Services` |

Available UI icons: `IconShield` `IconLock` `IconWallet` `IconChat` `IconCamera`
`IconStar` `IconScale` `IconSearch` `IconArrowRight` `IconCheck` `IconChevron`
`IconMenu` `IconClose` `IconBolt` `IconUser` `IconTools` `IconPin` `IconDoc`.
Category icons: `IconWater` `IconFlash` `IconHammer` `IconBrush` `IconSparkles`
`IconConstruct` `IconBusiness` `IconSnow` `IconCar` `IconLeaf` `IconCube` `IconGrid`.

### Page sections

| Component | File | Client? | Description |
| --- | --- | --- | --- |
| `Nav` | `components/nav.tsx` | ✅ | Fixed 70px header, skip link, scroll-triggered bottom border, full-screen mobile menu with `Escape`-to-close and body scroll lock. |
| `Hero` | `components/hero.tsx` | ✅ | Stage gradient + drafting grid + pointer tracking, the page's only `<h1>`, dual CTA, three-item trust list, bottom ticker rail. |
| `EscrowSimulator` | `components/escrow-simulator.tsx` | ✅ | Section 01. Five-step lifecycle walkthrough, three animated balances, materials/workmanship split bar, accumulating console log, three closing guarantee rows. File-local: `Balance`, `useCountUp`. |
| `Services` | `components/services.tsx` | server | Section 02. 12-card category grid, coverage city list, provider marquee. |
| `HowItWorks` | `components/how-it-works.tsx` | ✅ | Section 03. Customer/artisan tablist, 4-step `<ol>`, sticky image + ghost CTA. |
| `Trust` | `components/trust.tsx` | server | Section 04. Five-pillar `<dl>`. |
| `Earnings` | `components/earnings.tsx` | ✅ | Section 05. Artisan pitch + interactive earnings worksheet. File-local: `Slider`. |
| `Faq` | `components/faq.tsx` | ✅ | Section 06. Accordion over `FAQS`; answers never unmount. |
| `Waitlist` | `components/waitlist.tsx` | ✅ | Section 07. Role tabs + `useActionState` form → `joinWaitlist`. File-local: `Field`. **Do not touch the submission logic.** |
| `Cta` | `components/cta.tsx:5` | server | Closing CTA (`#download`), no marker, plus a fine-print coverage line. |
| `Footer` | `components/cta.tsx:47` | server | 4-column footer: brand + Product / Popular trades / Cities. |

`Field`, `Slider` and `Balance` are file-local and **not exported** — if new pages
need form fields or figure blocks, those need promoting to shared modules.

### Data and logic modules

| File | What |
| --- | --- |
| `lib/site.ts` | Single source of truth for content: `SITE_URL`, `SITE`, `CATEGORIES` (12), `TRADES` (16), `CITIES` (12), `FAQS` (10), `buildJsonLd()`. |
| `lib/waitlist.ts` | Waitlist types, validation, PostgREST insert. |
| `app/actions.ts` | `joinWaitlist` server action. |

---

## 12. How metadata is generated today

### Origin

[`lib/site.ts:10-16`](lib/site.ts):

```ts
// const rawSiteUrl =
//   process.env.NEXT_PUBLIC_SITE_URL ||
//   (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'https://handlancer.vercel.app');

const rawSiteUrl = 'https://www.handlancer.com/'

export const SITE_URL = rawSiteUrl.endsWith('/') ? rawSiteUrl.slice(0, -1) : rawSiteUrl;
```

The env-var version is **commented out**; the origin is a hard-coded literal that
resolves to `https://www.handlancer.com` (trailing slash stripped). There is
currently no `VERCEL_URL` fallback in the live path. `NEXT_PUBLIC_SITE_URL` does
not exist in `.env` or `.env.example` (both contain only `SUPABASE_URL` and
`SUPABASE_ANON_KEY`).

### Metadata export

`app/layout.tsx:45-110` — a **static `metadata` object**. There is no
`generateMetadata` anywhere in the repo and no metadata helper module.

| Field | Value |
| --- | --- |
| `metadataBase` | `new URL(SITE_URL)` |
| `title` | `{ default: TITLE, template: '%s | HandLancer' }` where `TITLE = 'HandLancer — Hire Trusted Artisans in Nigeria, Pay Only for Work Done'` |
| `description` | `SITE.description` |
| `keywords` | 12 literals + `CATEGORIES.flatMap(c => c.searches)` (36) + `CITIES.map(c => ...)` (12) = **60 terms** |
| `alternates` | `{ canonical: '/' }` — declared **once, in the root layout** |
| `openGraph` | `type: website`, `locale: en_NG`, absolute `url`, one 1200×630 image at `${SITE_URL}/handlancer-preview.png` |
| `twitter` | `summary_large_image`, same absolute image URL |
| `robots` | `index/follow` + googleBot `max-image-preview: large`, `max-snippet: -1`, `max-video-preview: -1` |
| `viewport` | `themeColor: '#FBFCFD'`, no `maximumScale` (pinch-zoom preserved) |

OG/Twitter images are passed as **absolute string URLs built from `SITE_URL`**,
so they currently bypass `metadataBase` resolution entirely.

### File-convention routes that already exist

| File | Kind |
| --- | --- |
| `app/opengraph-image.png` | Static image (39,741 bytes) — **not** a `.tsx` route handler |
| `app/twitter-image.png` | Static image, byte-identical size to the above |
| `app/icon.png`, `app/apple-icon.png` | Static favicons |
| `app/robots.ts` | `MetadataRoute.Robots` — `allow: '/'`, `sitemap`, `host` |
| `app/sitemap.ts` | `MetadataRoute.Sitemap` — 8 hardcoded entries, 7 of which are `#fragment` URLs |
| `app/manifest.ts` | `MetadataRoute.Manifest` |

### JSON-LD

`buildJsonLd()` (`lib/site.ts:210-295`) returns one `@graph` with six nodes:
`Organization`, `WebSite`, `MobileApplication`, `ItemList` (12 services × 12
cities), `FAQPage` (built from the same `FAQS` array the accordion renders), and
`BreadcrumbList` (fragment URLs). It is injected as a single
`<script type="application/ld+json">` at the end of `<body>` in the root layout
(`layout.tsx:126-130`). There is **no `lib/schema.ts`** and no per-page schema.

---

## 13. Inconsistencies found

Flagged, not fixed.

### Metadata / SEO

1. **`alternates.canonical: '/'` is set only in the root layout.** Every future
   route would inherit a canonical pointing at the homepage — the classic way to
   de-index a whole new section.
2. **`app/opengraph-image.png` and `app/twitter-image.png` coexist with explicit
   `openGraph.images` / `twitter.images` in the metadata export**, which point at
   a *different* file (`/handlancer-preview.png`). Two of these three are dead
   weight. Which one actually wins needs to be confirmed against rendered HTML.
3. **`app/sitemap.ts` lists seven `#fragment` URLs.** Search engines drop the
   fragment, so the sitemap effectively declares the homepage eight times with
   eight different priorities.
4. **`robots.ts` emits a `host` directive.** Non-standard; Google ignores it.
5. **`buildJsonLd()`'s `BreadcrumbList` is fragment-based** and does not describe a
   real navigational hierarchy.
6. **`MobileApplication` schema claims `operatingSystem: 'Android, iOS'` with an
   `Offer`** for an app that has not shipped — `SITE.launched` is `false` and
   every CTA points at `#waitlist`.
7. **`keywords` is 60 terms**, and the same phrases are additionally rendered as
   visible `<li>` items under every service card (`services.tsx:48-57`).
8. **`viewport.themeColor` is `#FBFCFD` (paper) but `manifest.ts` declares
   `background_color` / `theme_color` as `#0E1116`** — a dark value that is not
   even a token (`--ink` is `#10151b`). Leftover from an earlier dark design.

### Design-system drift

9. **The entire `@theme inline` block is unused.** `--color-ink`, `--color-navy`,
   `--font-display`, `--font-mono` etc. are declared, but zero components use
   `text-navy` / `font-mono` / any Tailwind theme utility. Everything goes through
   `var(--…)` arbitrary values instead.
10. **`.cell` is defined but never applied** to any element.
11. **`--warn`, `--navy-wash` and the whole `--s1…--s6` 4pt scale are declared and
    never referenced.**
12. **`.shell` breaks at 900px**, which is not a Tailwind breakpoint — layouts
    change gutter at 900 but change columns at 1024.
13. **`scroll-mt-20` (80px) on sections vs `scroll-padding-top: 88px` on `html`** —
    two different anchor offsets for a 70px header.
14. **The closing CTA has no marker number** while every other section does, and
    its `id` is `#download` on a pre-launch site with nothing to download and no
    nav link pointing at it.

### Semantics / accessibility

15. **The provider marquee renders `[...TRADES, ...TRADES]` with identical
    non-empty `alt` on both halves** — 16 artisans announced twice to screen
    readers and crawlers. The duplicate set should be `aria-hidden` with `alt=""`.
16. **Footer column labels are `<h2>`** (`cta.tsx:93`) — "Product", "Popular
    trades", "Cities" are decorative labels styled at 11px, sitting after the
    page's `<h3>`s.
17. **Trust pillars use `<dt>` styled at heading weight** rather than headings,
    so those five topics are invisible to a document outline. Defensible, but
    inconsistent with the escrow guarantees directly above, which use `<h3>`.
18. **The nav's `#faq` link lives outside the `LINKS` array** (`nav.tsx:73-77`)
    and is re-concatenated for the mobile menu (`nav.tsx:98`) — the desktop and
    mobile navs are built from two different sources.

### Content / naming

19. **`Trade` means two things.** `lib/site.ts` has `CATEGORIES` (12 service
     categories, with icons and `id`s that mirror the app) *and* `TRADES` (16
     provider-photo entries, typed `Trade`, with `slug`s). The Phase 4 brief asks
     for "12 trade pages, from the existing trade data" — that is `CATEGORIES`,
     not `TRADES`. **This needs an explicit decision before Phase 4** (see below).
20. **`README.md` is substantially stale.** It says `SITE_URL` is
     `https://handlancer.ng` (it is `https://www.handlancer.com`); references
     `SITE.appStoreUrl` / `SITE.playStoreUrl` (neither exists); describes the hero
     as "a dark navy **stage**" with a `LogoMark` `onDark` prop (the hero is
     white-to-grey and `LogoMark` takes only `className`); references
     `app/opengraph-image.tsx` (the file is a `.png`); and says "FAQPage (9 Q&As)"
     (there are 10).
21. **The hero ticker says "12 service categories"** while the marquee shows 16
     trades and `CITIES` lists 12 cities — three different twelves/sixteens in
     play on one screen.
22. **`.env.example` documents only Supabase keys** and explicitly states "Both
     are read server-side only (no `NEXT_PUBLIC_` prefix)" — which will need
     rewording once `NEXT_PUBLIC_SITE_URL` is added in Phase 2.

---

## 14. Rules for building new pages

Derived from everything above — the checklist a new route must satisfy to be
indistinguishable from the landing page.

1. `<Nav />` … `<main className="flex-1">` … `<Footer />`, matching `app/page.tsx`.
2. Wrap content in `.shell`. Never introduce another container width.
3. Section shell: `<section id="…" className="rule-b scroll-mt-20 py-20 md:py-28">`,
   adding `band` to alternate. Keep the paper/band alternation unbroken.
4. Open with the marker + head block, exactly as in §3.
5. Exactly one `<em>` in the display heading, no class on it.
6. Wrap each block in `<Reveal>`, using the stagger delays from §7.
7. Colours only through `var(--…)` in arbitrary values. No new hex.
8. No shadows, no gradient text, no backdrop blur, no glow, no pill labels above
   headlines, no icon-in-rounded-tile cards.
9. Buttons: `btn btn-primary` / `btn btn-ghost` only. Arrow-forward buttons get
   `<IconArrowRight className="h-4 w-4" />`.
10. Figures, naira amounts and section numerals get `.figure` or
    `font-[family-name:var(--font-plex-mono)]`.
11. Icons come from `components/icons.tsx`. If one is missing, draw it in that
    file using the existing `Svg` wrapper — no icon package.
12. Close with the waitlist CTA built from the same components.
13. Anything animated must survive the `prefers-reduced-motion` block.

---

## 15. Open questions before Phase 4

These are the points where the brief and the code do not line up. Answers needed
before route architecture starts.

1. **`/services/[trade]` — is `[trade]` a `CATEGORIES.id` or a `TRADES.slug`?**
   The brief says "12 trade pages", which matches `CATEGORIES` (12 entries, with
   icons, blurbs and app parity). But `TRADES` (16) is the array literally typed
   `Trade` and is the one with `slug`s and photographs. Recommendation:
   **`CATEGORIES`**, with `id` promoted to a URL slug (`plumbing`, `electrical`,
   …) and `TRADES` kept as the photo gallery. `CATEGORIES[11]` is `other` /
   "More Trades" — a weak URL; it may want renaming or excluding.
2. **`/[city]/[trade]` will collide with any future top-level route.** A catch-all
   first segment means `/about` and `/guides` must be matched before `/[city]`.
   Next resolves static segments before dynamic ones, so this works, but the city
   list must be a closed allowlist to avoid `/anything/plumbing` rendering.
   Confirming this is the intended URL shape (vs `/artisans/[city]/[trade]`).
3. **`Cta`'s `id="download"`** — should the closing CTA become a shared component
   with a compact variant, and should that id change? It is currently in the
   sitemap's blast radius via `#` anchors.
4. **MDX is a new dependency** (`@next/mdx`, `@mdx-js/react`). The brief asks for
   MDX guides; constraint 2 says no new dependency without asking. There is no
   existing content pipeline in the repo. Options: (a) `@next/mdx`, (b)
   frontmatter-less TSX modules per guide with no new dependency, (c) a typed
   data-file approach like `lib/site.ts`. **Needs a decision.**
