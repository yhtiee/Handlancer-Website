/**
 * Naira formatting. On mobile this lives beside the <MoneyText> component
 * (src/components/ui/money-text.tsx); it is split out here so the ported domain
 * code can format money without importing UI.
 */

/** Compact large-number formatter: 1_400_000 → "1.4M". */
export function formatCompact(n: number): string {
  if (Math.abs(n) >= 1_000_000) return `${(n / 1_000_000).toFixed(1).replace(/\.0$/, '')}M`;
  if (Math.abs(n) >= 1_000) return `${(n / 1_000).toFixed(1).replace(/\.0$/, '')}k`;
  return String(n);
}

export function formatMoney(amount: number, currency = 'NGN', compact = false): string {
  const symbol = currency === 'NGN' ? '₦' : currency === 'USD' ? '$' : `${currency} `;
  if (compact) return `${symbol}${formatCompact(amount)}`;
  // en-NG pinned (mobile passes `undefined`): server and browser must agree, or
  // every figure is a hydration mismatch.
  return `${symbol}${amount.toLocaleString('en-NG', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
}
