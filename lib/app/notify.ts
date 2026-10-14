'use client';

/**
 * Web counterpart of the mobile PushRegistrar's local-notification fallback.
 *
 * While HandLancer is open (in a tab or installed) the realtime subscription
 * already sees every new `notifications` row. If the page is in the background
 * and the person allowed notifications, raise a system notification for it —
 * the same wording as the in-app list (lib/app/domain/notification-copy.ts).
 *
 * Remote push (arriving with the app closed) needs Web Push on the server:
 * VAPID keys, stored subscriptions and a web branch in send-push. Until then
 * this covers the app-open case, as Expo Go builds are covered on mobile.
 */
import { describeNotification } from '@/lib/app/domain/notification-copy';
import type { Notification } from '@/lib/app/services/database.types';

export type NotifyPermission = NotificationPermission | 'unsupported';

export function notifyPermission(): NotifyPermission {
  if (typeof window === 'undefined' || !('Notification' in window)) return 'unsupported';
  return Notification.permission;
}

export async function requestNotifyPermission(): Promise<NotifyPermission> {
  if (notifyPermission() === 'unsupported') return 'unsupported';
  return Notification.requestPermission();
}

/** Show a system notification for a new row, only when nobody is looking at the page. */
export async function announce(n: Notification) {
  if (notifyPermission() !== 'granted' || document.visibilityState === 'visible') return;
  const { title, body } = describeNotification(n.type, (n.payload ?? {}) as Record<string, unknown>);
  const options: NotificationOptions = {
    body,
    icon: '/icon-192.png',
    badge: '/icon-192.png',
    tag: n.id,
    data: { url: '/app/notifications' },
  };
  try {
    // Through the service worker when there is one: required on Android Chrome,
    // and its notificationclick handler focuses the app.
    const reg = await navigator.serviceWorker?.getRegistration('/app');
    if (reg) await reg.showNotification(title, options);
    else new Notification(title, options);
  } catch {
    // Notifications blocked mid-session or unsupported here: the in-app list still has it.
  }
}
