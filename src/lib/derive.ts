import { isPlayed, matchTime } from './format';
import { postAllowed, shortTeam } from './selectors';
import type { AppState, Match, Player, Post } from './types';

export type Outcome = 'S' | 'U' | 'T';

export const hasResult = (m: Match) => m.us != null && m.them != null;

export const outcomeOf = (m: Match): Outcome | null =>
  !hasResult(m) ? null : m.us! > m.them! ? 'S' : m.us! < m.them! ? 'T' : 'U';

export const OUTCOME_WORD: Record<Outcome, string> = { S: 'Seier', U: 'Uavgjort', T: 'Tap' };
export const OUTCOME_COLOR: Record<Outcome, string> = { S: 'var(--win)', U: 'var(--draw)', T: 'var(--loss)' };

/** Score with the home team first. */
export const scoreText = (m: Match) => (m.home ? m.us + '–' + m.them : m.them + '–' + m.us);

export const scoreTitle = (s: Pick<AppState, 'data' | 'prof'>, m: Match) =>
  m.home ? shortTeam(s) + ' ' + m.us + '–' + m.them + ' ' + m.opp : m.opp + ' ' + m.them + '–' + m.us + ' ' + shortTeam(s);

export const homeAway = (m: Match) => (m.home ? 'Hjemme' : 'Borte');

export const photoText = (n: number) => (n === 1 ? '1 bilde' : n + ' bilder');

export function splitMatches(matches: Match[]) {
  const sorted = [...matches].sort((a, b) => matchTime(a) - matchTime(b));
  const upcoming = sorted.filter((m) => !isPlayed(m));
  const past = sorted.filter(isPlayed).reverse();
  const next = upcoming.find((m) => m.featured) || upcoming[0] || null;
  const later = upcoming.filter((m) => m !== next);
  return { upcoming, past, next, later };
}

/** Posts the current viewer may see: consent rules, plus child-only for parents without a subscription. */
export function visiblePosts(s: Pick<AppState, 'role' | 'prof'>, posts: Post[], P: Record<string, Player>) {
  let src = posts.filter((p) => postAllowed(P, p));
  if (s.role === 'parent' && !s.prof.parent.subscribed) {
    const childId = s.prof.parent.childId;
    src = src.filter((p) => !!childId && p.tagged.includes(childId));
  }
  return src;
}

export const matchPhotoCount = (allowed: Post[], matchId: string) =>
  allowed.filter((p) => p.matchId === matchId).reduce((n, p) => n + p.media.length, 0);
