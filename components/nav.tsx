'use client';

import { useEffect, useState } from 'react';
import { LogoMark, IconMenu, IconClose } from './icons';

const LINKS = [
  { href: '#escrow', label: 'Escrow' },
  { href: '#services', label: 'Services' },
  { href: '#how', label: 'How it works' },
  { href: '#trust', label: 'Trust' },
  { href: '#earn', label: 'For artisans' },
];

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
          <a href="#main" className="flex shrink-0 items-center gap-2.5" aria-label="HandLancer home">
            <LogoMark className="h-8 w-8" />
            <span className="text-[18px] font-bold tracking-[-0.03em] text-[var(--navy)]">
              HandLancer
            </span>
          </a>

          <ul className="hidden items-center gap-7 lg:flex">
            {LINKS.map((l) => (
              <li key={l.href}>
                <a
                  href={l.href}
                  className="cursor-pointer text-[14.5px] font-medium text-[var(--muted)] transition-colors duration-200 hover:text-[var(--ink)]"
                >
                  {l.label}
                </a>
              </li>
            ))}
          </ul>

          <div className="hidden shrink-0 items-center gap-5 md:flex">
            <a
              href="#faq"
              className="cursor-pointer text-[14.5px] font-medium text-[var(--muted)] transition-colors duration-200 hover:text-[var(--ink)]"
            >
              FAQ
            </a>
            <a href="#waitlist" className="btn btn-primary !py-2.5 !text-[14.5px]">
              Join the waitlist
            </a>
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
          {LINKS.concat({ href: '#faq', label: 'FAQ' }).map((l) => (
            <li key={l.href}>
              <a
                href={l.href}
                onClick={() => setOpen(false)}
                className="block cursor-pointer py-5 text-[22px] font-semibold tracking-[-0.02em] text-[var(--navy)]"
              >
                {l.label}
              </a>
            </li>
          ))}
        </ul>
        <div className="shell mt-8">
          <a href="#waitlist" onClick={() => setOpen(false)} className="btn btn-primary w-full !py-4 !text-base">
            Join the waitlist
          </a>
        </div>
      </div>
    </>
  );
}
