'use client';

import Link, { useLinkStatus } from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect } from 'react';

import { BrandLogo } from '@/components/admin/brand-logo';
import { AppBell, AppTopBar } from '@/components/app/app-topbar';
import { ApplicationBanner } from '@/components/app/application-banner';
import { Icon, type IconName } from '@/components/app/icon';
import { InstallPrompt, OfflineBanner } from '@/components/app/pwa';
import { Avatar } from '@/components/app/ui';
import { useAuth } from '@/lib/app/auth';
import { announce } from '@/lib/app/notify';
import { mustApply } from '@/lib/app/domain/artisan-status';
import { formatMoney } from '@/lib/app/domain/money';
import { routes } from '@/lib/app/domain/routes';
import { useNotificationsRealtime, useUnreadCount } from '@/lib/app/queries/use-notifications';
import { useRealtimeSync } from '@/lib/app/queries/use-realtime-sync';
import { useWallet } from '@/lib/app/queries/use-wallet';

type NavItem = {
  href: string;
  label: string;
  icon: IconName;
  /** Other paths that belong to this section (e.g. a provider's quotes under Jobs). */
  also?: string[];
};

/*
 * Five destinations per role, the same on every screen size: the mobile app's
 * tabs plus Wallet, which the web promotes because money is what people check.
 * Profile, settings and notifications live behind the avatar and the bell.
 */
const CLIENT_NAV: NavItem[] = [
  { href: '/app', label: 'Home', icon: 'home' },
  { href: '/app/jobs', label: 'My jobs', icon: 'briefcase' },
  { href: '/app/providers', label: 'Artisans', icon: 'people' },
  { href: '/app/messages', label: 'Messages', icon: 'chatbubbles' },
  { href: '/app/wallet', label: 'Wallet', icon: 'wallet' },
];

const PROVIDER_NAV: NavItem[] = [
  { href: '/app', label: 'Home', icon: 'home' },
  { href: '/app/find-work', label: 'Find work', icon: 'search' },
  { href: '/app/jobs', label: 'My jobs', icon: 'briefcase', also: ['/app/quotes'] },
  { href: '/app/messages', label: 'Messages', icon: 'chatbubbles' },
  { href: '/app/wallet', label: 'Wallet', icon: 'wallet' },
];

function isActive(pathname: string, item: NavItem) {
  if (item.href === '/app') return pathname === '/app';
  return [item.href, ...(item.also ?? [])].some((h) => pathname === h || pathname.startsWith(`${h}/`));
}

/**
 * The signed-in frame. Waits for the session and profile, sends a signed-in
 * person with no profile to onboarding, and mounts the app-wide realtime
 * subscriptions exactly once (mobile mounts them in PushRegistrar).
 */
export function AppShell({ children }: { children: React.ReactNode }) {
  const { loading, session, profile } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (loading) return;
    if (!session) router.replace(`${routes.signIn}?next=${encodeURIComponent(pathname)}`);
    else if (!profile) router.replace(routes.onboarding);
    // Artisans can't use the app until their application is in.
    else if (mustApply(profile)) router.replace(routes.apply);
  }, [loading, session, profile, router, pathname]);

  if (loading || !session || !profile || mustApply(profile)) return <ShellSkeleton />;
  return <SignedInShell>{children}</SignedInShell>;
}

function SignedInShell({ children }: { children: React.ReactNode }) {
  const { profile } = useAuth();
  const pathname = usePathname();
  const nav = profile?.role === 'provider' ? PROVIDER_NAV : CLIENT_NAV;

  useRealtimeSync();
  // New rows also raise a system notification while the page is in the background.
  useNotificationsRealtime(announce);

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-[var(--sidebar-w)] flex-col border-r border-[var(--rule)] bg-[var(--paper)] lg:flex">
        <div className="flex h-[70px] shrink-0 items-center border-b border-[var(--rule)] px-5">
          <Brand />
        </div>

        {profile?.role !== 'provider' && (
          <div className="px-3 pt-4">
            <Link href={routes.postJob} className="btn btn-primary !h-11 w-full">
              <Icon name="add" size={18} />
              Post a job
            </Link>
          </div>
        )}

        <nav className="flex-1 overflow-y-auto px-3 py-4" aria-label="Main">
          <ul className="space-y-0.5">
            {nav.map((item) => (
              <li key={item.href}>
                <SideLink item={item} active={isActive(pathname, item)} />
              </li>
            ))}
          </ul>
          <ul className="mt-4 space-y-0.5 border-t border-[var(--rule)] pt-4">
            <li>
              <NotificationsSideLink active={pathname.startsWith('/app/notifications')} />
            </li>
            <li>
              <SideLink
                item={{ href: routes.profileSupport(), label: 'Help & support', icon: 'help-circle' }}
                active={pathname.startsWith('/app/support')}
              />
            </li>
          </ul>
        </nav>

        <SidebarFooter />
      </aside>

      {/* Phone top bar */}
      <header className="hl-topbar sticky top-0 z-30 flex items-center gap-2 border-b border-[var(--rule)] bg-[var(--paper)] px-4 lg:hidden">
        <Brand />
        <div className="ml-auto flex items-center gap-1">
          <AppBell />
          <Link href={routes.profile} aria-label="Your profile" className="grid size-10 place-items-center rounded-full">
            <Avatar src={profile?.avatar_url} name={profile?.name} size={30} />
          </Link>
        </div>
      </header>

      <OfflineBanner />

      <main className="hl-main lg:pl-[var(--sidebar-w)]">
        <AppTopBar />
        <div className="mx-auto w-full max-w-[1120px] px-4 py-5 md:px-8 md:py-8">
          <ApplicationBanner />
          <InstallPrompt />
          {children}
        </div>
      </main>

      {/* Phone tab bar */}
      <nav
        aria-label="Main"
        className="hl-tabbar fixed inset-x-0 bottom-0 z-30 border-t border-[var(--rule)] bg-[var(--paper)] lg:hidden"
      >
        <ul className="mx-auto grid h-[var(--tabbar-h)] max-w-[560px] grid-cols-5">
          {nav.map((item) => {
            const active = isActive(pathname, item);
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  aria-current={active ? 'page' : undefined}
                  className={`relative flex h-full flex-col items-center justify-center gap-1 text-[11.5px] font-medium ${
                    active ? 'text-[var(--navy)]' : 'text-[var(--muted)]'
                  }`}
                >
                  <span
                    aria-hidden="true"
                    className={`absolute inset-x-5 top-0 h-[2.5px] rounded-b bg-[var(--teal)] transition-opacity duration-150 ${active ? 'opacity-100' : 'opacity-0'}`}
                  />
                  <Icon name={item.icon} size={22} strokeWidth={active ? 2 : 1.7} />
                  {item.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </>
  );
}

function SideLink({ item, active, trailing }: { item: NavItem; active: boolean; trailing?: React.ReactNode }) {
  return (
    <Link
      href={item.href}
      aria-current={active ? 'page' : undefined}
      // Current row on --teal-wash, as the admin console and the escrow simulator mark "current".
      className={`flex h-10 items-center gap-3 rounded-md px-3 text-[14.5px] font-medium transition-colors duration-150 ${
        active ? 'bg-[var(--teal-wash)] text-[var(--navy)]' : 'text-[var(--muted)] hover:bg-[var(--band)] hover:text-[var(--ink)]'
      }`}
    >
      <Icon name={item.icon} size={18} />
      <span className="flex-1">{item.label}</span>
      <NavPending />
      {trailing ?? (item.href === '/app/wallet' ? <WalletFigure /> : null)}
    </Link>
  );
}

/** A teal pulse on the link just clicked while its screen loads (admin shell idiom). */
function NavPending() {
  const { pending } = useLinkStatus();
  return (
    <span
      aria-hidden="true"
      className={`size-1.5 rounded-full bg-[var(--teal)] transition-opacity duration-150 ${pending ? 'animate-pulse opacity-100' : 'opacity-0'}`}
    />
  );
}

function WalletFigure() {
  const { data: wallet } = useWallet();
  if (wallet?.balance == null) return null;
  return <span className="figure text-[12.5px] text-[var(--ink)]">{formatMoney(wallet.balance, 'NGN', true)}</span>;
}

function UnreadBadge({ count }: { count: number }) {
  if (!count) return null;
  return (
    <span className="figure min-w-5 rounded-full bg-[var(--navy)] px-1.5 text-center text-[11px] font-semibold leading-5 text-white">
      {count > 99 ? '99+' : count}
    </span>
  );
}

function NotificationsSideLink({ active }: { active: boolean }) {
  const unread = useUnreadCount();
  return (
    <SideLink
      item={{ href: routes.profileNotifications(), label: 'Notifications', icon: 'notifications' }}
      active={active}
      trailing={<UnreadBadge count={unread} />}
    />
  );
}

function SidebarFooter() {
  const { profile, signOut } = useAuth();
  return (
    <div className="shrink-0 border-t border-[var(--rule)] p-3">
      <div className="flex items-center gap-1">
        <Link href={routes.profile} className="flex min-w-0 flex-1 items-center gap-3 rounded-md px-2 py-2 hover:bg-[var(--band)]">
          <Avatar src={profile?.avatar_url} name={profile?.name} size={32} />
          <div className="min-w-0 flex-1">
            <p className="truncate text-[13.5px] font-semibold text-[var(--ink)]">{profile?.name || 'Your profile'}</p>
            <p className="label !text-[10.5px]">{profile?.role === 'provider' ? 'Artisan' : 'Client'}</p>
          </div>
        </Link>
        <Link
          href={routes.profileSettings()}
          className="grid size-9 place-items-center rounded text-[var(--muted)] hover:bg-[var(--band)] hover:text-[var(--ink)]"
          aria-label="Settings"
          title="Settings"
        >
          <Icon name="settings" size={18} />
        </Link>
        <button
          type="button"
          onClick={() => void signOut()}
          className="grid size-9 place-items-center rounded text-[var(--muted)] hover:bg-[var(--band)] hover:text-[var(--ink)]"
          aria-label="Sign out"
          title="Sign out"
        >
          <Icon name="log-out" size={18} />
        </button>
      </div>
    </div>
  );
}

export function Brand() {
  return (
    <Link href="/app" className="flex items-center gap-2.5" aria-label="HandLancer home">
      <BrandLogo height={26} priority />
      <span className="text-[18px] font-bold tracking-[-0.03em] text-[var(--navy)]">HandLancer</span>
    </Link>
  );
}

/** The frame, empty, while the session resolves — no layout jump when it lands. */
function ShellSkeleton() {
  return (
    <div aria-busy="true" aria-label="Loading HandLancer">
      <aside className="fixed inset-y-0 left-0 hidden w-[var(--sidebar-w)] border-r border-[var(--rule)] bg-[var(--paper)] lg:block">
        <div className="flex h-[70px] items-center border-b border-[var(--rule)] px-5">
          <BrandLogo height={26} priority />
        </div>
        <div className="space-y-2 p-3 pt-5">
          {Array.from({ length: 5 }, (_, i) => (
            <div key={i} className="skeleton h-9 rounded-md" />
          ))}
        </div>
      </aside>
      <div className="hl-topbar border-b border-[var(--rule)] bg-[var(--paper)] lg:hidden" />
      <main className="lg:pl-[var(--sidebar-w)]">
        <div className="mx-auto max-w-[1120px] space-y-4 px-4 py-6 md:px-8 md:py-10">
          <div className="skeleton h-8 w-56 rounded" />
          <div className="skeleton h-4 w-80 max-w-full rounded" />
          <div className="skeleton mt-6 h-40 rounded" />
        </div>
      </main>
    </div>
  );
}
