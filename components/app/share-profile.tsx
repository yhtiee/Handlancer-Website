'use client';

/** An approved artisan's link to send people, from their own profile screen. */
import Link from 'next/link';
import { useEffect, useState } from 'react';

import { Icon } from '@/components/app/icon';
import { Button } from '@/components/app/ui';
import { routes } from '@/lib/app/domain/routes';
import { SITE_URL } from '@/lib/site';

const MESSAGE = 'See my work and hire me on HandLancer. Your money stays in escrow until you approve the job.';

export function ShareProfile({ providerId }: { providerId: string }) {
  const path = routes.publicProvider(providerId);
  const url = `${SITE_URL}${path}`;
  const [copied, setCopied] = useState(false);
  const [copyFailed, setCopyFailed] = useState(false);

  useEffect(() => {
    if (!copied) return;
    const timer = setTimeout(() => setCopied(false), 2500);
    return () => clearTimeout(timer);
  }, [copied]);

  async function copy() {
    setCopyFailed(false);
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
    } catch {
      setCopyFailed(true);
    }
  }

  async function share() {
    if (typeof navigator.share !== 'function') return copy();
    try {
      await navigator.share({ title: 'Hire me on HandLancer', text: MESSAGE, url });
    } catch (e) {
      // Closing the share sheet is not a failure; anything else falls back.
      if ((e as DOMException).name !== 'AbortError') await copy();
    }
  }

  return (
    <section className="card enter space-y-3 p-4">
      <div>
        <h2 className="!text-[18px]">Share your profile</h2>
        <p className="mt-1 text-[14px] text-[var(--muted)]">Send this link to anyone. They can see your work and hire you directly, even without an account.</p>
      </div>
      <p className="truncate rounded-md bg-[var(--band)] px-3 py-2.5 text-[13.5px] text-[var(--ink)]" title={url}>
        {url.replace(/^https?:\/\//, '')}
      </p>
      <div className="flex flex-wrap gap-2">
        <Button icon="send" onClick={() => void share()}>
          Share
        </Button>
        <Button variant="ghost" icon={copied ? 'checkmark' : 'copy'} onClick={() => void copy()}>
          {copied ? 'Copied' : 'Copy link'}
        </Button>
        <a className="btn btn-ghost !h-10" href={`https://wa.me/?text=${encodeURIComponent(`${MESSAGE} ${url}`)}`} target="_blank" rel="noopener noreferrer">
          <Icon name="logo-whatsapp" size={18} />
          WhatsApp
        </a>
      </div>
      {copyFailed && (
        <p role="alert" className="text-[13.5px] text-[var(--bad)]">
          Couldn’t copy it here. Press and hold the link above to copy it.
        </p>
      )}
      <p className="text-[13px] text-[var(--muted)]">
        Anyone with the link sees your name, photo, area, services, rate, rating and work photos. Never your phone number or email.{' '}
        <Link href={path} className="font-semibold text-[var(--navy)] hover:underline">
          See what they see
        </Link>
      </p>
    </section>
  );
}
