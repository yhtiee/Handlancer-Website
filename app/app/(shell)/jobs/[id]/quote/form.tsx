'use client';

/**
 * Write (or update) a quote. Ported from mobile (provider)/find-work/apply
 * and components/quotes/line-item-editor.tsx: the job in one line at the top,
 * labour then materials — the split escrow pays out on — and a note. The total
 * against the client's budget stays pinned beside Send.
 */
import { useParams, useRouter } from 'next/navigation';
import { useState } from 'react';

import { Icon } from '@/components/app/icon';
import { useOnline } from '@/components/app/pwa';
import { Button, ButtonLink, ErrorNote, Money, PageHeader, Section } from '@/components/app/ui';
import { useAuth } from '@/lib/app/auth';
import { canQuote } from '@/lib/app/domain/artisan-status';
import { formatMoney } from '@/lib/app/domain/money';
import { routes } from '@/lib/app/domain/routes';
import { useJob } from '@/lib/app/queries/use-jobs';
import { useMyQuoteForJob, useSubmitQuote } from '@/lib/app/queries/use-quotes';
import type { QuoteLineItem } from '@/lib/app/services/database.types';

type Kind = QuoteLineItem['type'];

const SECTIONS: { type: Kind; title: string; hint: string; placeholder: string; add: string }[] = [
  { type: 'labor', title: 'Labour', hint: 'Your work. Paid when the client approves the finished job.', placeholder: 'e.g. Replace the trap and reseal', add: 'Add labour' },
  { type: 'material', title: 'Materials', hint: 'Parts you buy. Paid to you early, so you can buy them.', placeholder: 'e.g. P-trap and washers', add: 'Add a material' },
];

export function QuoteForm() {
  const router = useRouter();
  const online = useOnline();
  const { id: jobId } = useParams<{ id: string }>();
  const { data: job } = useJob(jobId);
  const { data: existing } = useMyQuoteForJob(jobId);
  const submit = useSubmitQuote(jobId);
  const { profile } = useAuth();

  const [items, setItems] = useState<QuoteLineItem[]>([{ label: '', type: 'labor', amount: 0 }]);
  const [message, setMessage] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [checked, setChecked] = useState(false);

  // Prefill once from a quote already sent (updating it).
  const [hydratedFrom, setHydratedFrom] = useState<string | null>(null);
  if (existing && hydratedFrom !== existing.id) {
    setHydratedFrom(existing.id);
    if (existing.line_items?.length) setItems(existing.line_items);
    if (existing.message) setMessage(existing.message);
  }

  const updating = !!existing;
  const client = job?.owner?.name?.trim().split(' ')[0];
  const total = items.reduce((s, i) => s + (i.amount || 0), 0);
  const diff = job?.budget != null && total > 0 ? job.budget - total : null;

  const update = (index: number, patch: Partial<QuoteLineItem>) => setItems((prev) => prev.map((it, i) => (i === index ? { ...it, ...patch } : it)));
  const remove = (index: number) => setItems((prev) => prev.filter((_, i) => i !== index));
  const add = (type: Kind) => setItems((prev) => [...prev, { label: '', type, amount: 0 }]);

  async function send(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setChecked(true);
    const incomplete = items.some((i) => !i.label.trim() !== !(i.amount > 0));
    const valid = items.filter((i) => i.label.trim() && i.amount > 0);
    if (incomplete) return setError('Finish or remove the highlighted line.');
    if (!valid.length) return setError('Add at least one line with a description and an amount.');
    try {
      await submit.mutateAsync({ lineItems: valid, message: message.trim() || null });
      router.replace(routes.findWorkJob(jobId));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Your quote did not send. Try again.');
    }
  }

  // The database refuses quotes from unapproved artisans; say so before they type one.
  if (profile && !canQuote(profile)) {
    return (
      <div className="mx-auto max-w-[560px]">
        <PageHeader back={{ href: routes.findWorkJob(jobId), label: 'Back to job' }} title="Quoting opens when you’re approved" description="Approved artisans can quote on open jobs. Check where your application stands." />
        <ButtonLink href={routes.apply}>See my application</ButtonLink>
      </div>
    );
  }

  return (
    <form onSubmit={send} noValidate className="mx-auto max-w-[760px] pb-28 lg:pb-24">
      <PageHeader
        back={{ href: routes.findWorkJob(jobId), label: 'Back to job' }}
        title={job?.title ?? 'Quote'}
        description={
          job ? (
            <>
              {updating ? 'Update your quote' : 'Quote'}
              {client || job.location ? ` for ${[client, job.location].filter(Boolean).join(' · ')}` : ''}
              {job.budget != null ? (
                <>
                  {' · budget '}
                  <Money amount={job.budget} className="text-[var(--ink)]" />
                </>
              ) : (
                ' · no budget given'
              )}
            </>
          ) : undefined
        }
      />

      {job?.description && (
        <details className="card enter mb-6 p-4">
          <summary className="cursor-pointer text-[14px] font-semibold text-[var(--navy)]">Read the whole brief</summary>
          <p className="mt-3 whitespace-pre-wrap text-[15px] text-[var(--ink)]">{job.description}</p>
        </details>
      )}

      <div className="space-y-6">
        {SECTIONS.map((section) => {
          const lines = items.map((item, index) => ({ item, index })).filter(({ item }) => item.type === section.type);
          const subtotal = lines.reduce((s, { item }) => s + (item.amount || 0), 0);
          return (
            <Section key={section.type} title={section.title} action={subtotal > 0 ? <Money amount={subtotal} className="font-semibold text-[var(--ink)]" /> : undefined}>
              <p className="-mt-1 mb-3 text-[13.5px] text-[var(--muted)]">{section.hint}</p>
              <div className="space-y-2">
                {lines.map(({ item, index }) => {
                  const incomplete = checked && !item.label.trim() !== !(item.amount > 0);
                  return (
                    <div key={index} className={`flex items-stretch overflow-hidden rounded-md border bg-[var(--paper)] ${incomplete ? 'border-[var(--bad)]' : 'border-[var(--rule-strong)]'}`}>
                      <input
                        aria-label={`${section.title} description`}
                        className="min-w-0 flex-1 bg-transparent px-3 py-2.5 outline-none"
                        placeholder={section.placeholder}
                        value={item.label}
                        onChange={(e) => update(index, { label: e.target.value })}
                      />
                      <label className="flex w-[124px] shrink-0 items-center gap-1 border-l border-[var(--rule)] px-2.5 sm:w-[150px]">
                        <span className="figure text-[var(--muted)]">₦</span>
                        <input
                          aria-label={`${section.title} amount`}
                          className="figure w-full min-w-0 bg-transparent py-2.5 text-right outline-none"
                          inputMode="numeric"
                          placeholder="0"
                          value={item.amount ? item.amount.toLocaleString('en-NG') : ''}
                          onChange={(e) => update(index, { amount: Number(e.target.value.replace(/[^0-9]/g, '')) || 0 })}
                        />
                      </label>
                      <button
                        type="button"
                        onClick={() => remove(index)}
                        aria-label="Remove this line"
                        className="grid w-10 shrink-0 place-items-center text-[var(--muted)] hover:bg-[var(--band)] hover:text-[var(--ink)]"
                      >
                        <Icon name="close" size={16} />
                      </button>
                    </div>
                  );
                })}
              </div>
              <button type="button" onClick={() => add(section.type)} className="mt-3 inline-flex items-center gap-1.5 text-[14px] font-semibold text-[var(--navy)] hover:underline">
                <Icon name="add" size={16} />
                {section.add}
              </button>
            </Section>
          );
        })}

        <Section title={`A note for ${client ?? 'the client'}`}>
          <textarea
            aria-label="Note"
            className="input min-h-[110px]"
            placeholder="When you can come, how long it takes, anything included."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
          />
        </Section>
      </div>

      {/* Pinned: the total, against the budget, and Send. */}
      <div className="hl-actionbar fixed inset-x-0 z-20 border-t border-[var(--rule)] bg-[var(--paper)] lg:left-[var(--sidebar-w)]">
        <div className="mx-auto max-w-[760px] space-y-2 px-4 py-3 md:px-8">
          <ErrorNote>{error}</ErrorNote>
          <div className="flex items-center gap-3">
            <div className="min-w-0 flex-1">
              <Money amount={total} className="block text-[22px] font-semibold text-[var(--ink)]" />
              <p className="text-[13px] text-[var(--muted)]">
                {diff == null
                  ? 'Your total'
                  : diff === 0
                    ? 'Exactly their budget'
                    : diff > 0
                      ? `${formatMoney(diff)} under their budget`
                      : `${formatMoney(-diff)} over their budget`}
              </p>
            </div>
            <Button type="submit" size="lg" icon="send" loading={submit.isPending} disabled={!online}>
              {updating ? 'Update quote' : 'Send quote'}
            </Button>
          </div>
        </div>
      </div>
    </form>
  );
}
