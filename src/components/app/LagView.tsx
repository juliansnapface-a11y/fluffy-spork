'use client';

import { homeAway, splitMatches, visiblePosts } from '@/lib/derive';
import { firstName, inviteLink, nextChargeText } from '@/lib/format';
import { codes, matchTitle, playerMap, priceText, teamName } from '@/lib/selectors';
import { useStore } from '@/lib/store';
import type { AppState, Player, Post } from '@/lib/types';
import { DateCol, Icon, Tabs } from '../ui';
import { PostCard } from './PostCard';

const FILTERS: [AppState['filter'], string][] = [
  ['all', 'Alle'],
  ['kamp', 'Kamp'],
  ['trening', 'Trening'],
  ['beskjed', 'Beskjed'],
];

export function Feed({ posts, P, emptyText }: { posts: Post[]; P: Record<string, Player>; emptyText: string }) {
  const sorted = [...posts].sort((a, b) => b.ts - a.ts);
  return (
    <>
      {sorted.map((p) => (
        <PostCard key={p.id} post={p} P={P} />
      ))}
      {sorted.length === 0 && (
        <p className="note" style={{ padding: '40px 0', textAlign: 'center' }}>
          {emptyText}
        </p>
      )}
    </>
  );
}

export function LagView() {
  const st = useStore();
  const { data, role, prof, filter } = st;
  const P = playerMap(data.players);
  const isCoach = role === 'coach';
  const child = role === 'parent' ? P[prof.parent.childId || ''] : undefined;
  const me = role === 'player' ? P[prof.player.playerId || ''] : undefined;
  const parentFree = role === 'parent' && !prof.parent.subscribed;
  const childFirst = child ? firstName(child.name) : 'barnet';
  const unread = data.notifs.filter((n) => n.ts > st.seenNotifsAt && !(isCoach && n.from === 'coach')).length;
  const { next } = splitMatches(data.matches);
  const price = priceText(st);

  let list = visiblePosts(st, data.posts, P);
  if (filter !== 'all') list = list.filter((p) => p.type === filter);

  const nVia = me ? data.subs.filter((x) => x.via === me.id).length : 0;
  const followText = nVia === 0 ? 'Ingen følger laget via deg ennå' : nVia === 1 ? '1 følger laget via deg' : nVia + ' følger laget via deg';

  return (
    <>
      <header className="app-header">
        <div style={{ flex: 1, minWidth: 0 }}>
          <div className="app-title" style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {teamName(st)}
          </div>
          <div className="app-subtitle">Lukket strøm · kun for inviterte</div>
        </div>
        <button type="button" className="icon-btn" aria-label="Varsler" style={{ position: 'relative' }} onClick={() => st.openSheet('notifs')}>
          <Icon name="notifications" size={24} />
          {unread > 0 && (
            <span
              style={{
                position: 'absolute',
                top: 8,
                right: 8,
                minWidth: 16,
                height: 16,
                padding: '0 4px',
                borderRadius: 8,
                background: 'var(--accent)',
                color: 'var(--on-accent)',
                font: '700 10px/16px var(--body)',
                textAlign: 'center',
              }}
            >
              {unread}
            </span>
          )}
        </button>
      </header>

      {isCoach && data.players.length === 0 && (
        <button type="button" className="row-btn" style={{ padding: '14px 0' }} onClick={() => st.setTab('min')}>
          <span className="row-text">
            <span style={{ font: '600 16px var(--body)', color: 'var(--accent-ink)' }}>Legg inn spillerne</span>
            <span className="row-sub">Skriv inn alle på laget under Min side.</span>
          </span>
          <Icon name="arrow_forward" size={20} style={{ color: 'var(--accent-ink)' }} />
        </button>
      )}

      {next && (
        <button
          type="button"
          onClick={st.goKamper}
          className="bleed"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 14,
            padding: '12px 16px',
            border: 'none',
            borderBottom: '1px solid var(--line)',
            background: 'var(--surface2)',
            color: 'var(--ink)',
            textAlign: 'left',
            cursor: 'pointer',
          }}
        >
          <DateCol date={next.date} accent />
          <span className="row-text" style={{ gap: 1 }}>
            <span style={{ font: '500 13px var(--body)', color: 'var(--muted)' }}>Neste kamp · {homeAway(next)}</span>
            <span style={{ font: '600 17px/1.25 var(--body)' }}>{matchTitle(st, next)}</span>
            <span style={{ font: '400 14px var(--body)', color: 'var(--muted)' }}>
              {next.time} · {next.venue}
            </span>
          </span>
          <Icon name="chevron_right" style={{ color: 'var(--muted)' }} />
        </button>
      )}

      {role === 'sub' && (
        <p className="note" style={{ padding: '12px 0', borderBottom: '1px solid var(--line)' }}>
          {prof.sub.cancelled
            ? `Abonnementet er sagt opp. Du ser bildene til ${nextChargeText(prof.sub.startedAt)}.`
            : `Du støtter laget med ${price} i måneden. Takk for at du heier!`}
        </p>
      )}

      {parentFree && (
        <div style={{ padding: '16px 0', borderBottom: '1px solid var(--line)', display: 'flex', flexDirection: 'column', gap: 10 }}>
          <h2 className="h2">Følg hele laget</h2>
          <p className="note" style={{ fontSize: 15 }}>
            Nå ser du bare innlegg der {childFirst} er med. For {price} i måneden ser du alt.
          </p>
          <button type="button" className="btn btn-primary" style={{ alignSelf: 'flex-start' }} onClick={() => st.openPay('parent')}>
            Abonner
          </button>
        </div>
      )}

      {role === 'player' && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 0', borderBottom: '1px solid var(--line)' }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ font: '600 15px var(--body)' }}>Inviter familien</div>
            <div className="note" style={{ fontSize: 13 }}>
              {followText}
            </div>
          </div>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => me && st.shareInvite(inviteLink(codes(st).team, me))}
          >
            Del lenke
          </button>
        </div>
      )}

      {isCoach && (
        <button type="button" className="row-btn" style={{ padding: '12px 0' }} onClick={() => st.openComposer(null)}>
          <span
            style={{
              flex: 1,
              minHeight: 44,
              display: 'flex',
              alignItems: 'center',
              padding: '0 12px',
              border: '1px solid var(--line-strong)',
              borderRadius: 6,
              font: '400 15px var(--body)',
              color: 'var(--muted)',
            }}
          >
            + Nytt innlegg
          </span>
          <Icon name="add_photo_alternate" size={24} style={{ color: 'var(--muted)' }} />
        </button>
      )}

      <Tabs
        className="bleed"
        value={filter}
        items={FILTERS}
        onChange={st.setFilter}
        style={{ gap: 22, overflowX: 'auto', padding: '0 16px', scrollbarWidth: 'none' }}
      />

      <Feed
        posts={list}
        P={P}
        emptyText={parentFree ? 'Ingen innlegg med ' + childFirst + ' ennå.' : 'Ingen innlegg her ennå.'}
      />
    </>
  );
}
