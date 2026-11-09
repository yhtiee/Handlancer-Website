/**
 * Flutterwave's fees, shown before anyone commits. The server has the final say:
 * flutterwave-init sets the charge from the same rate (keep them in step with
 * supabase/functions/_shared/flutterwave.ts in the mobile repo), and
 * flutterwave-payout asks Flutterwave for the transfer fee itself.
 */

/** Local collections cost 2%, and Flutterwave adds 7.5% VAT on its fee. */
const COLLECTION_RATE = 0.02 * 1.075;
const VAT = 1.075;

/** Leaves enough after the fee for Flutterwave's ₦100 minimum transfer. */
export const MIN_WITHDRAWAL = 150;

/** What a top-up costs so that `credit` lands in the wallet. */
export function topUpCharge(credit: number): number {
  return Math.ceil(credit / (1 - COLLECTION_RATE));
}

/** Flutterwave's flat fee for sending this much to a Nigerian bank, with VAT. */
export function transferFee(amount: number): number {
  const base = amount <= 5000 ? 10 : amount <= 50000 ? 25 : 50;
  return Math.round(base * VAT * 100) / 100;
}
