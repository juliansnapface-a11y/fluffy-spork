'use client';

import { useEffect } from 'react';
import { stripe } from '@/lib/format';
import { useStore } from '@/lib/store';
import { Icon } from '../ui';
import { MediaView } from '../MediaView';

const navBtn: React.CSSProperties = {
  position: 'absolute',
  top: '50%',
  transform: 'translateY(-50%)',
  width: 48,
  height: 48,
  border: 'none',
  borderRadius: '50%',
  background: 'rgba(0,0,0,.45)',
  color: '#fff',
  display: 'grid',
  placeItems: 'center',
  cursor: 'pointer',
};

/** Full-screen photo viewer with arrow-key and Escape support. */
export function Viewer() {
  const viewer = useStore((s) => s.viewer);
  const post = useStore((s) => (s.viewer ? s.data.posts.find((p) => p.id === s.viewer!.postId) : undefined));
  const close = useStore((s) => s.closeViewer);
  const step = useStore((s) => s.stepViewer);

  useEffect(() => {
    if (!viewer) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close();
      if (e.key === 'ArrowRight') step(1);
      if (e.key === 'ArrowLeft') step(-1);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [viewer, close, step]);

  const m = viewer && post ? post.media[viewer.i] : undefined;
  if (!viewer || !post || !m) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Bilde i fullskjerm"
      style={{ position: 'fixed', inset: 0, zIndex: 80, background: '#0c0809', display: 'flex', flexDirection: 'column', color: '#fff' }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', minHeight: 56, padding: '4px 4px 4px 16px' }}>
        <span className="tnum" style={{ font: '500 14px var(--body)' }}>
          {viewer.i + 1} av {post.media.length}
        </span>
        <button type="button" className="link-btn" style={{ color: '#fff', padding: '0 12px' }} onClick={close}>
          Lukk
        </button>
      </div>
      <div style={{ flex: 1, position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', paddingBottom: 24 }}>
        <div style={{ position: 'relative', width: '100%', maxWidth: 640, aspectRatio: '4/5', maxHeight: '100%', background: stripe(m.hue ?? 20, true) }}>
          {m.src ? (
            <MediaView key={m.src} src={m.src} kind={m.kind} fit="contain" controls autoPlay style={{ background: '#0c0809' }} />
          ) : (
            <span style={{ position: 'absolute', left: 12, bottom: 12, font: '400 12px var(--mono)', color: 'rgba(255,255,255,.7)' }}>{m.label || 'bilde'}</span>
          )}
          {m.kind === 'video' && !m.src && (
            <span style={{ position: 'absolute', inset: 0, display: 'grid', placeItems: 'center' }}>
              <span style={{ width: 72, height: 72, borderRadius: '50%', background: 'rgba(0,0,0,.55)', display: 'grid', placeItems: 'center' }}>
                <Icon name="play_arrow" size={42} filled />
              </span>
            </span>
          )}
        </div>
        {viewer.i > 0 && (
          <button type="button" aria-label="Forrige" style={{ ...navBtn, left: 4 }} onClick={() => step(-1)}>
            <Icon name="chevron_left" size={28} />
          </button>
        )}
        {viewer.i < post.media.length - 1 && (
          <button type="button" aria-label="Neste" style={{ ...navBtn, right: 4 }} onClick={() => step(1)}>
            <Icon name="chevron_right" size={28} />
          </button>
        )}
      </div>
    </div>
  );
}
