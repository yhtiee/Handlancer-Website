'use client';

/**
 * Every quote on a job, cheapest first. Ported from mobile
 * (user)/job/quotes/[jobId].tsx and components/quotes/quote-card.tsx: open one
 * in place — its lines, the artisan's note — and accept or decline right
 * there. Accepting asks for the escrow payment that confirms the hire.
 */
import { useParams, useRouter } from 'next/navigation';
import { useMemo, useState } from 'react';

import { ConfirmDialog, Dialog } from '@/components/app/controls';
import { DetailRows, SuccessDialog } from '@/components/app/escrow';
import { Icon } from '@/components/app/icon';
import { useOnline } from '@/components/app/pwa';
import { Thumb } from '@/components/app/rows';
import { Button, EmptyState, ErrorNote, ListSkeleton, Money, PageHeader } from '@/components/app/ui';
import { timeAgo } from '@/lib/app/domain/date';
import { formatMoney } from '@/lib/app/domain/money';
import { providerImageFallback } from '@/lib/app/domain/provider-images';
import { routes } from '@/lib/app/domain/routes';
import { useStartConversation } from '@/lib/app/queries/use-chat';
import { useJob } from '@/lib/app/queries/use-jobs';
import { useApproveQuote, useJobQuotes, useRejectQuote } from '@/lib/app/queries/use-quotes';
import { useEscrow, useFundEscrow, useWallet } from '@/lib/app/queries/use-wallet';
import type { QuoteLineItem } from '@/lib/app/services/database.types';
import type { QuoteWithProvider } from '@/lib/app/services/quotes';

export function QuotesView() {
  const router = useRouter();
  const online = useOnline();
  const { id: jobId } = useParams<{ id: string }>();
  const { data: job } = useJob(jobId);
  const { data: quotes, isLoading } = useJobQuotes(jobId);
  const { data: escrow } = useEscrow(jobId);
  const { data: wallet } = useWallet();
  const approve = useApproveQuote(jobId);
  const reject = useRejectQuote(jobId);
  const fund = useFundEscrow(jobId);
  const startChat = useStartConversation();

  const [openId, setOpenId] = useState<string | null | undefined>(undefined);
  const [declining, setDeclining] = useState<QuoteWithProvider | null>(null);
  const [paying, setPaying] = useState<QuoteWithProvider | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [hired, setHired] = useState<{ name: string; amount: number } | null>(null);

  // Accepted on top, declined last, cheapest first in between.
  const sorted = useMemo(() => {
    const rank = (q: QuoteWithProvider) => (q.status === 'approved' ? 0 : q.status === 'rejected' ? 2 : 1);
    return [...(quotes ?? [])].sort((a, b) => rank(a) - rank(b) || a.total - b.total);
  }, [quotes]);

  const accepted = sorted.find((q) => q.status === 'approved');
  const funded = Boolean(escrow) && escrow!.status !== 'pending';
  // Until the client picks, the accepted quote (or the cheapest) is open.
  const open = openId === undefined ? ((accepted ?? sorted[0])?.id ?? null) : openId;
  const first = (q: QuoteWithProvider) => q.provider?.name?.trim().split(' ')[0] ?? 'this artisan';
  const live = sorted.filter((q) => q.status !== 'rejected').length;

  async function accept(q: QuoteWithProvider) {
    setError(null);
    try {
      await approve.mutateAsync(q);
      setPaying(q);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not accept the quote.');
    }
  }

  async function payIntoEscrow() {
    if (!paying) return;
    setError(null);
    try {
      await fund.mutateAsync();
      setHired({ name: paying.provider?.name ?? 'The artisan', amount: paying.total });
      setPaying(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'The payment did not go through.');
    }
  }

  async function message(q: QuoteWithProvider) {
    setError(null);
    try {
      const convo = await startChat.mutateAsync({ providerId: q.provider_id, jobId });
      router.push(routes.chatThread(convo.id));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not open the chat.');
    }
  }

  function decision(q: QuoteWithProvider) {
    if (q.status === 'rejected') return null;
    const msg = (
      <Button variant="quiet" icon="chatbubble" onClick={() => void message(q)} loading={startChat.isPending && startChat.variables?.providerId === q.provider_id}>
        Message {first(q)}
      </Button>
    );
    if (q.status === 'approved') {
      return (
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          {funded ? (
            <Button variant="ghost" onClick={() => router.push(routes.jobDetail(jobId))}>
              Go to the job
            </Button>
          ) : (
            <Button size="lg" icon="lock-closed" onClick={() => setPaying(q)}>
              Pay {formatMoney(q.total)} into escrow
            </Button>
          )}
          {msg}
        </div>
      );
    }
    // Another quote is already accepted; this one can only be discussed.
    if (accepted) return <div>{msg}</div>;
    return (
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <Button loading={approve.isPending && approve.variables?.id === q.id} disabled={!online} onClick={() => void accept(q)}>
          Accept · {formatMoney(q.total)}
        </Button>
        <Button variant="ghost" disabled={approve.isPending} onClick={() => setDeclining(q)}>
          Decline
        </Button>
        {msg}
      </div>
    );
  }

  const walletBalance = wallet?.balance ?? 0;
  const amount = paying?.total ?? 0;
  const enough = walletBalance >= amount;

  return (
    <div className="mx-auto max-w-[820px]">
      <PageHeader
        back={{ href: routes.jobDetail(jobId), label: 'Back to job' }}
        title={job?.title ?? 'Quotes'}
        description={`${live} ${live === 1 ? 'quote' : 'quotes'}${job?.budget != null ? ` · your budget ${formatMoney(job.budget)}` : ''} · cheapest first`}
      />

      <div className="space-y-3">
        <ErrorNote>{error}</ErrorNote>
        {isLoading ? (
          <div className="card">
            <ListSkeleton rows={3} />
          </div>
        ) : sorted.length === 0 ? (
          <div className="card">
            <EmptyState title="No quotes yet">When artisans quote on your job, they show here.</EmptyState>
          </div>
        ) : (
          sorted.map((q) => (
            <QuoteCard key={q.id} quote={q} expanded={open === q.id} onToggle={() => setOpenId(open === q.id ? null : q.id)}>
              {decision(q)}
            </QuoteCard>
          ))
        )}
      </div>

      <ConfirmDialog
        open={!!declining}
        onClose={() => setDeclining(null)}
        onConfirm={() => {
          if (declining) reject.mutate(declining.id);
          setDeclining(null);
        }}
        danger
        title={`Decline ${declining ? first(declining) : ''}’s quote?`}
        description="They’ll be told you went another way. This can’t be undone."
        confirmLabel="Decline"
        loading={reject.isPending}
      />

      <Dialog
        open={!!paying}
        onClose={() => setPaying(null)}
        title={`Pay ${formatMoney(amount)} into escrow`}
        description={`It confirms ${paying?.provider?.name ?? 'the artisan'} for the job. The money stays held until you release each stage.`}
        footer={
          <>
            <Button variant="ghost" onClick={() => setPaying(null)}>
              Not now
            </Button>
            {enough ? (
              <Button loading={fund.isPending} disabled={!online} onClick={() => void payIntoEscrow()}>
                Pay {formatMoney(amount)}
              </Button>
            ) : (
              <Button
                icon="add"
                onClick={() => {
                  setPaying(null);
                  router.push(routes.walletFund());
                }}
              >
                Fund wallet
              </Button>
            )}
          </>
        }
      >
        <div className="space-y-3">
          <DetailRows
            details={[
              { label: 'Into escrow', value: <Money amount={amount} /> },
              { label: 'Your wallet', value: <Money amount={walletBalance} /> },
            ]}
          />
          {!enough && <p className="text-[14px] text-[var(--bad)]">You’re {formatMoney(amount - walletBalance)} short. Fund your wallet first.</p>}
          {error && <p className="text-[14px] text-[var(--bad)]">{error}</p>}
        </div>
      </Dialog>

      <SuccessDialog
        open={!!hired}
        onClose={() => {
          setHired(null);
          router.push(routes.jobDetail(jobId));
        }}
        title="Artisan hired"
        message={`${hired?.name ?? 'The artisan'} is hired and your payment is held in escrow. Work can start now.`}
        amount={hired?.amount}
      />
    </div>
  );
}

/** One quote: collapsed is who, rating, price; expanded adds every line and the decision. */
function QuoteCard({
  quote,
  expanded,
  onToggle,
  children,
}: {
  quote: QuoteWithProvider;
  expanded: boolean;
  onToggle: () => void;
  children?: React.ReactNode;
}) {
  const p = quote.provider;
  const declined = quote.status === 'rejected';
  const accepted = quote.status === 'approved';
  const rating = (p?.rating ?? 0) > 0 ? `${p!.rating.toFixed(1)} rating` : 'New';
  const labour = quote.line_items.filter((i) => i.type === 'labor');
  const materials = quote.line_items.filter((i) => i.type === 'material');
  const panelId = `quote-${quote.id}`;

  return (
    <section className={`card enter overflow-hidden ${accepted ? '!border-[var(--navy)]' : ''} ${declined ? 'opacity-60' : ''}`}>
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={expanded}
        aria-controls={panelId}
        className="flex w-full items-center gap-3 px-4 py-3.5 text-left transition-colors duration-150 hover:bg-[var(--band)] md:px-5"
      >
        {p ? <Thumb src={p.avatar_url ?? providerImageFallback(p)} size={48} /> : <span className="size-12 rounded-md bg-[var(--band-deep)]" />}
        <span className="min-w-0 flex-1">
          <span className="block truncate font-semibold text-[var(--ink)]">{p?.name ?? 'Artisan'}</span>
          <span className="block truncate text-[13.5px] text-[var(--muted)]">
            {accepted ? 'Accepted' : declined ? 'Declined' : `${rating} · ${timeAgo(quote.created_at)}`}
          </span>
        </span>
        <span className={`figure text-[17px] font-semibold text-[var(--ink)] ${declined ? 'line-through' : ''}`}>{formatMoney(quote.total)}</span>
        <Icon name="chevron-down" size={18} className={`text-[var(--muted)] transition-transform duration-200 ${expanded ? 'rotate-180' : ''}`} />
      </button>
      {expanded && (
        <div id={panelId} className="space-y-4 border-t border-[var(--rule)] px-4 py-4 md:px-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <Lines title="Labour" items={labour} total={quote.labor_cost} />
            <Lines title="Materials" items={materials} total={quote.materials_cost} />
          </div>
          {quote.message && <p className="whitespace-pre-wrap border-l-2 border-[var(--rule-strong)] pl-3 text-[15px] italic text-[var(--ink)]">“{quote.message}”</p>}
          {children}
        </div>
      )}
    </section>
  );
}

function Lines({ title, items, total }: { title: string; items: QuoteLineItem[]; total: number }) {
  if (!items.length) return null;
  return (
    <div>
      <div className="flex items-baseline justify-between border-b border-[var(--rule)] pb-1.5">
        <p className="font-semibold text-[var(--ink)]">{title}</p>
        <Money amount={total} className="font-semibold text-[var(--ink)]" />
      </div>
      <ul className="mt-1.5 space-y-1">
        {items.map((item, i) => (
          <li key={i} className="flex justify-between gap-3 text-[14px] text-[var(--muted)]">
            <span className="min-w-0">{item.label}</span>
            <Money amount={item.amount} />
          </li>
        ))}
      </ul>
    </div>
  );
}
