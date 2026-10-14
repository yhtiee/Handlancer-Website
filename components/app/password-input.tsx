'use client';

import { useState } from 'react';

import { Icon } from '@/components/app/icon';

/**
 * A password field with a show/hide toggle. The toggle is a real button with
 * a state-describing label, sits inside the field, and never submits the form.
 */
export function PasswordInput({
  id,
  value,
  onChange,
  autoComplete,
  placeholder,
  invalid,
}: {
  id: string;
  value: string;
  onChange: (value: string) => void;
  autoComplete: 'current-password' | 'new-password';
  placeholder?: string;
  invalid?: boolean;
}) {
  const [visible, setVisible] = useState(false);
  return (
    <div className="relative">
      <input
        id={id}
        className="input !h-12 pr-12"
        type={visible ? 'text' : 'password'}
        autoComplete={autoComplete}
        autoCapitalize="none"
        autoCorrect="off"
        spellCheck={false}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        aria-invalid={invalid || undefined}
      />
      <button
        type="button"
        onClick={() => setVisible((v) => !v)}
        aria-label={visible ? 'Hide password' : 'Show password'}
        aria-pressed={visible}
        aria-controls={id}
        className="absolute right-1 top-1/2 grid size-10 -translate-y-1/2 place-items-center rounded-md text-[var(--muted)] hover:bg-[var(--band)] hover:text-[var(--ink)]"
      >
        <Icon name={visible ? 'eye-off' : 'eye'} size={19} />
      </button>
    </div>
  );
}
