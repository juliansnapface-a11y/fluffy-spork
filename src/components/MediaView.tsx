'use client';

import { useEffect, useState, type CSSProperties } from 'react';
import { cachedMediaUrl, mediaUrl } from '@/lib/supabase';

/** Resolves a stored media reference (private file, URL or data URL) to a loadable link. */
export function useMediaUrl(src: string | undefined) {
  const [resolved, setResolved] = useState<{ src: string; url: string | null } | null>(null);
  useEffect(() => {
    if (!src || cachedMediaUrl(src)) return;
    let live = true;
    void mediaUrl(src).then((url) => {
      if (live) setResolved({ src, url });
    });
    return () => {
      live = false;
    };
  }, [src]);
  if (!src) return null;
  return cachedMediaUrl(src) ?? (resolved?.src === src ? resolved.url : null);
}

/**
 * A photo or video. In lists, videos show their first frame (the play badge is drawn by the caller);
 * with `controls` they play inline.
 */
export function MediaView({
  src,
  kind,
  fit = 'cover',
  controls,
  autoPlay,
  style,
}: {
  src: string;
  kind: 'photo' | 'video';
  fit?: 'cover' | 'contain';
  controls?: boolean;
  autoPlay?: boolean;
  style?: CSSProperties;
}) {
  const url = useMediaUrl(src);
  if (!url) return null;
  const css: CSSProperties = { position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: fit, ...style };
  if (kind === 'video')
    return <video src={controls ? url : url + '#t=0.1'} style={css} controls={controls} autoPlay={autoPlay} playsInline muted={!controls} preload="metadata" />;
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={url} alt="" style={css} />;
}
