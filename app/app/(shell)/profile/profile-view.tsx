'use client';

/**
 * Profile hub. Ported from mobile components/profile-screen.tsx: who you are,
 * then one menu to everything about your account. On desktop the sidebar
 * already holds most of these; on phones this is where the avatar leads.
 */
import Link from 'next/link';

import { Icon, type IconName } from '@/components/app/icon';
import { Avatar, Button, Rating } from '@/components/app/ui';
import { useAuth } from '@/lib/app/auth';
import { routes } from '@/lib/app/domain/routes';
import { useUnreadCount } from '@/lib/app/queries/use-notifications';

export function ProfileView() {
  const { profile, signOut } = useAuth();
  const unread = useUnreadCount();
  const provider = profile?.role === 'provider';

  const items: { href: string; icon: IconName; label: string; badge?: number }[] = [
    { href: routes.profileNotifications(), icon: 'notifications', label: 'Notifications', badge: unread },
    { href: routes.profileEdit(), icon: 'create', label: 'Edit profile' },
    ...(provider ? [{ href: routes.profileReviews, icon: 'star' as IconName, label: 'My reviews' }] : []),
    ...(provider ? [{ href: routes.providerQuotes, icon: 'document-text' as IconName, label: 'My quotes' }] : []),
    { href: routes.wallet(), icon: 'wallet', label: 'Wallet' },
    { href: routes.profileSettings(), icon: 'settings', label: 'Settings' },
    { href: routes.profileSupport(), icon: 'help-circle', label: 'Help & support' },
  ];

  return (
    <div className="mx-auto max-w-[560px] space-y-6">
      <header className="enter flex flex-col items-center gap-2 pt-2 text-center">
        <Avatar src={profile?.avatar_url} name={profile?.name} size={88} />
        <h1 className="mt-2">{profile?.name ?? 'Your name'}</h1>
        <p className="label">{provider ? 'Artisan' : 'Client'}</p>
        {provider && <Rating value={profile?.rating ?? 0} />}
        {provider && profile && (
          <Link href={routes.providerProfile(profile.id)} className="ulink mt-1 text-[14px]">
            See your public profile
          </Link>
        )}
      </header>

      <nav className="card enter overflow-hidden" aria-label="Account">
        <ul className="divide-y divide-[var(--rule)]">
          {items.map((it) => (
            <li key={it.href}>
              <Link href={it.href} className="flex items-center gap-3 px-4 py-3.5 hover:bg-[var(--band)]">
                <span className="grid size-9 place-items-center rounded-full bg-[var(--band)] text-[var(--navy)]">
                  <Icon name={it.icon} size={17} />
                </span>
                <span className="flex-1 font-medium text-[var(--ink)]">{it.label}</span>
                {it.badge ? (
                  <span className="figure min-w-6 rounded-full bg-[var(--bad)] px-1.5 text-center text-[12px] font-semibold leading-5 text-white">
                    {it.badge > 99 ? '99+' : it.badge}
                  </span>
                ) : null}
                <Icon name="chevron-forward" size={16} className="text-[var(--muted)]" />
              </Link>
            </li>
          ))}
        </ul>
      </nav>

      <Button variant="ghost" icon="log-out" block onClick={() => void signOut()}>
        Sign out
      </Button>
    </div>
  );
}
