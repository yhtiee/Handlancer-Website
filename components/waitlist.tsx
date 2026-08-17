'use client';

import { useActionState, useId, useState } from 'react';
import { joinWaitlist } from '@/app/actions';
import { EMPTY_STATE, type WaitlistRole } from '@/lib/waitlist';
import { CATEGORIES, CITIES } from '@/lib/site';
import { Reveal } from './reveal';
import { IconArrowRight, IconCheck } from './icons';

const COPY: Record<WaitlistRole, { tab: string; lead: string; categoryLabel: string; bullets: string[] }> = {
  user: {
    tab: 'I need a job done',
    lead: 'Be first to post a job when HandLancer opens in your city.',
    categoryLabel: 'What do you need help with?',
    bullets: [
      'First access when we launch in your city',
      'Your first job posted free, always',
      'No card, no commitment — just an email',
    ],
  },
  provider: {
    tab: 'I provide services',
    lead: 'Get your profile in early, before customers start posting.',
    categoryLabel: 'What is your main trade?',
    bullets: [
      'Early profiles are reviewed and verified first',
      'Quote on jobs from day one, free',
      'We will call you before we launch in your area',
    ],
  },
};

function Field({
  label,
  name,
  error,
  defaultValue,
  hint,
  ...input
}: {
  label: string;
  name: string;
  error?: string;
  defaultValue?: string;
  hint?: string;
} & React.InputHTMLAttributes<HTMLInputElement>) {
  const id = useId();
  const errId = `${id}-err`;
  return (
    <div>
      <label htmlFor={id} className="block text-[13.5px] font-semibold text-[var(--ink)]">
        {label}
      </label>
      <input
        id={id}
        name={name}
        defaultValue={defaultValue}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? errId : undefined}
        className="mt-1.5 w-full rounded-md border bg-[var(--paper)] px-3.5 py-2.5 text-[15px] text-[var(--ink)] outline-none transition-colors duration-150 placeholder:text-[var(--muted)] focus:border-[var(--navy)]"
        style={{ borderColor: error ? 'var(--bad)' : 'var(--rule-strong)' }}
        {...input}
      />
      {error ? (
        <p id={errId} className="mt-1.5 text-[12.5px] font-medium text-[var(--bad)]">
          {error}
        </p>
      ) : hint ? (
        <p className="mt-1.5 text-[12.5px] text-[var(--muted)]">{hint}</p>
      ) : null}
    </div>
  );
}

export function Waitlist() {
  const [role, setRole] = useState<WaitlistRole>('user');
  const [state, formAction, pending] = useActionState(joinWaitlist, EMPTY_STATE);
  const copy = COPY[role];
  const v = state.values ?? {};
  const err = state.errors ?? {};
  const cityListId = useId();
  const categoryId = useId();

  return (
    <section id="waitlist" className="band rule-b scroll-mt-20 py-20 md:py-28">
      <div className="shell">
        <Reveal>
          <p className="marker">
            <b>07</b> <span>Waitlist</span>
          </p>
        </Reveal>

        <div className="mt-9 grid gap-12 lg:grid-cols-[1fr_1.05fr] lg:gap-16">
          {/* ---- Pitch ---- */}
          <Reveal>
            <h2 className="max-w-[16ch] text-[clamp(2rem,4.4vw,3.05rem)]">
              We are not live yet. <em>Get in first.</em>
            </h2>
            <p className="lede mt-6 max-w-[44ch]">
              HandLancer is in build. Join the waitlist and we will let you in as soon as we open
              your city — customers and artisans both.
            </p>

            <ul className="mt-8 divide-y divide-[var(--rule)] border-y border-[var(--rule)]">
              {copy.bullets.map((b) => (
                <li key={b} className="flex items-start gap-3 py-3.5">
                  <IconCheck className="mt-0.5 h-4 w-4 shrink-0 text-[var(--ok-ink)]" />
                  <span className="text-[14.5px] text-[var(--muted)]">{b}</span>
                </li>
              ))}
            </ul>

            <p className="mt-6 max-w-[42ch] text-[13px] text-[var(--muted)]">
              We will only email you about the launch. No newsletter, no sharing your details with
              anyone.
            </p>
          </Reveal>

          {/* ---- Form ---- */}
          <Reveal delay={100}>
            <div className="border border-[var(--rule-strong)] bg-[var(--paper)]">
              {state.status === 'success' ? (
                <div className="px-6 py-14 text-center sm:px-10">
                  <span className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-[var(--ok-ink)]/10">
                    <IconCheck className="h-6 w-6 text-[var(--ok-ink)]" />
                  </span>
                  <h3 className="mt-5 text-[22px]">You&rsquo;re on the list</h3>
                  <p className="mx-auto mt-3 max-w-[34ch] text-[15px] leading-relaxed text-[var(--muted)]">
                    {state.message}
                  </p>
                  <p className="mt-8 border-t border-[var(--rule)] pt-6 text-[14px] text-[var(--muted)]">
                    Also{' '}
                    {role === 'user' ? 'an artisan looking for work' : 'need a job done yourself'}?{' '}
                    <button
                      type="button"
                      onClick={() => {
                        setRole(role === 'user' ? 'provider' : 'user');
                        // Full reload clears the action state cleanly; this is a
                        // one-off after a successful submit, not a hot path.
                        window.location.hash = '#waitlist';
                        window.location.reload();
                      }}
                      className="ulink cursor-pointer"
                    >
                      Join the other list
                    </button>
                    .
                  </p>
                </div>
              ) : (
                <form action={formAction} noValidate>
                  {/* Role switch */}
                  <div
                    role="tablist"
                    aria-label="Who are you joining as?"
                    className="flex border-b border-[var(--rule)]"
                  >
                    {(Object.keys(COPY) as WaitlistRole[]).map((k) => {
                      const active = role === k;
                      return (
                        <button
                          key={k}
                          role="tab"
                          type="button"
                          aria-selected={active}
                          onClick={() => setRole(k)}
                          className="flex-1 cursor-pointer px-4 py-4 text-[14px] font-semibold transition-colors duration-200"
                          style={{
                            color: active ? 'var(--navy)' : 'var(--muted)',
                            background: active ? 'var(--paper)' : 'var(--band)',
                            borderBottom: `2px solid ${active ? 'var(--teal)' : 'transparent'}`,
                          }}
                        >
                          {COPY[k].tab}
                        </button>
                      );
                    })}
                  </div>

                  <div className="px-6 py-7 sm:px-8">
                    <p className="text-[14px] text-[var(--muted)]">{copy.lead}</p>

                    {/* role travels with the submission */}
                    <input type="hidden" name="role" value={role} />
                    {/* honeypot — visually and programmatically hidden from people */}
                    <div aria-hidden className="hidden">
                      <label htmlFor="company">Company</label>
                      <input id="company" name="company" tabIndex={-1} autoComplete="off" />
                    </div>

                    <div className="mt-5 grid gap-5 sm:grid-cols-2">
                      <Field
                        label="Full name"
                        name="name"
                        error={err.name}
                        defaultValue={v.name}
                        autoComplete="name"
                        placeholder="Chidi Okafor"
                        required
                      />
                      <Field
                        label="Email"
                        name="email"
                        type="email"
                        inputMode="email"
                        error={err.email}
                        defaultValue={v.email}
                        autoComplete="email"
                        placeholder="you@example.com"
                        required
                      />
                      <Field
                        label="Phone"
                        name="phone"
                        type="tel"
                        inputMode="tel"
                        error={err.phone}
                        defaultValue={v.phone}
                        autoComplete="tel"
                        placeholder="0803 123 4567"
                        hint="Optional — for launch calls only."
                      />
                      <Field
                        label="City"
                        name="city"
                        error={err.city}
                        defaultValue={v.city}
                        autoComplete="address-level2"
                        placeholder="Lagos"
                        list={cityListId}
                        required
                      />
                    </div>

                    <datalist id={cityListId}>
                      {CITIES.map((c) => (
                        <option key={c} value={c} />
                      ))}
                    </datalist>

                    <div className="mt-5 grid gap-5 sm:grid-cols-2">
                      <div>
                        <label
                          htmlFor={categoryId}
                          className="block text-[13.5px] font-semibold text-[var(--ink)]"
                        >
                          {copy.categoryLabel}
                        </label>
                        <select
                          id={categoryId}
                          name="category"
                          defaultValue={v.category ?? ''}
                          required
                          aria-invalid={err.category ? true : undefined}
                          aria-describedby={err.category ? `${categoryId}-err` : undefined}
                          className="mt-1.5 w-full cursor-pointer rounded-md border bg-[var(--paper)] px-3.5 py-2.5 text-[15px] text-[var(--ink)] outline-none transition-colors duration-150 focus:border-[var(--navy)]"
                          style={{ borderColor: err.category ? 'var(--bad)' : 'var(--rule-strong)' }}
                        >
                          <option value="" disabled>
                            Choose one…
                          </option>
                          {CATEGORIES.map((c) => (
                            <option key={c.id} value={c.id}>
                              {c.label}
                            </option>
                          ))}
                        </select>
                        {err.category && (
                          <p
                            id={`${categoryId}-err`}
                            className="mt-1.5 text-[12.5px] font-medium text-[var(--bad)]"
                          >
                            {err.category}
                          </p>
                        )}
                      </div>

                      {role === 'provider' ? (
                        <Field
                          label="Years of experience"
                          name="years"
                          type="number"
                          inputMode="numeric"
                          min={0}
                          max={60}
                          error={err.years}
                          defaultValue={v.years}
                          placeholder="5"
                          hint="Optional."
                        />
                      ) : (
                        <Field
                          label="How did you hear about us?"
                          name="referral"
                          error={err.referral}
                          defaultValue={v.referral}
                          placeholder="A friend, Instagram…"
                          hint="Optional."
                        />
                      )}
                    </div>

                    {state.status === 'error' && state.message && (
                      <p
                        role="alert"
                        className="mt-5 rounded-md border border-[var(--bad)]/40 bg-[var(--bad)]/[.06] px-3.5 py-3 text-[13.5px] font-medium text-[var(--bad)]"
                      >
                        {state.message}
                      </p>
                    )}

                    <button type="submit" disabled={pending} className="btn btn-primary mt-6 w-full disabled:opacity-60">
                      {pending ? 'Adding you…' : role === 'provider' ? 'Join as an artisan' : 'Join the waitlist'}
                      {!pending && <IconArrowRight className="h-4 w-4" />}
                    </button>

                    <p className="mt-3 text-center text-[12px] text-[var(--muted)]">
                      Free to join. We will never share your details.
                    </p>
                  </div>
                </form>
              )}
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
