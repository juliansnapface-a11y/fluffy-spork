import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import type { TeamData } from './types';

const URL = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const KEY = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

let client: SupabaseClient | null = null;
const db = () => {
  if (!URL || !KEY) throw new Error('Supabase er ikke satt opp (mangler NEXT_PUBLIC_SUPABASE_URL eller nøkkel).');
  if (!client) client = createClient(URL, KEY, { auth: { persistSession: false } });
  return client;
};

export type TeamRole = 'coach' | 'member';
export interface TeamPayload {
  role: TeamRole;
  version: number;
  data: TeamData;
  ok?: boolean;
}

/** Thrown when a code is already used by another team. */
export class CodeTakenError extends Error {}

async function rpc<T>(fn: string, args: Record<string, unknown>): Promise<T> {
  const { data, error } = await db().rpc(fn, args);
  if (error) {
    if (/code_taken/.test(error.message)) throw new CodeTakenError(error.message);
    throw new Error(error.message);
  }
  return data as T;
}

/** Looks up a team by team code (member) or coach code (coach). Null if no team has that code. */
export const joinTeam = (code: string) => rpc<TeamPayload | null>('join_team', { p_code: code });

export const teamVersion = (code: string) => rpc<number | null>('team_version', { p_code: code });

export const createTeam = (name: string, coachCode: string, teamCode: string, data: TeamData) =>
  rpc<TeamPayload>('create_team', { p_name: name, p_coach_code: coachCode, p_team_code: teamCode, p_data: data });

/** Saves if `version` is still current; otherwise returns ok=false and the newer document. */
export const saveTeam = (code: string, version: number, data: TeamData) =>
  rpc<TeamPayload>('save_team', { p_code: code, p_version: version, p_data: data });

const dataUrlToBlob = async (dataUrl: string) => (await fetch(dataUrl)).blob();

/** Uploads a photo or signature and returns its public URL. */
export async function uploadImage(src: string | Blob): Promise<string> {
  const blob = typeof src === 'string' ? await dataUrlToBlob(src) : src;
  const ext = blob.type === 'image/png' ? 'png' : 'jpg';
  const path = `${crypto.randomUUID()}.${ext}`;
  const bucket = db().storage.from('media');
  const { error } = await bucket.upload(path, blob, { contentType: blob.type || 'image/jpeg', cacheControl: '31536000' });
  if (error) throw new Error(error.message);
  return bucket.getPublicUrl(path).data.publicUrl;
}
