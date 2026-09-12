// Typed opt-in Web Push lifecycle. UI integration intentionally lives elsewhere.

import { api } from './api';
import type { PushSubscriptionPayload } from './types';

export interface PushClientSupport {
  supported: boolean;
  permission: NotificationPermission | 'unsupported';
  reason: 'ready' | 'notifications_unavailable' | 'service_worker_unavailable' | 'push_unavailable';
}

export interface PushSubscriptionResult {
  subscribed: boolean;
  permission: NotificationPermission;
}

export function getPushClientSupport(): PushClientSupport {
  if (typeof globalThis.Notification === 'undefined') {
    return { supported: false, permission: 'unsupported', reason: 'notifications_unavailable' };
  }
  if (!('serviceWorker' in navigator)) {
    return {
      supported: false,
      permission: Notification.permission,
      reason: 'service_worker_unavailable',
    };
  }
  if (typeof globalThis.PushManager === 'undefined') {
    return { supported: false, permission: Notification.permission, reason: 'push_unavailable' };
  }
  return { supported: true, permission: Notification.permission, reason: 'ready' };
}

export function decodeVapidPublicKey(value: string): Uint8Array<ArrayBuffer> {
  const normalized = value.replaceAll('-', '+').replaceAll('_', '/');
  const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, '=');
  const binary = globalThis.atob(padded);
  const bytes = new Uint8Array(new ArrayBuffer(binary.length));
  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }
  return bytes;
}

function serializeSubscription(subscription: PushSubscription): PushSubscriptionPayload {
  const serialized = subscription.toJSON();
  const p256dh = serialized.keys?.p256dh;
  const auth = serialized.keys?.auth;
  if (!serialized.endpoint || !p256dh || !auth) {
    throw new Error('The browser returned an incomplete push subscription.');
  }
  return {
    endpoint: serialized.endpoint,
    expiration_time: serialized.expirationTime ?? null,
    keys: { p256dh, auth },
  };
}

async function serviceWorkerRegistration(): Promise<ServiceWorkerRegistration> {
  const existing = await navigator.serviceWorker.getRegistration('/');
  if (existing) return existing;
  return navigator.serviceWorker.register('/sw.js');
}

export async function subscribeToDailyPractice(): Promise<PushSubscriptionResult> {
  const support = getPushClientSupport();
  if (!support.supported) {
    throw new Error('Push reminders are not supported by this browser.');
  }
  const capabilities = await api.pushCapabilities();
  if (!capabilities.available || !capabilities.vapid_public_key) {
    throw new Error('Push reminders are not available from this Ivrit Sheli server.');
  }
  const permission = Notification.permission === 'default'
    ? await Notification.requestPermission()
    : Notification.permission;
  if (permission !== 'granted') {
    return { subscribed: false, permission };
  }
  const registration = await serviceWorkerRegistration();
  const current = await registration.pushManager.getSubscription();
  const subscription = current ?? await registration.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: decodeVapidPublicKey(capabilities.vapid_public_key),
  });
  await api.savePushSubscription(serializeSubscription(subscription));
  return { subscribed: true, permission };
}

export async function unsubscribeFromDailyPractice(): Promise<{
  unsubscribed: boolean;
  server_confirmed: boolean;
}> {
  const support = getPushClientSupport();
  if (!support.supported) {
    return { unsubscribed: false, server_confirmed: false };
  }
  const registration = await navigator.serviceWorker.getRegistration('/');
  const subscription = await registration?.pushManager.getSubscription();
  if (!subscription) {
    return { unsubscribed: true, server_confirmed: true };
  }
  const endpoint = subscription.endpoint;
  let unsubscribed = false;
  try {
    unsubscribed = await subscription.unsubscribe();
  } catch {
    // Continue with owner-scoped server detachment while the session is valid.
  }
  let serverConfirmed = false;
  try {
    const response = await api.deletePushSubscription(endpoint);
    serverConfirmed = response.deleted;
  } catch {
    // The server deactivates expired subscriptions; never expose the endpoint in an error.
  }
  return { unsubscribed, server_confirmed: serverConfirmed };
}
