'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { LogoMark, IconMenu, IconClose } from './icons';

/*
 * Every href is rooted. A bare `#escrow` is a dead link on /services/plumbing —
 * it scrolls to nothing, because that section only exists on the homepage.
 * `/#escrow` navigates home and then scrolls, from any route.
 *
 * All of them use next/link, including the hash ones: Link renders a real <a>
 * and supports `/route#id`, so it handles cross-route fragments and prefetches
 * the destination.
 */
const LINKS: { href: string; label: string }[] = [
  { href: '/#escrow', label: 'Escrow' },
  { href: '/services', label: 'Services' },
  { href: '/#how', label: 'How it works' },
  { href: '/#trust', label: 'Trust' },
  { href: '/for-artisans', label: 'For artisans' },
  { href: '/guides', label: 'Guides' },
];

const FAQ_LINK = { href: '/#faq', label: 'FAQ' };

export function Nav() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener('keydown', onKey);
    };
  }, [open]);

  return (
    <>
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-[70] focus:rounded focus:bg-[var(--teal)] focus:px-4 focus:py-2 focus:font-semibold focus:text-[#06201d]"
      >
        Skip to content
      </a>

      <header
        className="fixed inset-x-0 top-0 z-50 bg-[var(--paper)] transition-[border-color] duration-300"
        style={{ borderBottom: `1px solid ${scrolled ? 'var(--rule)' : 'transparent'}` }}
      >
        <nav className="shell flex h-[70px] items-center justify-between gap-6" aria-label="Main">
          <Link href="/" className="flex shrink-0 items-center gap-2.5" aria-label="HandLancer home">
            <LogoMark className="h-8 w-8" />
            <span className="text-[18px] font-bold tracking-[-0.03em] text-[var(--navy)]">
              HandLancer
            </span>
          </Link>

          <ul className="hidden items-center gap-7 lg:flex">
            {LINKS.map((l) => (
              <li key={l.href}>
                <Link
                  href={l.href}
                  className="cursor-pointer text-[14.5px] font-medium text-[var(--muted)] transition-colors duration-200 hover:text-[var(--ink)]"
                >
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>

          <div className="hidden shrink-0 items-center gap-5 md:flex">
            <Link
              href={FAQ_LINK.href}
              className="cursor-pointer text-[14.5px] font-medium text-[var(--muted)] transition-colors duration-200 hover:text-[var(--ink)]"
            >
              {FAQ_LINK.label}
            </Link>
            <Link href="/#waitlist" className="btn btn-primary !py-2.5 !text-[14.5px]">
              Join the waitlist
            </Link>
          </div>

          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-expanded={open}
            aria-controls="mobile-menu"
            aria-label={open ? 'Close menu' : 'Open menu'}
            className="grid h-11 w-11 cursor-pointer place-items-center rounded border border-[var(--rule-strong)] transition-colors duration-200 hover:border-[var(--ink)] lg:hidden"
          >
            {open ? <IconClose className="h-5 w-5" /> : <IconMenu className="h-5 w-5" />}
          </button>
        </nav>
      </header>

      <div id="mobile-menu" hidden={!open} className="fixed inset-0 z-40 bg-[var(--paper)] pt-[70px] lg:hidden">
        <ul className="shell divide-y divide-[var(--rule)] border-t border-[var(--rule)]">
          {LINKS.concat(FAQ_LINK).map((l) => (
            <li key={l.href}>
              <Link
                href={l.href}
                onClick={() => setOpen(false)}
                className="block cursor-pointer py-5 text-[22px] font-semibold tracking-[-0.02em] text-[var(--navy)]"
              >
                {l.label}
              </Link>
            </li>
          ))}
        </ul>
        <div className="shell mt-8">
          <Link
            href="/#waitlist"
            onClick={() => setOpen(false)}
            className="btn btn-primary w-full !py-4 !text-base"
          >
            Join the waitlist
          </Link>
        </div>
      </div>
    </>
  );
}
