import type { Match, Player } from './types';

export const DAY = 864e5;
export const HOUR = 36e5;
export const NB = 'nb-NO';

export const ascii = (s: string) =>
  s
    .replace(/æ/g, 'ae')
    .replace(/ø/g, 'o')
    .replace(/å/g, 'a')
    .replace(/Æ/g, 'AE')
    .replace(/Ø/g, 'O')
    .replace(/Å/g, 'A');

const z2 = (n: number) => String(n).padStart(2, '0');
export const iso = (d: Date) => d.getFullYear() + '-' + z2(d.getMonth() + 1) + '-' + z2(d.getDate());

export const fmtDay = (i: string) =>
  new Date(i + 'T12:00').toLocaleDateString(NB, { weekday: 'short', day: 'numeric', month: 'short' });
export const fmtLong = (i: string) =>
  new Date(i + 'T12:00').toLocaleDateString(NB, { weekday: 'long', day: 'numeric', month: 'long' });
export const fmtDate = (t: number) =>
  new Date(t).toLocaleDateString(NB, { day: 'numeric', month: 'short', year: 'numeric' });
export const fmtShort = (t: number) => new Date(t).toLocaleDateString(NB, { day: 'numeric', month: 'short' });
export const fmtToday = () =>
  new Date().toLocaleDateString(NB, { day: 'numeric', month: 'long', year: 'numeric' });

/** "Nå", "5 min siden", "3 t siden", "I går", else a short date. */
export const rel = (t: number) => {
  const s = (Date.now() - t) / 1000;
  if (s < 60) return 'Nå';
  if (s < 3600) return Math.floor(s / 60) + ' min siden';
  if (s < 86400) return Math.floor(s / 3600) + ' t siden';
  if (s < 172800) return 'I går';
  return fmtShort(t);
};

export const matchTime = (m: Match) => new Date(m.date + 'T' + (m.time || '12:00')).getTime();
export const isPlayed = (m: Match) => matchTime(m) < Date.now();

export const initials = (n: string) =>
  (n || '')
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((x) => x[0])
    .join('')
    .toUpperCase();
export const firstName = (n: string) => (n || '').split(' ')[0];

export const inviteCode = (p: Player) =>
  ascii(firstName(p.name)).toUpperCase() + '-' + (4821 + ((parseInt(p.id.replace(/\D/g, ''), 10) * 137) % 5000));

/** Kroner with up to two decimals. */
export const krd = (n: number) =>
  (Math.round(n * 100) / 100).toLocaleString(NB, { maximumFractionDigits: 2 }) + ' kr';

export const fmtAcct = (v: string) => {
  const n = String(v).replace(/\D/g, '');
  return n.slice(0, 4) + '.' + n.slice(4, 6) + (n.length > 6 ? '.' + n.slice(6) : '');
};

/** Norwegian account number check (MOD11). */
export const validAcct = (n: string) => {
  if (n.length !== 11) return false;
  const w = [5, 4, 3, 2, 7, 6, 5, 4, 3, 2];
  let sum = 0;
  for (let i = 0; i < 10; i++) sum += w[i] * +n[i];
  let r = 11 - (sum % 11);
  if (r === 11) r = 0;
  return r !== 10 && r === +n[10];
};

export const addMonths = (t: number, n: number) => {
  const d = new Date(t);
  d.setMonth(d.getMonth() + n);
  return d.getTime();
};

/** First monthly anniversary of `start` that is still in the future. */
export const nextMonthly = (start: number) => {
  let k = 1;
  while (addMonths(start, k) <= Date.now() && k < 240) k++;
  return addMonths(start, k);
};

/** Formatted next charge date (or end of access) for a subscription that started at `start`. */
export const nextChargeText = (start: number | null) => fmtDate(nextMonthly(start ?? Date.now()));

/** Striped placeholder used for demo photos without a real image. */
export const stripe = (h: number, dark: boolean) =>
  dark
    ? `repeating-linear-gradient(135deg,hsl(${h} 10% 20%) 0 10px,hsl(${h} 10% 17%) 10px 20px)`
    : `repeating-linear-gradient(135deg,hsl(${h} 14% 91%) 0 10px,hsl(${h} 12% 87%) 10px 20px)`;

export const isEmail = (s: string) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(s);

export function resizeImage(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => {
      const img = new Image();
      img.onload = () => {
        const max = 1100;
        const sc = Math.min(1, max / Math.max(img.width, img.height));
        const c = document.createElement('canvas');
        c.width = Math.round(img.width * sc);
        c.height = Math.round(img.height * sc);
        c.getContext('2d')!.drawImage(img, 0, 0, c.width, c.height);
        resolve(c.toDataURL('image/jpeg', 0.74));
      };
      img.onerror = reject;
      img.src = r.result as string;
    };
    r.onerror = reject;
    r.readAsDataURL(file);
  });
}

export function download(name: string, text: string, type: string) {
  try {
    const url = URL.createObjectURL(new Blob([text], { type }));
    const a = document.createElement('a');
    a.href = url;
    a.download = name;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 2000);
  } catch {}
}

export function copyText(text: string, done: () => void) {
  try {
    navigator.clipboard.writeText(text).then(done, done);
  } catch {
    done();
  }
}
