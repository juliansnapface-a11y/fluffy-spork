import { deletePush, savePush } from './supabase';

/** Public half of the app's push key pair. The private half lives only on the server (VAPID_PRIVATE_KEY). */
export const VAPID_PUBLIC_KEY =
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || 'BISU8zfav-tY8wgWJcy5Tp8YHj2YiwoRJLasBsJuczzmjj568vMhCZd2g-ZMIsEY6I4U4Cx7pRSl0XJ-OVLcxCI';

export type PushPrefs = { posts: boolean; matches: boolean; results: boolean };

export const pushSupported = () =>
  typeof window !== 'undefined' && 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window;

/** iPhone/iPad only allow push when the app has been added to the home screen. */
export const needsHomeScreen = () => {
  if (typeof window === 'undefined') return false;
  const ios = /iphone|ipad|ipod/i.test(navigator.userAgent);
  const standalone = window.matchMedia('(display-mode: standalone)').matches || (navigator as { standalone?: boolean }).standalone;
  return ios && !standalone;
};

const keyBytes = (base64: string) => {
  const pad = '='.repeat((4 - (base64.length % 4)) % 4);
  const raw = atob((base64 + pad).replace(/-/g, '+').replace(/_/g, '/'));
  return Uint8Array.from(raw, (c) => c.charCodeAt(0));
};

export async function registerWorker() {
  if (!pushSupported()) return null;
  try {
    return await navigator.serviceWorker.register('/sw.js', { scope: '/', updateViaCache: 'none' });
  } catch {
    return null;
  }
}

export type EnableResult = 'ok' | 'denied' | 'unsupported' | 'homescreen' | 'error';

/** Asks for permission, subscribes this device and stores it for the team. */
export async function enablePush(teamId: string, prefs: PushPrefs): Promise<EnableResult> {
  if (needsHomeScreen()) return 'homescreen';
  if (!pushSupported()) return 'unsupported';
  const permission = await Notification.requestPermission();
  if (permission !== 'granted') return 'denied';
  try {
    const reg = (await registerWorker()) || (await navigator.serviceWorker.ready);
    const sub =
      (await reg.pushManager.getSubscription()) ||
      (await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: keyBytes(VAPID_PUBLIC_KEY) }));
    await savePush(teamId, sub.toJSON(), prefs);
    return 'ok';
  } catch {
    return 'error';
  }
}

/** Updates which kinds of notifications this device wants. */
export async function updatePushPrefs(teamId: string, prefs: PushPrefs) {
  if (!pushSupported()) return;
  const reg = await navigator.serviceWorker.getRegistration();
  const sub = await reg?.pushManager.getSubscription();
  if (sub) await savePush(teamId, sub.toJSON(), prefs);
}

export async function disablePush() {
  if (!pushSupported()) return;
  try {
    const reg = await navigator.serviceWorker.getRegistration();
    const sub = await reg?.pushManager.getSubscription();
    if (sub) {
      await deletePush(sub.endpoint).catch(() => {});
      await sub.unsubscribe();
    }
  } catch {}
}
