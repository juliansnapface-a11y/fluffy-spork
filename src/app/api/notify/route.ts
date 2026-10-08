import { createClient } from '@supabase/supabase-js';
import webpush from 'web-push';
import { VAPID_PUBLIC_KEY } from '@/lib/push';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const KINDS = new Set(['posts', 'matches', 'results']);

type Target = { endpoint: string; p256dh: string; auth: string };

/**
 * Sends a push notification to everyone on a team who has switched notifications on.
 * The caller's own login is used to ask the database for the targets, and the database
 * only answers coaches of that team.
 */
export async function POST(request: Request) {
  const privateKey = process.env.VAPID_PRIVATE_KEY;
  if (!privateKey) return Response.json({ sent: 0, error: 'VAPID_PRIVATE_KEY is not set' }, { status: 501 });

  const token = (request.headers.get('authorization') || '').replace(/^Bearer\s+/i, '');
  const body = (await request.json().catch(() => null)) as { teamId?: string; kind?: string; title?: string; body?: string } | null;
  if (!token || !body?.teamId || !body.kind || !KINDS.has(body.kind)) {
    return Response.json({ error: 'bad_request' }, { status: 400 });
  }

  const db = createClient(SUPABASE_URL, SUPABASE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: { headers: { Authorization: 'Bearer ' + token } },
  });
  const { data, error } = await db.rpc('notify_targets', { p_team: body.teamId, p_kind: body.kind });
  if (error) return Response.json({ error: error.message }, { status: 403 });

  // The push services want a contact for the sender: the site's own https address works.
  const site = new URL(request.url);
  const subject = process.env.VAPID_SUBJECT || (site.protocol === 'https:' ? site.origin : 'mailto:push@' + site.hostname);
  try {
    webpush.setVapidDetails(subject, VAPID_PUBLIC_KEY, privateKey);
  } catch (e) {
    return Response.json({ sent: 0, error: String(e) }, { status: 500 });
  }
  const payload = JSON.stringify({
    title: String(body.title || 'InnerCircle').slice(0, 80),
    body: String(body.body || '').slice(0, 200),
    tag: body.kind,
    url: '/',
  });

  let sent = 0;
  await Promise.all(
    ((data as Target[]) || []).map(async (t) => {
      try {
        await webpush.sendNotification({ endpoint: t.endpoint, keys: { p256dh: t.p256dh, auth: t.auth } }, payload, { TTL: 60 * 60 * 24 });
        sent++;
      } catch (e) {
        const status = (e as { statusCode?: number }).statusCode;
        // The phone unsubscribed or the browser data was cleared.
        if (status === 404 || status === 410) await db.rpc('delete_push', { p_endpoint: t.endpoint });
      }
    }),
  );
  return Response.json({ sent });
}
