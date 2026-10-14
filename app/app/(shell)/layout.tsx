import { AppShell } from '@/components/app/shell';

/** Every signed-in screen: sidebar on desktop, top bar + tab bar on phones. */
export default function ShellLayout({ children }: { children: React.ReactNode }) {
  return <AppShell>{children}</AppShell>;
}
