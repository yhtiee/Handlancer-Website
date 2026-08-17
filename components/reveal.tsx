'use client';

import { useEffect, useRef, type ElementType, type ReactNode } from 'react';

/**
 * Scroll-reveal wrapper. IntersectionObserver flips `data-reveal` to "in" and
 * CSS does the rest (see globals.css), so nothing animates on the main thread
 * and there is no animation library in the bundle.
 *
 * Reveals once and then unobserves — re-animating on scroll-back is noise.
 */
export function Reveal({
  children,
  delay = 0,
  as: Tag = 'div',
  className,
}: {
  children: ReactNode;
  /** Stagger in ms, for sibling cards. */
  delay?: number;
  as?: ElementType;
  className?: string;
}) {
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    // If the browser can't observe, just show the content.
    if (typeof IntersectionObserver === 'undefined') {
      el.dataset.reveal = 'in';
      return;
    }

    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          el.dataset.reveal = 'in';
          io.disconnect();
        }
      },
      { rootMargin: '0px 0px -12% 0px', threshold: 0.08 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <Tag
      ref={ref}
      data-reveal=""
      style={delay ? ({ '--reveal-delay': `${delay}ms` } as React.CSSProperties) : undefined}
      className={className}
    >
      {children}
    </Tag>
  );
}
