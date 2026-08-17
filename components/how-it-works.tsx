'use client';

import { useState } from 'react';
import Image from 'next/image';
import { Reveal } from './reveal';

/* The two roles are the app's own onboarding fork (src/app/(auth)/role-select.tsx). */
const TRACKS = {
  user: {
    label: 'I need a job done',
    image: '/brand/working-woman.webp',
    imageAlt: 'Nigerian artisan ready to take on a job booked through HandLancer',
    cta: 'Join the customer waitlist',
    steps: [
      {
        t: 'Post the job, or pick your artisan',
        d: 'Describe what needs doing, add a budget and location, and post it publicly for quotes. Or browse the directory and send a direct hire request to one specific provider — only they can quote.',
      },
      {
        t: 'Compare itemised quotes',
        d: 'Quotes arrive sorted cheapest first, each broken into material and labour line items. Message any artisan in-app before you decide.',
      },
      {
        t: 'Approve, and fund escrow',
        d: 'Approving a quote hires that artisan and rejects the rest. Your payment moves into escrow, where neither side can touch it.',
      },
      {
        t: 'Release, rate, done',
        d: 'Release materials so work can start, check the after-photos, then rate the job. Your rating and the final payout are written together.',
      },
    ],
  },
  provider: {
    label: 'I provide services',
    image: '/brand/working-man.webp',
    imageAlt: 'Verified Nigerian tradesman earning through the HandLancer app',
    cta: 'Join the artisan waitlist',
    steps: [
      {
        t: 'Build a profile that wins work',
        d: 'List your trades, years of experience, hourly rate and service radius. Your rating and completed jobs sit where customers look first.',
      },
      {
        t: 'Find work that fits',
        d: 'Filter the feed by category, budget, location and how recently a job was posted — or switch on “matches my skills” and only see work you can actually do.',
      },
      {
        t: 'Quote line by line',
        d: 'Break the price into materials and labour. Customers trust a quote they can read, and it is what sets your escrow split.',
      },
      {
        t: 'Get paid without chasing',
        d: 'Materials money is released before you buy supplies. Your labour is already funded and waiting — no more knocking on doors for the balance.',
      },
    ],
  },
} as const;

type RoleKey = keyof typeof TRACKS;

export function HowItWorks() {
  const [role, setRole] = useState<RoleKey>('user');
  const track = TRACKS[role];

  return (
    <section id="how" className="band rule-b scroll-mt-20 py-20 md:py-28">
      <div className="shell">
        <Reveal>
          <p className="marker">
            <b>03</b> <span>How it works</span>
          </p>
        </Reveal>

        <div className="mt-9 flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
          <Reveal>
            <h2 className="max-w-[16ch] text-[clamp(2rem,4.4vw,3.05rem)]">
              One app, <em>two</em> doors
            </h2>
          </Reveal>

          {/* Role switch — plain segmented text, not a pill toggle */}
          <Reveal delay={80}>
            <div role="tablist" aria-label="Choose your role" className="flex gap-6 border-b border-[var(--rule-strong)]">
              {(Object.keys(TRACKS) as RoleKey[]).map((key) => {
                const active = role === key;
                return (
                  <button
                    key={key}
                    role="tab"
                    type="button"
                    aria-selected={active}
                    aria-controls={`track-${key}`}
                    id={`tab-${key}`}
                    onClick={() => setRole(key)}
                    className="relative -mb-px cursor-pointer pb-3 text-[15px] font-semibold transition-colors duration-200"
                    style={{
                      color: active ? 'var(--navy)' : 'var(--muted)',
                      borderBottom: `2px solid ${active ? 'var(--teal)' : 'transparent'}`,
                    }}
                  >
                    {TRACKS[key].label}
                  </button>
                );
              })}
            </div>
          </Reveal>
        </div>

        <div
          id={`track-${role}`}
          role="tabpanel"
          aria-labelledby={`tab-${role}`}
          className="mt-12 grid gap-12 lg:grid-cols-[1.15fr_.85fr] lg:gap-16"
        >
          {/* Steps — alternating indent gives the column an uneven, hand-set edge */}
          <ol className="divide-y divide-[var(--rule-strong)] border-y border-[var(--rule-strong)]">
            {track.steps.map((s, i) => (
              <Reveal as="li" key={`${role}-${i}`} delay={i * 70}>
                <div className={`flex gap-6 py-7 ${i % 2 === 1 ? 'lg:pl-10' : ''}`}>
                  <span className="figure shrink-0 pt-1 text-[13px] text-[var(--navy)]">
                    {String(i + 1).padStart(2, '0')}
                  </span>
                  <div>
                    <h3 className="text-[19px]">{s.t}</h3>
                    <p className="mt-2 max-w-[52ch] text-[15px] leading-relaxed text-[var(--muted)]">
                      {s.d}
                    </p>
                  </div>
                </div>
              </Reveal>
            ))}
          </ol>

          <Reveal delay={120}>
            <div className="lg:sticky lg:top-24">
              <div className="overflow-hidden rounded-sm border border-[var(--rule)]">
                <Image
                  key={track.image}
                  src={track.image}
                  alt={track.imageAlt}
                  width={640}
                  height={640}
                  loading="lazy"
                  sizes="(max-width: 1024px) 100vw, 400px"
                  className="h-auto w-full object-cover"
                />
              </div>
              <a href="#waitlist" className="btn btn-ghost mt-5 w-full">
                {track.cta}
              </a>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
