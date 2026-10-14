import type { Metadata } from 'next';

import { MessagesFrame } from './messages-frame';

export const metadata: Metadata = { title: 'Messages' };

export default function MessagesLayout({ children }: { children: React.ReactNode }) {
  return <MessagesFrame>{children}</MessagesFrame>;
}
