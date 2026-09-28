'use client';

import Link, { useLinkStatus } from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useRef, useState, type ComponentType, type SVGProps } from 'react';

import {
  IconBriefcase,
  IconChart,
  IconClipboard,
  IconClose,
  IconLogout,
  IconMenu,
  IconOverview,
  IconShield,
  IconUsers,
  IconWallet,
} from '@/components/admin/icons';
import { BrandLogo } from '@/components/admin/brand-logo';
import { useBadges, usePrefetchSection, useSignOut } from '@/lib/admin/query/hooks';

type NavItem = {
  href: string;
  label: string;
  icon: ComponentType<SVGProps<SVGSVGElement>>;
  badgeKey?: 'openDisputes';
};

/** The console's sections. Add a page under app/admin/(console)/ and list it here. */
const NAV: NavItem[] = [
  { href: '/admin', label: 'Overview', icon: IconOverview },
  { href: '/admin/analytics', label: 'Analytics', icon: IconChart },
  { href: '/admin/disputes', label: 'Disputes', icon: IconShield, badgeKey: 'openDisputes' },
  { href: '/admin/jobs', label: 'Jobs', icon: IconBriefcase },
  { href: '/admin/users', label: 'Users', icon: IconUsers },
  { href: '/admin/transactions', label: 'Transactions', icon: IconWallet },
  { href: '/admin/waitlist', label: 'Waitlist', icon: IconClipboard },
];

type Props = {
  admin: { email: string; role: string };
  children: React.ReactNode;
};

export function AdminShell({ admin, children }: Props) {
  const [open, setOpen] = useState(false);
  const drawerRef = useRef<HTMLDivElement>(null);

  // Drawer: Escape closes, the page behind stops scrolling, focus moves in.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    document.addEventListener('keydown', onKey);
    const overflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    drawerRef.current?.querySelector<HTMLElement>('a, button')?.focus();
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = overflow;
    };
  }, [open]);

  return (
    <div className="admin">
      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden print:!hidden w-[var(--sidebar-w)] flex-col border-r border-[var(--rule)] bg-[var(--paper)] lg:flex">
        <SidebarContent admin={admin} />
      </aside>

      {/* Mobile top bar — solid paper and a hairline, like the marketing nav. */}
      <header className="sticky top-0 z-30 flex h-16 print:hidden items-center gap-2 border-b border-[var(--rule)] bg-[var(--paper)] px-4 lg:hidden">
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="-ml-2 grid size-10 place-items-center rounded text-[var(--navy)] hover:bg-[var(--band)]"
          aria-label="Open menu"
          aria-expanded={open}
          aria-controls="admin-drawer"
        >
          <IconMenu width={22} height={22} />
        </button>
        <Brand />
      </header>

      {/* Mobile drawer */}
      <div className={`fixed inset-0 z-40 lg:hidden print:hidden ${open ? '' : 'pointer-events-none'}`} aria-hidden={!open}>
        <div
          className={`absolute inset-0 bg-[rgba(16,21,27,0.4)] transition-opacity duration-200 ${open ? 'opacity-100' : 'opacity-0'}`}
          onClick={() => setOpen(false)}
        />
        <div
          id="admin-drawer"
          ref={drawerRef}
          role="dialog"
          aria-modal="true"
          aria-label="Admin navigation"
          inert={!open}
          className={`absolute inset-y-0 left-0 flex w-[min(85vw,var(--sidebar-w))] flex-col border-r border-[var(--rule)] bg-[var(--paper)] transition-transform duration-200 ease-out ${open ? 'translate-x-0' : '-translate-x-full'}`}
        >
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="absolute right-3 top-4 grid size-9 place-items-center rounded text-[var(--muted)] hover:bg-[var(--band)]"
            aria-label="Close menu"
          >
            <IconClose />
          </button>
          <SidebarContent admin={admin} onNavigate={() => setOpen(false)} />
        </div>
      </div>

      <main className="lg:pl-[var(--sidebar-w)] print:!pl-0">
        <div className="mx-auto w-full max-w-[1280px] px-4 py-6 md:px-8 md:py-10 print:max-w-none print:p-0">{children}</div>
      </main>
    </div>
  );
}

/**
 * A teal pulse on the link just clicked, while its page shell is on the way.
 * There is no route-level loading screen: pages stream, and anything visited
 * before renders from the TanStack cache, so this brief hint is all that shows.
 */
function NavPending() {
  const { pending } = useLinkStatus();
  return (
    <span
      aria-hidden="true"
      className={`size-1.5 rounded-full bg-[var(--teal)] transition-opacity duration-150 ${pending ? 'animate-pulse opacity-100' : 'opacity-0'}`}
    />
  );
}

/** The marketing nav's lockup (components/nav.tsx), with the console named in a mono label. */
export function Brand() {
  return (
    <Link href="/admin" className="flex items-center gap-2.5" aria-label="HandLancer admin home">
      <BrandLogo height={26} priority />
      <span className="text-[18px] font-bold tracking-[-0.03em] text-[var(--navy)]">HandLancer</span>
      <span className="label mt-0.5 !text-[10.5px]">Admin</span>
    </Link>
  );
}

function SidebarContent({ admin, onNavigate }: Omit<Props, 'children'> & { onNavigate?: () => void }) {
  const pathname = usePathname();
  const { data: badges } = useBadges();
  const prefetchSection = usePrefetchSection();
  const signOut = useSignOut();
  const isActive = (href: string) =>
    href === '/admin' ? pathname === '/admin' : pathname === href || pathname.startsWith(`${href}/`);

  return (
    <>
      <div className="flex h-[70px] shrink-0 items-center border-b border-[var(--rule)] px-5">
        <Brand />
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-4" aria-label="Admin">
        <ul className="space-y-0.5">
          {NAV.map(({ href, label, icon: Icon, badgeKey }) => {
            const active = isActive(href);
            const badge = badgeKey && badges ? badges[badgeKey] : 0;
            return (
              <li key={href}>
                <Link
                  href={href}
                  onClick={onNavigate}
                  onPointerEnter={() => prefetchSection(href)}
                  onFocus={() => prefetchSection(href)}
                  aria-current={active ? 'page' : undefined}
                  // Current row on --teal-wash, as the escrow simulator marks its current step.
                  className={`flex h-10 items-center gap-3 rounded-md px-3 text-[14.5px] font-medium transition-colors duration-200 ${
                    active
                      ? 'bg-[var(--teal-wash)] text-[var(--navy)]'
                      : 'text-[var(--muted)] hover:bg-[var(--band)] hover:text-[var(--ink)]'
                  }`}
                >
                  <Icon />
                  <span className="flex-1">{label}</span>
                  <NavPending />
                  {badge > 0 && (
                    <span
                      className="figure min-w-6 rounded-full bg-[var(--navy)] px-1.5 text-center text-[11.5px] font-semibold leading-5 text-white"
                      aria-label={`${badge} open`}
                    >
                      {badge}
                    </span>
                  )}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="shrink-0 border-t border-[var(--rule)] p-3">
        <div className="flex items-center gap-3 px-2 py-2">
          <span className="grid size-8 shrink-0 place-items-center rounded-full bg-[var(--band)] text-[13px] font-semibold uppercase text-[var(--navy)]">
            {admin.email.charAt(0) || 'A'}
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-[13px] font-medium text-[var(--ink)]">{admin.email}</p>
            <p className="label !text-[10.5px]">{admin.role}</p>
          </div>
          <button
            type="button"
            onClick={() => signOut.mutate()}
            disabled={signOut.isPending}
            className="grid size-9 place-items-center rounded text-[var(--muted)] hover:bg-[var(--band)] hover:text-[var(--ink)] disabled:opacity-50"
            aria-label="Sign out"
            title="Sign out"
          >
            <IconLogout />
          </button>
        </div>
      </div>
    </>
  );
}
