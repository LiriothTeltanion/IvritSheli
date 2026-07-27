import { afterEach, describe, expect, it, vi } from 'vitest';
import { api } from './api';
import {
  decodeVapidPublicKey,
  getPushClientSupport,
  subscribeToDailyPractice,
  unsubscribeFromDailyPractice,
} from './pushNotifications';

const originalServiceWorkerDescriptor = Object.getOwnPropertyDescriptor(navigator, 'serviceWorker');

function installNotification(permission: NotificationPermission = 'default'): void {
  const notification = {
    permission,
    requestPermission: vi.fn().mockResolvedValue('granted'),
  };
  vi.stubGlobal('Notification', notification);
  vi.stubGlobal('PushManager', class PushManagerStub {});
}

function installServiceWorker(registration: ServiceWorkerRegistration): void {
  Object.defineProperty(navigator, 'serviceWorker', {
    configurable: true,
    value: {
      getRegistration: vi.fn().mockResolvedValue(registration),
      register: vi.fn().mockResolvedValue(registration),
    },
  });
}

afterEach(() => {
  if (originalServiceWorkerDescriptor) {
    Object.defineProperty(navigator, 'serviceWorker', originalServiceWorkerDescriptor);
  } else {
    Reflect.deleteProperty(navigator, 'serviceWorker');
  }
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe('pushNotifications', () => {
  it('decodes URL-safe VAPID keys into a browser subscription key', () => {
    expect(Array.from(decodeVapidPublicKey('AQID'))).toEqual([1, 2, 3]);
  });

  it('reports unsupported clients before asking for permission', () => {
    installNotification();
    Reflect.deleteProperty(navigator, 'serviceWorker');
    expect(getPushClientSupport()).toEqual({
      supported: false,
      permission: 'default',
      reason: 'service_worker_unavailable',
    });
  });

  it('requests permission and stores only the normalized browser subscription', async () => {
    installNotification();
    const subscription = {
      endpoint: 'https://push.example/subscription-secret',
      toJSON: () => ({
        endpoint: 'https://push.example/subscription-secret',
        expirationTime: null,
        keys: { p256dh: 'public-key', auth: 'auth-secret' },
      }),
      unsubscribe: vi.fn().mockResolvedValue(true),
    } as unknown as PushSubscription;
    const pushManager = {
      getSubscription: vi.fn().mockResolvedValue(null),
      subscribe: vi.fn().mockResolvedValue(subscription),
    };
    installServiceWorker({ pushManager } as unknown as ServiceWorkerRegistration);
    vi.spyOn(api, 'pushCapabilities').mockResolvedValue({
      available: true,
      vapid_public_key: 'AQID',
    });
    const save = vi.spyOn(api, 'savePushSubscription').mockResolvedValue({ saved: true, active: true });

    await expect(subscribeToDailyPractice()).resolves.toEqual({
      subscribed: true,
      permission: 'granted',
    });
    expect(pushManager.subscribe).toHaveBeenCalledWith({
      userVisibleOnly: true,
      applicationServerKey: expect.any(Uint8Array),
    });
    expect(save).toHaveBeenCalledWith({
      endpoint: 'https://push.example/subscription-secret',
      expiration_time: null,
      keys: { p256dh: 'public-key', auth: 'auth-secret' },
    });
  });

  it('unsubscribes locally even when the server cannot confirm deletion', async () => {
    installNotification('granted');
    const subscription = {
      endpoint: 'https://push.example/private-endpoint',
      unsubscribe: vi.fn().mockResolvedValue(true),
    } as unknown as PushSubscription;
    installServiceWorker({
      pushManager: {
        getSubscription: vi.fn().mockResolvedValue(subscription),
      },
    } as unknown as ServiceWorkerRegistration);
    vi.spyOn(api, 'deletePushSubscription').mockRejectedValue(new Error('network unavailable'));

    await expect(unsubscribeFromDailyPractice()).resolves.toEqual({
      unsubscribed: true,
      server_confirmed: false,
    });
    expect(subscription.unsubscribe).toHaveBeenCalledOnce();
  });

  it('still detaches the authenticated server owner when browser unsubscribe fails', async () => {
    installNotification('granted');
    const subscription = {
      endpoint: 'https://push.example/private-endpoint',
      unsubscribe: vi.fn().mockRejectedValue(new Error('browser rejected cleanup')),
    } as unknown as PushSubscription;
    installServiceWorker({
      pushManager: {
        getSubscription: vi.fn().mockResolvedValue(subscription),
      },
    } as unknown as ServiceWorkerRegistration);
    const detach = vi.spyOn(api, 'deletePushSubscription').mockResolvedValue({
      deleted: true,
    });

    await expect(unsubscribeFromDailyPractice()).resolves.toEqual({
      unsubscribed: false,
      server_confirmed: true,
    });
    expect(detach).toHaveBeenCalledWith(
      'https://push.example/private-endpoint',
    );
  });
});
