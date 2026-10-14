'use client';

/**
 * Interactive building blocks. The mobile app's ActionModal, bottom sheets,
 * SegmentedControl and ListFooter, on web primitives: native <dialog> (focus
 * trap, Escape and inert background for free), buttons, IntersectionObserver.
 */
import { useEffect, useId, useRef } from 'react';

import { Icon } from '@/components/app/icon';
import { Button } from '@/components/app/ui';

// ─────────────────────────── Dialog / sheet ───────────────────────────

/**
 * A modal that is a centred dialog on desktop and a bottom sheet on phones
 * (app.css). Controlled: `open` drives showModal()/close().
 */
export function Dialog({
  open,
  onClose,
  title,
  description,
  children,
  footer,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: React.ReactNode;
  children?: React.ReactNode;
  /** Pinned under the scrolling body — the sheet's actions. */
  footer?: React.ReactNode;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (open && !el.open) el.showModal();
    if (!open && el.open) el.close();
  }, [open]);

  return (
    <dialog
      ref={ref}
      className="hl-dialog"
      aria-labelledby={titleId}
      onClose={onClose}
      // A click on the backdrop lands on the <dialog> itself, never its content.
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      {open && (
        <div className="flex max-h-[inherit] flex-col">
          <div className="flex items-start gap-3 border-b border-[var(--rule)] px-5 py-4">
            <div className="min-w-0 flex-1">
              <h2 id={titleId} className="!text-[18px]">
                {title}
              </h2>
              {description && <p className="mt-1 text-[14px] text-[var(--muted)]">{description}</p>}
            </div>
            <button
              type="button"
              onClick={onClose}
              className="-mr-2 grid size-9 shrink-0 place-items-center rounded text-[var(--muted)] hover:bg-[var(--band)]"
              aria-label="Close"
            >
              <Icon name="close" size={18} />
            </button>
          </div>
          {children && <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">{children}</div>}
          {footer && <div className="flex flex-col-reverse gap-2 border-t border-[var(--rule)] px-5 py-3.5 sm:flex-row sm:justify-end">{footer}</div>}
        </div>
      )}
    </dialog>
  );
}

/** "Are you sure?" with one clear consequence sentence and two buttons. */
export function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title,
  description,
  confirmLabel,
  loading,
  danger,
  error,
  children,
}: {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description?: React.ReactNode;
  confirmLabel: string;
  loading?: boolean;
  danger?: boolean;
  error?: string | null;
  children?: React.ReactNode;
}) {
  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={title}
      description={description}
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button variant={danger ? 'danger' : 'primary'} onClick={onConfirm} loading={loading}>
            {confirmLabel}
          </Button>
        </>
      }
    >
      {children || error ? (
        <div className="space-y-3">
          {children}
          {error && (
            <p role="alert" className="text-[14px] text-[var(--bad)]">
              {error}
            </p>
          )}
        </div>
      ) : null}
    </Dialog>
  );
}

// ─────────────────────────── Segmented control ───────────────────────────

/** Tabs over one list: "Open 3 · Active 1 · Done 12". */
export function Segmented<T extends string>({
  value,
  onChange,
  options,
  label,
}: {
  value: T;
  onChange: (next: T) => void;
  options: { value: T; label: string; count?: number }[];
  label: string;
}) {
  return (
    <div role="tablist" aria-label={label} className="flex gap-1 overflow-x-auto border-b border-[var(--rule)]">
      {options.map((o) => {
        const active = o.value === value;
        return (
          <button
            key={o.value}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(o.value)}
            className={`-mb-px flex h-11 shrink-0 items-center gap-2 border-b-2 px-3 text-[14.5px] font-medium transition-colors duration-150 ${
              active ? 'border-[var(--teal)] text-[var(--navy)]' : 'border-transparent text-[var(--muted)] hover:text-[var(--ink)]'
            }`}
          >
            {o.label}
            {o.count != null && (
              <span
                className={`figure min-w-6 rounded-full px-1.5 text-center text-[12px] leading-5 ${
                  active ? 'bg-[var(--navy)] text-white' : 'bg-[var(--band-deep)] text-[var(--ink)]'
                }`}
              >
                {o.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

// ─────────────────────────── Infinite lists ───────────────────────────

/**
 * The end of a paginated list: loads the next page as it scrolls into view
 * (mobile's FlatList onEndReached), with a button as the fallback.
 */
export function LoadMore({
  hasMore,
  loading,
  onLoad,
}: {
  hasMore: boolean;
  loading: boolean;
  onLoad: () => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const onLoadRef = useRef(onLoad);
  useEffect(() => {
    onLoadRef.current = onLoad;
  }, [onLoad]);

  useEffect(() => {
    const el = ref.current;
    if (!el || !hasMore) return;
    const io = new IntersectionObserver((entries) => entries[0]?.isIntersecting && onLoadRef.current(), {
      rootMargin: '400px 0px',
    });
    io.observe(el);
    return () => io.disconnect();
  }, [hasMore]);

  if (!hasMore) return null;
  return (
    <div ref={ref} className="flex justify-center border-t border-[var(--rule)] py-3">
      <Button variant="quiet" onClick={onLoad} loading={loading}>
        {loading ? 'Loading' : 'Show more'}
      </Button>
    </div>
  );
}
