/** The pieces every transfer PIN screen shares. */
import Link from 'next/link';

import { Icon } from '@/components/app/icon';
import { Field } from '@/components/app/ui';
import { PIN_RULES } from '@/lib/app/domain/pin-rules';
import { routes } from '@/lib/app/domain/routes';

/** Sits beside the input, not in the field's hint: a wrong PIN is exactly when it's needed. */
export function ForgotPinLink() {
  return (
    <Link href={routes.walletPinForgot()} className="self-start text-[13.5px] font-semibold text-[var(--navy)] hover:underline">
      Forgot your PIN?
    </Link>
  );
}

export function PinInput({
  id,
  label,
  value,
  onChange,
  after,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
  after?: React.ReactNode;
}) {
  return (
    <Field label={label} htmlFor={id}>
      <input
        id={id}
        className="input figure !h-12 max-w-[200px] tracking-[0.5em]"
        type="password"
        inputMode="numeric"
        autoComplete="off"
        maxLength={4}
        placeholder="••••"
        value={value}
        onChange={(e) => onChange(e.target.value.replace(/[^0-9]/g, '').slice(0, 4))}
      />
      {after}
    </Field>
  );
}

type RuleState = 'idle' | 'ok' | 'bad';

function RuleRow({ label, state }: { label: string; state: RuleState }) {
  return (
    <li className={`flex items-center gap-2 text-[14px] ${state === 'bad' ? 'text-[var(--bad)]' : 'text-[var(--ink)]'}`}>
      <span className="grid size-[18px] shrink-0 place-items-center" aria-hidden="true">
        {state === 'idle' ? (
          <span className="size-1.5 rounded-full bg-[var(--rule-strong)]" />
        ) : (
          <Icon name={state === 'ok' ? 'checkmark' : 'close'} size={16} strokeWidth={2.4} className={state === 'ok' ? 'text-[var(--navy)]' : undefined} />
        )}
      </span>
      {label}
      {state !== 'idle' && <span className="sr-only">{state === 'ok' ? ' (met)' : ' (not met)'}</span>}
    </li>
  );
}

/** The rules, always on screen, ticking off once the PIN is fully typed. */
export function PinRules({ pin, confirm }: { pin: string; confirm: string }) {
  const complete = pin.length === 4;
  return (
    <div>
      <p className="mb-2 text-[14px] font-semibold text-[var(--ink)]">Your PIN must be</p>
      <ul className="space-y-1.5">
        {PIN_RULES.map((rule) => (
          <RuleRow key={rule.label} label={rule.label} state={!complete ? 'idle' : rule.passes(pin) ? 'ok' : 'bad'} />
        ))}
        <RuleRow label="The same in both boxes" state={confirm.length < 4 ? 'idle' : confirm === pin ? 'ok' : 'bad'} />
      </ul>
    </div>
  );
}
