/**
 * App building blocks — the mobile app's components/ui kit, redrawn in the
 * website's system. Hook-free, so they render anywhere; interactive pieces
 * (dialogs, segmented control, infinite lists) live in ./controls.tsx.
 *
 * Panels, page headers, status badges and empty states are the admin console's
 * (components/admin/ui.tsx): one dashboard idiom across the product.
 */
import Link from 'next/link';

import { Icon, type IconName } from '@/components/app/icon';
import { formatMoney } from '@/lib/app/domain/money';
import type { Escrow } from '@/lib/app/services/database.types';

export { Details, EmptyState, PageHeader, PanelTitle, Section, StatTile, StatusBadge } from '@/components/admin/ui';

// ─────────────────────────── Buttons ───────────────────────────

type ButtonVariant = 'primary' | 'ghost' | 'danger' | 'quiet';

const VARIANT: Record<ButtonVariant, string> = {
  // Teal is "money or work in motion" (mobile theme.ts `tint`): Post, Accept, Fund, Release.
  primary: 'btn btn-primary',
  ghost: 'btn btn-ghost',
  danger: 'btn border border-[var(--bad)] text-[var(--bad)] hover:bg-[#fdeeee]',
  quiet: 'btn text-[var(--navy)] hover:bg-[var(--band)]',
};

type ButtonProps = {
  variant?: ButtonVariant;
  size?: 'md' | 'lg';
  loading?: boolean;
  icon?: IconName;
  block?: boolean;
  className?: string;
  children: React.ReactNode;
};

function buttonClass({ variant = 'primary', size = 'md', block, className = '' }: ButtonProps) {
  return `${VARIANT[variant]} ${size === 'lg' ? '!h-12 !px-6 !text-[15.5px]' : '!h-10'} ${block ? 'w-full' : ''} ${className}`;
}

function ButtonBody({ loading, icon, children }: ButtonProps) {
  return (
    <>
      {loading ? <span className="spinner" aria-hidden="true" /> : icon ? <Icon name={icon} size={18} /> : null}
      {children}
    </>
  );
}

export function Button({
  type = 'button',
  disabled,
  onClick,
  ...props
}: ButtonProps & Pick<React.ButtonHTMLAttributes<HTMLButtonElement>, 'type' | 'disabled' | 'onClick' | 'form'>) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || props.loading}
      aria-busy={props.loading || undefined}
      className={buttonClass(props)}
    >
      <ButtonBody {...props} />
    </button>
  );
}

export function ButtonLink({ href, ...props }: ButtonProps & { href: string }) {
  return (
    <Link href={href} className={buttonClass(props)}>
      <ButtonBody {...props} />
    </Link>
  );
}

// ─────────────────────────── Forms ───────────────────────────

/** Label, control, then either the error or the hint — never both. */
export function Field({
  label,
  htmlFor,
  error,
  hint,
  children,
  optional,
}: {
  label: string;
  htmlFor: string;
  error?: string | null;
  hint?: React.ReactNode;
  optional?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={htmlFor} className="text-[14px] font-semibold text-[var(--ink)]">
        {label}
        {optional && <span className="ml-1.5 font-normal text-[var(--muted)]">optional</span>}
      </label>
      {children}
      {error ? (
        <p role="alert" className="text-[13.5px] text-[var(--bad)]">
          {error}
        </p>
      ) : hint ? (
        <p className="text-[13px] text-[var(--muted)]">{hint}</p>
      ) : null}
    </div>
  );
}

/** A form-level failure (network, RLS, RPC refusal) — in words, in red, announced. */
export function ErrorNote({ children }: { children: React.ReactNode }) {
  if (!children) return null;
  return (
    <p role="alert" className="rounded-md border border-[#f3c4c5] bg-[#fdeeee] px-3.5 py-2.5 text-[14px] text-[#a3272b]">
      {children}
    </p>
  );
}

/** A quiet explanatory note: what happens next, what escrow does. */
export function Note({ icon = 'information-circle', children }: { icon?: IconName; children: React.ReactNode }) {
  return (
    <div className="flex gap-2.5 rounded-md bg-[var(--band)] px-3.5 py-3 text-[14px] text-[var(--muted)]">
      <Icon name={icon} size={18} className="mt-0.5 shrink-0 text-[var(--navy)]" />
      <div className="min-w-0">{children}</div>
    </div>
  );
}

// ─────────────────────────── People ───────────────────────────

/** Photo when there is one, initials on band otherwise. */
export function Avatar({
  src,
  name,
  size = 40,
}: {
  src?: string | null;
  name?: string | null;
  size?: number;
}) {
  const initials =
    (name ?? '')
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((w) => w[0])
      .join('')
      .toUpperCase() || '?';
  if (src) {
    return (
      // eslint-disable-next-line @next/next/no-img-element -- Supabase public URLs, any host; next/image would need every bucket allowlisted.
      <img
        src={src}
        alt=""
        width={size}
        height={size}
        loading="lazy"
        decoding="async"
        className="shrink-0 rounded-full bg-[var(--band)] object-cover"
        style={{ width: size, height: size }}
      />
    );
  }
  return (
    <span
      aria-hidden="true"
      className="grid shrink-0 place-items-center rounded-full bg-[var(--band-deep)] font-semibold text-[var(--navy)]"
      style={{ width: size, height: size, fontSize: Math.round(size * 0.38) }}
    >
      {initials}
    </span>
  );
}

/** Stars for a rating out of five, with the figure beside them. */
export function Rating({ value, count }: { value: number; count?: number }) {
  return (
    <span className="inline-flex items-center gap-1 text-[13px] text-[var(--muted)]">
      <Icon name="star" size={14} className="fill-[#e2a03f] text-[#c77700]" />
      <span className="figure font-medium text-[var(--ink)]">{value ? value.toFixed(1) : 'New'}</span>
      {count != null && <span>({count})</span>}
    </span>
  );
}

// ─────────────────────────── Money ───────────────────────────

/** Every naira amount, in the site's figure face. */
export function Money({ amount, compact, className = '' }: { amount: number; compact?: boolean; className?: string }) {
  return <span className={`figure ${className}`}>{formatMoney(amount, 'NGN', compact)}</span>;
}

/**
 * Money released so far and money still held, from the escrow row.
 * Ported from mobile components/escrow/escrow-tape.tsx.
 */
export function escrowAmounts(escrow: Escrow) {
  const materials = escrow.materials_released ? escrow.materials_amount : 0;
  // The final release pays out everything still held, materials included.
  const released = escrow.workmanship_released ? escrow.total : materials;
  return { released, held: Math.max(0, escrow.total - released) };
}

/** "Stage 2 of 3 · materials bought". Ported from mobile escrow-tape.tsx. */
export function escrowStage(escrow: Escrow): { index: number; count: number; label: string } {
  const hasMaterials = escrow.materials_amount > 0;
  const count = hasMaterials ? 3 : 2;
  if (escrow.workmanship_released) return { index: count, count, label: 'paid in full' };
  if (escrow.completion_requested_at) {
    return { index: count, count, label: 'work done, waiting for you' };
  }
  if (hasMaterials && escrow.materials_released) return { index: 2, count, label: 'materials bought' };
  if (hasMaterials && escrow.materials_requested_at) {
    return { index: 1, count, label: 'asking for materials money' };
  }
  return { index: 1, count, label: escrow.status === 'pending' ? 'waiting for escrow' : 'escrow funded' };
}

type TapeMark = { at: number; value?: string; label?: string };

/**
 * Escrow drawn as a tape-measure blade (mobile components/ui/tape.tsx): the teal
 * fill is money released, its length proportional to the amount.
 */
export function Tape({
  progress,
  stops = [],
  marks,
  size = 'inline',
}: {
  progress: number;
  stops?: number[];
  marks?: TapeMark[];
  size?: 'hero' | 'inline' | 'row';
}) {
  const clamped = Math.max(0, Math.min(1, progress));
  const height = size === 'hero' ? 44 : size === 'inline' ? 20 : 8;
  return (
    <div>
      <div
        className="tape"
        data-size={size}
        style={{ height }}
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(clamped * 100)}
        aria-label="Money released from escrow"
      >
        <div className="tape-blade" style={{ width: `${clamped * 100}%` }} />
        {stops.map((s) => (
          <span key={s} className="tape-stop" style={{ left: `${s * 100}%` }} />
        ))}
      </div>
      {marks?.length ? (
        <div className="relative mt-2 h-10">
          {marks.map((m) => (
            <div
              key={`${m.at}-${m.label}`}
              className="absolute top-0 whitespace-nowrap"
              style={
                m.at >= 0.99
                  ? { right: 0, textAlign: 'right' }
                  : m.at <= 0.01
                    ? { left: 0 }
                    : { left: `${m.at * 100}%`, transform: 'translateX(-50%)', textAlign: 'center' }
              }
            >
              {m.value && <p className="figure text-[13px] font-semibold text-[var(--ink)]">{m.value}</p>}
              {m.label && <p className="text-[12px] text-[var(--muted)]">{m.label}</p>}
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}

/** The escrow as a tape, with the materials stage marked. */
export function EscrowTape({ escrow, size = 'hero', labelled = size === 'hero' }: { escrow: Escrow; size?: 'hero' | 'inline' | 'row'; labelled?: boolean }) {
  const { released, held } = escrowAmounts(escrow);
  const total = escrow.total || 1;
  const materialsAt = escrow.materials_amount > 0 ? escrow.materials_amount / total : 0;

  const marks: TapeMark[] = [];
  if (labelled) {
    if (materialsAt > 0 && materialsAt < 0.8) {
      marks.push({
        at: materialsAt,
        value: formatMoney(escrow.materials_amount),
        label: escrow.materials_released ? 'released' : 'materials',
      });
    }
    if (held > 0 && materialsAt < 0.8) {
      marks.push({ at: (released / total + 1) / 2, value: formatMoney(held), label: 'to go' });
    }
    marks.push({ at: 1, value: formatMoney(escrow.total), label: 'agreed' });
  }
  return <Tape progress={released / total} stops={materialsAt > 0 ? [materialsAt] : []} marks={marks} size={size} />;
}

// ─────────────────────────── Loading ───────────────────────────

export function Skeleton({ className = '' }: { className?: string }) {
  return <div className={`skeleton rounded ${className}`} aria-hidden="true" />;
}

/** Placeholder rows shaped like a list of people or jobs. */
export function ListSkeleton({ rows = 4 }: { rows?: number }) {
  return (
    <div className="divide-y divide-[var(--rule)]" aria-busy="true" aria-label="Loading">
      {Array.from({ length: rows }, (_, i) => (
        <div key={i} className="flex items-center gap-3 px-4 py-4 md:px-5">
          <Skeleton className="size-10 !rounded-full" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-3.5 w-2/5" />
            <Skeleton className="h-3 w-3/5" />
          </div>
        </div>
      ))}
    </div>
  );
}

// ─────────────────────────── Rows ───────────────────────────

/**
 * A tappable list row: the whole row is the link. The admin table idiom
 * (row-link) as a flex row, which reads better on a phone than a table.
 */
export function RowLink({
  href,
  children,
  chevron = true,
}: {
  href: string;
  children: React.ReactNode;
  chevron?: boolean;
}) {
  return (
    <Link
      href={href}
      className="flex items-center gap-3 px-4 py-3.5 transition-colors duration-150 hover:bg-[var(--band)] md:px-5"
    >
      <div className="flex min-w-0 flex-1 items-center gap-3">{children}</div>
      {chevron && <Icon name="chevron-forward" size={16} className="shrink-0 text-[var(--muted)]" />}
    </Link>
  );
}
