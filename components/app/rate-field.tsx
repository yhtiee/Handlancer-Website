/** A provider's starting price and what it's charged per. Onboarding and edit profile share it. */
import { Field } from '@/components/app/ui';
import { RATE_UNITS, type RateUnit } from '@/lib/app/domain/rates';

export function RateField({
  amount,
  unit,
  onAmount,
  onUnit,
}: {
  amount: string;
  unit: RateUnit;
  onAmount: (value: string) => void;
  onUnit: (unit: RateUnit) => void;
}) {
  return (
    <Field label="Starting price" htmlFor="rate" optional hint="Leave blank to price every job by quote.">
      <div className="flex gap-2">
        <div className="relative min-w-0 flex-1">
          <span className="figure pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted)]">₦</span>
          <input
            id="rate"
            className="input figure !h-11 w-full pl-7"
            inputMode="numeric"
            placeholder="3,000"
            value={amount}
            onChange={(e) => {
              const digits = e.target.value.replace(/\D/g, '');
              onAmount(digits ? Number(digits).toLocaleString('en-NG') : '');
            }}
          />
        </div>
        <select aria-label="Charged" className="input !h-11 !w-auto shrink-0" value={unit} onChange={(e) => onUnit(e.target.value as RateUnit)}>
          {RATE_UNITS.map((u) => (
            <option key={u.value} value={u.value}>
              {u.label}
            </option>
          ))}
        </select>
      </div>
    </Field>
  );
}
