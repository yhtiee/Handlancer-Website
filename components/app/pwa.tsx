'use client';

import { usePathname } from 'next/navigation';
import { useEffect, useState, useSyncExternalStore } from 'react';

import { Icon } from '@/components/app/icon';

// ─────────────────────────── Connectivity ───────────────────────────

function subscribeOnline(cb: () => void) {
  window.addEventListener('online', cb);
  window.addEventListener('offline', cb);
  return () => {
    window.removeEventListener('online', cb);
    window.removeEventListener('offline', cb);
  };
}

/** `navigator.onLine`, live. Server and first paint assume online. */
export function useOnline() {
  return useSyncExternalStore(
    subscribeOnline,
    () => navigator.onLine,
    () => true,
  );
}

/**
 * Says so when the connection drops. Screens keep showing what they last
 * loaded (TanStack cache); money actions disable themselves via useOnline().
 */
export function OfflineBanner() {
  const online = useOnline();
  if (online) return null;
  return (
    <div
      role="status"
      className="sticky top-[calc(var(--topbar-h)+env(safe-area-inset-top))] z-20 flex items-center justify-center gap-2 bg-[var(--ink)] px-4 py-2 text-[13.5px] font-medium text-white lg:top-16 lg:pl-[calc(var(--sidebar-w)+16px)]"
    >
      <Icon name="cloud-offline" size={16} />
      You’re offline. Showing what was last loaded — payments are paused until you reconnect.
    </div>
  );
}

// ─────────────────────────── Install ───────────────────────────

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
};

const DISMISS_KEY = 'hl-install-dismissed';

function readDismissed() {
  try {
    return localStorage.getItem(DISMISS_KEY) === '1';
  } catch {
    return false;
  }
}

/**
 * "Add HandLancer to your home screen", once, on Home only. Android/desktop
 * Chrome get the real prompt; iOS Safari has none, so it gets the two-step
 * instruction. Hidden when already installed or dismissed.
 */
export function InstallPrompt() {
  const pathname = usePathname();
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null);
  const [ios, setIos] = useState(false);
  const [hidden, setHidden] = useState(true);

  useEffect(() => {
    const standalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      (navigator as Navigator & { standalone?: boolean }).standalone === true;
    if (standalone || readDismissed()) return;

    const isIos = /iphone|ipad|ipod/i.test(navigator.userAgent) && !/crios|fxios/i.test(navigator.userAgent);
    // Deferred a tick: these flip what renders after hydration, not during it.
    const t = setTimeout(() => {
      setIos(isIos);
      setHidden(!isIos);
    }, 0);

    const onPrompt = (e: Event) => {
      e.preventDefault();
      setDeferred(e as BeforeInstallPromptEvent);
      setHidden(false);
    };
    window.addEventListener('beforeinstallprompt', onPrompt);
    return () => {
      clearTimeout(t);
      window.removeEventListener('beforeinstallprompt', onPrompt);
    };
  }, []);

  if (hidden || pathname !== '/app') return null;

  const dismiss = () => {
    setHidden(true);
    try {
      localStorage.setItem(DISMISS_KEY, '1');
    } catch {
      // Private mode: it just comes back next visit.
    }
  };

  return (
    <div className="card enter mb-5 flex items-start gap-3 p-4">
      <span className="grid size-10 shrink-0 place-items-center rounded-full bg-[var(--teal-wash)] text-[var(--navy)]">
        <Icon name="phone-portrait" size={20} />
      </span>
      <div className="min-w-0 flex-1">
        <p className="font-semibold text-[var(--navy)]">Add HandLancer to your home screen</p>
        <p className="mt-0.5 text-[14px] text-[var(--muted)]">
          {ios ? (
            <>
              Tap <b className="font-semibold text-[var(--ink)]">Share</b>, then{' '}
              <b className="font-semibold text-[var(--ink)]">Add to Home Screen</b>. It opens like an app and can send you job updates.
            </>
          ) : (
            'It opens like an app, works on slow connections and can send you job updates.'
          )}
        </p>
        {deferred && (
          <button
            type="button"
            className="btn btn-primary mt-3 !h-9 !px-4 !text-[14px]"
            onClick={async () => {
              await deferred.prompt();
              await deferred.userChoice;
              setDeferred(null);
              dismiss();
            }}
          >
            Install
          </button>
        )}
      </div>
      <button
        type="button"
        onClick={dismiss}
        className="-mr-1 grid size-8 shrink-0 place-items-center rounded text-[var(--muted)] hover:bg-[var(--band)]"
        aria-label="Dismiss"
      >
        <Icon name="close" size={16} />
      </button>
    </div>
  );
}

// ─────────────────────────── Service worker ───────────────────────────

/**
 * Registers public/sw.js for the /app scope: installability, the offline
 * fallback and web push. Served from the root because a worker's scope can't
 * reach above its own folder, and '/app/' would not cover '/app' itself.
 * Production only — a caching worker in dev serves stale bundles.
 */
export function ServiceWorkerRegistrar() {
  useEffect(() => {
    if (process.env.NODE_ENV !== 'production' || !('serviceWorker' in navigator)) return;
    navigator.serviceWorker.register('/sw.js', { scope: '/app', updateViaCache: 'none' }).catch(() => {});
  }, []);
  return null;
}
