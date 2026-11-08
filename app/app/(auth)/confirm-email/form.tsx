'use client';

/**
 * Where the button in a confirmation email lands. Asks for one tap before it
 * spends the single-use token: mail scanners open links before people do, and
 * confirming on load would hand the real click an "expired" page.
 */
import { useRouter, useSearchParams } from 'next/navigation';
import { useState } from 'react';

import { Button, ButtonLink } from '@/components/app/ui';
import { routes, safeNext } from '@/lib/app/domain/routes';
import { EMAIL_LINK_TYPES, verifyEmailLink, type EmailLinkType } from '@/lib/app/services/auth';

function linkType(value: string | null): EmailLinkType | null {
  return EMAIL_LINK_TYPES.find((t) => t === value) ?? null;
}

export function ConfirmEmail() {
  const router = useRouter();
  const params = useSearchParams();
  const tokenHash = params.get('token_hash');
  const type = linkType(params.get('type'));
  const next = safeNext(params.get('next'), routes.onboarding);

  const [dead, setDead] = useState(!tokenHash || !type);
  const [loading, setLoading] = useState(false);

  async function confirm() {
    setLoading(true);
    try {
      await verifyEmailLink(tokenHash!, type!);
      router.replace(next);
    } catch {
      setDead(true);
      setLoading(false);
    }
  }

  if (dead) {
    return (
      <div className="enter">
        <h1 className="!text-[clamp(1.9rem,4vw,2.4rem)]">
          This link has <em>expired</em>
        </h1>
        <p className="lede mt-2 !text-[17px]">Links work once and last 1 hour. If your email is already confirmed, just sign in. If not, sign in and we’ll help you get a new code.</p>
        <div className="mt-7">
          <ButtonLink href={routes.signIn} size="lg" block>
            Go to sign in
          </ButtonLink>
        </div>
      </div>
    );
  }

  return (
    <div className="enter">
      <h1 className="!text-[clamp(1.9rem,4vw,2.4rem)]">
        One last <em>tap</em>
      </h1>
      <p className="lede mt-2 !text-[17px]">Confirm this email address to carry on with HandLancer.</p>
      <div className="mt-7">
        <Button size="lg" block loading={loading} onClick={() => void confirm()}>
          Confirm my email
        </Button>
      </div>
    </div>
  );
}
