/**
 * What makes a transfer PIN acceptable, so the page can say so up front.
 * Postgres has the final word (pin_rule_problem in supabase/pin_reset.sql);
 * keep the rules and the wording in step with it.
 */

const steps = (pin: string) => Array.from(pin.slice(1), (d, i) => Number(d) - Number(pin[i]));

export const PIN_RULES: { label: string; problem: string; passes: (pin: string) => boolean }[] = [
  {
    label: 'Exactly 4 digits',
    problem: 'Your PIN must be exactly 4 digits.',
    passes: (pin) => /^[0-9]{4}$/.test(pin),
  },
  {
    label: 'Not one digit repeated, like 1111',
    problem: 'Your PIN can’t be one digit repeated, like 1111.',
    passes: (pin) => !steps(pin).every((s) => s === 0),
  },
  {
    label: 'Not digits in order, like 1234 or 4321',
    problem: 'Your PIN can’t be digits in order, like 1234 or 4321.',
    passes: (pin) => !steps(pin).every((s) => s === 1) && !steps(pin).every((s) => s === -1),
  },
];

/** Why this PIN would be refused, or null if it's fine. */
export function pinProblem(pin: string): string | null {
  return PIN_RULES.find((rule) => !rule.passes(pin))?.problem ?? null;
}
