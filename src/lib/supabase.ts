import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import type { TeamData } from './types';

const URL = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const KEY = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

let client: SupabaseClient | null = null;
export const db = () => {
  if (!URL || !KEY) throw new Error('Supabase er ikke satt opp (mangler NEXT_PUBLIC_SUPABASE_URL eller nøkkel).');
  if (!client) client = createClient(URL, KEY, { auth: { persistSession: true, autoRefreshToken: true } });
  return client;
};

export type MemberRole = 'coach' | 'player' | 'parent' | 'sub';

export interface TeamPayload {
  teamId: string;
  role: MemberRole;
  version: number;
  data: TeamData;
  ok?: boolean;
}

export interface TeamPeek {
  teamId: string;
  teamName: string;
  isCoachCode: boolean;
  players: { id: string; name: string }[];
}

export interface Membership {
  teamId: string;
  role: MemberRole;
  playerId: string | null;
  teamName: string;
}

/** Thrown when a code is already used by another team. */
export class CodeTakenError extends Error {}

async function rpc<T>(fn: string, args: Record<string, unknown> = {}): Promise<T> {
  const { data, error } = await db().rpc(fn, args);
  if (error) {
    if (/code_taken/.test(error.message)) throw new CodeTakenError(error.message);
    throw new Error(error.message);
  }
  return data as T;
}

// ---------- Login ----------

/** Emails a 6-digit code. Creates the account the first time. */
export async function sendCode(email: string) {
  const { error } = await db().auth.signInWithOtp({ email, options: { shouldCreateUser: true } });
  if (error) throw new Error(error.message);
}

/** Checks the code and signs in. Returns the account id. */
export async function verifyCode(email: string, token: string): Promise<string> {
  const { data, error } = await db().auth.verifyOtp({ email, token, type: 'email' });
  if (error || !data.user) throw new Error(error?.message || 'Feil kode');
  return data.user.id;
}

export async function currentUserId(): Promise<string | null> {
  try {
    const { data } = await db().auth.getSession();
    return data.session?.user.id ?? null;
  } catch {
    return null;
  }
}

/** The signed-in account on this device, if any. */
export async function currentSession(): Promise<{ id: string; email: string } | null> {
  try {
    const { data } = await db().auth.getSession();
    const u = data.session?.user;
    return u ? { id: u.id, email: (u.email || '').toLowerCase() } : null;
  } catch {
    return null;
  }
}

export async function signOut() {
  try {
    await db().auth.signOut();
  } catch {}
}

/** The current access token, for calls to our own API routes. */
export async function accessToken(): Promise<string | null> {
  const { data } = await db().auth.getSession();
  return data.session?.access_token ?? null;
}

// ---------- Teams ----------

export const peekTeam = (code: string) => rpc<TeamPeek | null>('peek_team', { p_code: code });
export const joinTeam = (code: string, role: MemberRole, playerId: string | null) =>
  rpc<TeamPayload | null>('join_team', { p_code: code, p_role: role, p_player_id: playerId });
export const createTeam = (name: string, coachCode: string, teamCode: string, data: TeamData) =>
  rpc<TeamPayload>('create_team', { p_name: name, p_coach_code: coachCode, p_team_code: teamCode, p_data: data });
export const myTeams = () => rpc<Membership[]>('my_teams');
export const getTeam = (teamId: string, role: MemberRole) => rpc<TeamPayload>('get_team', { p_team: teamId, p_role: role });
export const teamVersion = (teamId: string) => rpc<number | null>('team_version', { p_team: teamId });

/** Saves if `version` is still current; otherwise returns ok=false and the newer document. */
export const saveTeam = (teamId: string, role: MemberRole, version: number, data: TeamData) =>
  rpc<TeamPayload>('save_team', { p_team: teamId, p_role: role, p_version: version, p_data: data });

// ---------- Photos, videos and signatures ----------

/** Files are stored privately in the team's folder. Posts keep this prefix + path. */
export const STORAGE_PREFIX = 'sb:';

const dataUrlToBlob = async (dataUrl: string) => (await fetch(dataUrl)).blob();

const EXT: Record<string, string> = {
  'image/png': 'png',
  'image/jpeg': 'jpg',
  'video/mp4': 'mp4',
  'video/quicktime': 'mov',
  'video/webm': 'webm',
};

/** Uploads to the team's private folder and returns a reference ("sb:<path>") to store in the team document. */
export async function uploadMedia(teamId: string, src: string | Blob): Promise<string> {
  const blob = typeof src === 'string' ? await dataUrlToBlob(src) : src;
  const type = blob.type || 'image/jpeg';
  const path = `${teamId}/${crypto.randomUUID()}.${EXT[type] || 'bin'}`;
  const { error } = await db().storage.from('media').upload(path, blob, { contentType: type, cacheControl: '31536000' });
  if (error) throw new Error(error.message);
  return STORAGE_PREFIX + path;
}

// Signed links last an hour; we refresh them a few minutes early.
const TTL = 3600;
const signed = new Map<string, { url: string; exp: number }>();
const waiting = new Map<string, Promise<string | null>>();
let queue: string[] = [];
let timer: ReturnType<typeof setTimeout> | null = null;
let resolvers = new Map<string, (u: string | null) => void>();

async function flushSign() {
  const paths = queue;
  const res = resolvers;
  queue = [];
  resolvers = new Map();
  timer = null;
  try {
    const { data, error } = await db().storage.from('media').createSignedUrls(paths, TTL);
    if (error) throw error;
    const exp = Date.now() + (TTL - 300) * 1000;
    for (const item of data || []) {
      if (item.path && item.signedUrl) signed.set(item.path, { url: item.signedUrl, exp });
    }
  } catch {}
  for (const p of paths) {
    waiting.delete(p);
    res.get(p)?.(signed.get(p)?.url ?? null);
  }
}

/** Turns a stored media reference into a link the browser can load. Plain URLs and data URLs pass through. */
export function mediaUrl(src: string): Promise<string | null> {
  if (!src.startsWith(STORAGE_PREFIX)) return Promise.resolve(src);
  const path = src.slice(STORAGE_PREFIX.length);
  const hit = signed.get(path);
  if (hit && hit.exp > Date.now()) return Promise.resolve(hit.url);
  const pending = waiting.get(path);
  if (pending) return pending;
  const p = new Promise<string | null>((resolve) => {
    queue.push(path);
    resolvers.set(path, resolve);
    if (!timer) timer = setTimeout(flushSign, 30);
  });
  waiting.set(path, p);
  return p;
}

/** Cached link if we already have a fresh one (lets images render without a flash). */
export function cachedMediaUrl(src: string): string | null {
  if (!src.startsWith(STORAGE_PREFIX)) return src;
  const hit = signed.get(src.slice(STORAGE_PREFIX.length));
  return hit && hit.exp > Date.now() ? hit.url : null;
}

// ---------- Push notifications ----------

export const savePush = (teamId: string, sub: PushSubscriptionJSON, prefs: Record<string, boolean>) =>
  rpc<void>('save_push', {
    p_team: teamId,
    p_endpoint: sub.endpoint,
    p_p256dh: sub.keys?.p256dh,
    p_auth: sub.keys?.auth,
    p_prefs: prefs,
  });
export const deletePush = (endpoint: string) => rpc<void>('delete_push', { p_endpoint: endpoint });
