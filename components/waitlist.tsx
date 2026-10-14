'use client';

import Link from 'next/link';
import { useActionState, useId } from 'react';
import { joinWaitlist } from '@/app/actions';
import { EMPTY_STATE } from '@/lib/waitlist';
import { CATEGORIES, CITIES } from '@/lib/site';
import { Reveal } from './reveal';
import { IconArrowRight, IconCheck } from './icons';

/*
 * Customers only. Artisans no longer wait: they register in the app and are
 * reviewed (/for-artisans → /app/apply), so there are verified people to hire
 * when a city opens to customers. The form, action and table still accept
 * `provider` rows, so nothing already stored breaks.
 */
const COPY = {
  lead: 'Be first to post a job when HandLancer opens to customers in your city.',
  categoryLabel: 'What do you need help with?',
  bullets: [
    'First access when we open to customers in your city',
    'Your first job posted free, always',
    'No card, no commitment — just an email',
  ],
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
  const [state, formAction, pending] = useActionState(joinWaitlist, EMPTY_STATE);
  const copy = COPY;
  const v = state.values ?? {};
  const err = state.errors ?? {};
  const cityListId = useId();
  const categoryId = useId();

  return (
    <section id="waitlist" className="band rule-b scroll-mt-20 py-20 md:py-28">
      <div className="shell">
        <Reveal>
          <p className="marker">
            <b>07</b> <span>Customer waitlist</span>
          </p>
        </Reveal>

        <div className="mt-9 grid gap-12 lg:grid-cols-[1fr_1.05fr] lg:gap-16">
          {/* ---- Pitch ---- */}
          <Reveal>
            <h2 className="max-w-[16ch] text-[clamp(2rem,4.4vw,3.05rem)]">
              Artisans first. <em>Customers next.</em>
            </h2>
            <p className="lede mt-6 max-w-[44ch]">
              We are signing up and reviewing artisans now, so there are verified people to hire on
              day one. Join the customer waitlist and we will let you in as soon as your city is
              ready.
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
                    An artisan yourself?{' '}
                    <Link href="/for-artisans" className="ulink">
                      Join now — no waiting
                    </Link>
                    .
                  </p>
                </div>
              ) : (
                <form action={formAction} noValidate>
                  {/* Artisans no longer queue here — send them straight in. */}
                  <Link
                    href="/for-artisans"
                    className="flex items-center justify-between gap-3 border-b border-[var(--rule)] bg-[var(--band)] px-6 py-3.5 text-[14px] transition-colors duration-200 hover:bg-[var(--teal-wash)] sm:px-8"
                  >
                    <span className="text-[var(--muted)]">
                      <b className="font-semibold text-[var(--navy)]">Artisan?</b> You don&rsquo;t need to wait — join now.
                    </span>
                    <IconArrowRight className="h-4 w-4 shrink-0 text-[var(--navy)]" />
                  </Link>

                  <div className="px-6 py-7 sm:px-8">
                    <p className="text-[14px] text-[var(--muted)]">{copy.lead}</p>

                    {/* customers only now; the action still accepts both */}
                    <input type="hidden" name="role" value="user" />
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

                        <Field
                          label="How did you hear about us?"
                          name="referral"
                          error={err.referral}
                          defaultValue={v.referral}
                          placeholder="A friend, Instagram…"
                          hint="Optional."
                        />
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
                      {pending ? 'Adding you…' : 'Join the customer waitlist'}
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
