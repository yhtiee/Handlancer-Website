'use client';

/**
 * Set or change the 4-digit transfer PIN. Ported from mobile
 * components/wallet/transfer-pin-screen.tsx. The PIN is never stored in the
 * browser and never compared here — set_transfer_pin hashes it in Postgres.
 */
import { useRouter } from 'next/navigation';
import { useState } from 'react';

import { SuccessDialog } from '@/components/app/escrow';
import { ForgotPinLink, PinInput, PinRules } from '@/components/app/pin-fields';
import { Button, ErrorNote, Note, PageHeader, Section } from '@/components/app/ui';
import { pinProblem } from '@/lib/app/domain/pin-rules';
import { routes } from '@/lib/app/domain/routes';
import { useSetTransferPin, useWalletSecurity } from '@/lib/app/queries/use-wallet-security';

export function PinForm() {
  const router = useRouter();
  const { data: security } = useWalletSecurity();
  const savePin = useSetTransferPin();
  const changing = Boolean(security?.hasPin);

  const [currentPin, setCurrentPin] = useState('');
  const [pin, setPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (changing && currentPin.length !== 4) return setError('Enter your current PIN');
    const problem = pinProblem(pin);
    if (problem) return setError(problem);
    if (pin !== confirmPin) return setError('The two PINs do not match');
    try {
      await savePin.mutateAsync({ pin, currentPin: changing ? currentPin : undefined });
      setDone(true);
    } catch (e) {
      setError(e instanceof Error && e.message ? e.message : 'Could not save your PIN. Please try again.');
    }
  }

  return (
    <form onSubmit={submit} noValidate className="mx-auto max-w-[560px]">
      <PageHeader back={{ href: routes.wallet(), label: 'Wallet' }} title={changing ? 'Change PIN' : 'Set a transfer PIN'} />
      <div className="space-y-6">
        <Note icon="lock-closed">
          You will be asked for it every time money leaves your wallet. It is stored encrypted on our servers — we cannot see it, and it is never kept on this device. Five wrong tries locks withdrawals for 15 minutes.
        </Note>
        <Section title="Your PIN">
          <div className="space-y-5">
            {changing && <PinInput id="current" label="Current PIN" value={currentPin} onChange={setCurrentPin} after={<ForgotPinLink />} />}
            <PinInput id="new" label={changing ? 'New PIN' : 'Choose a PIN'} value={pin} onChange={setPin} />
            <PinInput id="confirm" label="Confirm PIN" value={confirmPin} onChange={setConfirmPin} />
            <PinRules pin={pin} confirm={confirmPin} />
          </div>
        </Section>
        <ErrorNote>{error}</ErrorNote>
        <div className="flex justify-end">
          <Button type="submit" size="lg" icon="lock-closed" loading={savePin.isPending}>
            {changing ? 'Update PIN' : 'Set PIN'}
          </Button>
        </div>
      </div>
      <SuccessDialog
        open={done}
        onClose={() => {
          setDone(false);
          router.back();
        }}
        title={changing ? 'PIN updated' : 'PIN set'}
        message="You will be asked for this PIN on every withdrawal."
      />
    </form>
  );
}
