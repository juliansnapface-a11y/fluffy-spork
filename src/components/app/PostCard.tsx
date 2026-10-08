'use client';

import { useEffect, useRef, useState } from 'react';
import { OUTCOME_COLOR, outcomeOf, scoreTitle } from '@/lib/derive';
import { firstName, initials, rel, stripe } from '@/lib/format';
import { TYPES } from '@/lib/seed';
import { useStore } from '@/lib/store';
import type { Player, Post } from '@/lib/types';
import { Icon } from '../ui';
import { MediaView } from '../MediaView';

export function PostCard({ post, P }: { post: Post; P: Record<string, Player> }) {
  const role = useStore((s) => s.role);
  const uid = useStore((s) => s.uid);
  const dark = useStore((s) => s.theme === 'dark');
  const match = useStore((s) => (post.matchId ? s.data.matches.find((m) => m.id === post.matchId) : undefined));
  const resultTitle = useStore((s) => (match && post.type === 'kamp' && outcomeOf(match) ? scoreTitle(s, match) : ''));
  const toggleLike = useStore((s) => s.toggleLike);
  const openViewer = useStore((s) => s.openViewer);
  const [pop, setPop] = useState(false);
  const popTimer = useRef<ReturnType<typeof setTimeout>>(undefined);
  useEffect(() => () => clearTimeout(popTimer.current), []);

  const outcome = resultTitle && match ? outcomeOf(match) : null;
  const liked = post.likedBy.includes(uid);
  const canEdit = role === 'coach' && post.authorId === 'coach';

  const tagged = post.tagged.map((id) => P[id]).filter(Boolean);
  const shown = tagged.filter((x) => x.consent?.name).map((x) => firstName(x.name));
  const hidden = tagged.length - shown.length;
  const tagText = tagged.length
    ? 'Med: ' + shown.join(', ') + (hidden ? (shown.length ? ' + ' : '') + hidden + (hidden === 1 ? ' spiller' : ' spillere') : '')
    : '';

  const typeLabel = (TYPES[post.type] || TYPES.beskjed).label + (match && post.type === 'kamp' && match.opp ? ' mot ' + match.opp : '');
  const many = post.media.length > 1;

  const like = () => {
    toggleLike(post.id);
    setPop(true);
    clearTimeout(popTimer.current);
    popTimer.current = setTimeout(() => setPop(false), 160);
  };

  return (
    <article style={{ padding: '16px 0 4px', borderBottom: '1px solid var(--line)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <span
          style={{
            width: 36,
            height: 36,
            flex: 'none',
            borderRadius: '50%',
            background: 'var(--surface2)',
            display: 'grid',
            placeItems: 'center',
            font: '600 13px var(--body)',
          }}
        >
          {initials(post.author)}
        </span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ font: '600 15px/1.3 var(--body)' }}>
            {post.author} <span style={{ fontWeight: 400, color: 'var(--muted)' }}>{post.authorRole}</span>
          </div>
          <div style={{ font: '400 13px/1.3 var(--body)', color: 'var(--muted)' }}>
            {typeLabel} · {rel(post.ts)}
          </div>
        </div>
        {canEdit && (
          <button
            type="button"
            className="icon-btn"
            aria-label="Valg for innlegget"
            style={{ marginRight: -12, color: 'var(--muted)' }}
            onClick={() => useStore.setState({ sheet: 'postMenu', menuPost: post.id })}
          >
            <Icon name="more_horiz" />
          </button>
        )}
      </div>

      {outcome && (
        <div className="tnum" style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 12, font: '600 16px var(--body)' }}>
          <span className="outcome" style={{ background: OUTCOME_COLOR[outcome] }}>
            {outcome}
          </span>
          <span>{resultTitle}</span>
        </div>
      )}

      {post.media.length > 0 && (
        <div
          style={{
            display: 'flex',
            gap: 2,
            overflowX: 'auto',
            scrollSnapType: 'x mandatory',
            margin: '12px -16px 0',
            scrollbarWidth: 'none',
          }}
        >
          {post.media.map((m, i) => (
            <button
              key={m.id || i}
              type="button"
              onClick={() => openViewer(post.id, i)}
              aria-label={`Åpne ${m.label || 'bilde'} i fullskjerm`}
              style={{
                position: 'relative',
                flex: '0 0 ' + (many ? '84%' : '100%'),
                aspectRatio: '4/5',
                border: 'none',
                padding: 0,
                scrollSnapAlign: 'start',
                cursor: 'zoom-in',
                background: stripe(m.hue ?? 20, dark),
                overflow: 'hidden',
              }}
            >
              {m.src ? (
                <MediaView src={m.src} kind={m.kind} />
              ) : (
                <span className="media-label">{m.label || 'bilde'}</span>
              )}
              {m.kind === 'video' && (
                <>
                  <span style={{ position: 'absolute', inset: 0, display: 'grid', placeItems: 'center' }}>
                    <span
                      style={{
                        width: 56,
                        height: 56,
                        borderRadius: '50%',
                        background: 'rgba(0,0,0,.55)',
                        color: '#fff',
                        display: 'grid',
                        placeItems: 'center',
                      }}
                    >
                      <Icon name="play_arrow" size={34} filled />
                    </span>
                  </span>
                  <span className="badge-dark" style={{ right: 8, bottom: 8 }}>
                    {m.dur}
                  </span>
                </>
              )}
              {many && (
                <span className="badge-dark" style={{ top: 8, right: 8 }}>
                  {i + 1}/{post.media.length}
                </span>
              )}
            </button>
          ))}
        </div>
      )}

      {post.text && <p style={{ margin: '12px 0 0', font: '400 16px/1.5 var(--body)', textWrap: 'pretty' }}>{post.text}</p>}
      {tagText && (
        <p className="note" style={{ marginTop: 6 }}>
          {tagText}
        </p>
      )}

      <div style={{ display: 'flex', alignItems: 'center', marginTop: 4 }}>
        <button
          type="button"
          onClick={like}
          aria-pressed={liked}
          aria-label={liked ? 'Fjern hjerte' : 'Gi hjerte'}
          className="tnum"
          style={{
            minHeight: 48,
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            marginLeft: -10,
            padding: '0 10px',
            border: 'none',
            background: 'none',
            color: liked ? 'var(--accent-ink)' : 'var(--muted)',
            font: '600 15px var(--body)',
            cursor: 'pointer',
          }}
        >
          <Icon name="favorite" size={26} filled={liked} style={{ transform: `scale(${pop ? 1.25 : 1})`, transition: 'transform .12s' }} />
          {post.likes + post.likedBy.length}
        </button>
        {post.edited && <span style={{ marginLeft: 'auto', font: '400 13px var(--body)', color: 'var(--muted)' }}>Redigert</span>}
      </div>
    </article>
  );
}
