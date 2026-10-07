'use client';

import {
  hasResult,
  homeAway,
  matchPhotoCount,
  OUTCOME_COLOR,
  OUTCOME_WORD,
  outcomeOf,
  photoText,
  scoreText,
  splitMatches,
  visiblePosts,
} from '@/lib/derive';
import { fmtLong } from '@/lib/format';
import { matchTitle, playerMap } from '@/lib/selectors';
import { useStore } from '@/lib/store';
import type { Match } from '@/lib/types';
import { DateCol, Icon, SwitchRow, Tabs } from '../ui';
import { Feed } from './LagView';

function NotifyToggle({ id }: { id: string }) {
  const on = useStore((s) => !!s.notifyMatch[id]);
  const toggle = useStore((s) => s.toggleNotifyMatch);
  return (
    <div className="list">
      <SwitchRow label="Få varsel når det kommer bilder fra kampen" on={on} onToggle={() => toggle(id)} />
    </div>
  );
}

function InfoLine({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', gap: 12 }}>
      <span style={{ width: 84, flex: 'none', color: 'var(--muted)' }}>{label}</span>
      {children}
    </div>
  );
}

export function KamperView() {
  const st = useStore();
  const { data, role, kampTab } = st;
  const isCoach = role === 'coach';
  const { upcoming, past, next, later } = splitMatches(data.matches);
  const allowed = visiblePosts(st, data.posts, playerMap(data.players));

  return (
    <>
      <header className="app-header">
        <div className="app-title" style={{ flex: 1, minWidth: 0 }}>
          Kamper
        </div>
        {isCoach && (
          <button type="button" className="btn btn-secondary" style={{ marginRight: 12, padding: '0 14px' }} onClick={st.openAddMatch}>
            Legg til kamp
          </button>
        )}
      </header>
      <Tabs
        className="bleed"
        value={kampTab}
        items={[
          ['upcoming', 'Kommende'],
          ['played', 'Spilt'],
        ]}
        onChange={st.setKampTab}
      />

      {kampTab === 'upcoming' && (
        <>
          {next && <NextMatch m={next} />}
          {!upcoming.length && (
            <p className="note" style={{ padding: '40px 0', textAlign: 'center' }}>
              Ingen kommende kamper er lagt inn.
            </p>
          )}
          {later.length > 0 && (
            <section className="section">
              <h2 className="h2">Senere kamper</h2>
              <div className="list">
                {later.map((m) => (
                  <div key={m.id} className="row">
                    <DateCol date={m.date} />
                    <div className="row-text">
                      <span style={{ font: '600 16px/1.25 var(--body)' }}>{matchTitle(st, m)}</span>
                      <span className="row-sub">
                        {m.time} · {m.venue}
                      </span>
                      <span className="row-meta">
                        {homeAway(m)} · {m.kind}
                      </span>
                    </div>
                    <button
                      type="button"
                      className="icon-btn"
                      aria-label="Legg i kalender"
                      style={{ marginRight: -12, color: 'var(--accent-ink)' }}
                      onClick={() => st.addToCal(m)}
                    >
                      <Icon name="event" />
                    </button>
                  </div>
                ))}
              </div>
            </section>
          )}
        </>
      )}

      {kampTab === 'played' && (
        <>
          {!past.length && (
            <p className="note" style={{ padding: '40px 0', textAlign: 'center' }}>
              Ingen spilte kamper ennå.
            </p>
          )}
          <div>
            {past.map((m) => {
              const o = outcomeOf(m);
              return (
                <div key={m.id} style={{ borderBottom: '1px solid var(--line)' }}>
                  <button type="button" className="row-btn" style={{ borderBottom: 'none', minHeight: 72 }} onClick={() => st.openMatchView(m.id)}>
                    <DateCol date={m.date} />
                    <span className="row-text">
                      <span style={{ font: '600 16px/1.25 var(--body)' }}>{matchTitle(st, m)}</span>
                      <span className="row-sub">
                        {photoText(matchPhotoCount(allowed, m.id))} · {m.kind}
                      </span>
                    </span>
                    {o ? (
                      <>
                        <span className="tnum" style={{ font: '700 18px var(--body)' }}>
                          {scoreText(m)}
                        </span>
                        <span className="outcome" style={{ background: OUTCOME_COLOR[o] }}>
                          {o}
                        </span>
                      </>
                    ) : (
                      <span className="note">Ikke registrert</span>
                    )}
                  </button>
                  {isCoach && (
                    <div style={{ padding: '0 0 6px 56px', marginTop: -8 }}>
                      <button type="button" className="link-btn small" onClick={() => st.openResult(m.id)}>
                        {hasResult(m) ? 'Endre resultat' : 'Legg inn resultat'}
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </>
      )}
    </>
  );
}

function NextMatch({ m }: { m: Match }) {
  const st = useStore();
  return (
    <>
      <section style={{ padding: '20px 0 16px', display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div>
          <div style={{ font: '600 13px var(--body)', color: 'var(--accent-ink)' }}>Neste kamp</div>
          <h2 style={{ margin: '4px 0 0', font: '700 24px/1.15 var(--display)', letterSpacing: '-.02em' }}>{matchTitle(st, m)}</h2>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, font: '400 15px/1.4 var(--body)' }}>
          <InfoLine label="Dato">
            <span style={{ textTransform: 'capitalize' }}>{fmtLong(m.date)}</span>
          </InfoLine>
          <InfoLine label="Avspark">
            <span className="tnum">{m.time}</span>
          </InfoLine>
          {m.meet && (
            <InfoLine label="Oppmøte">
              <span className="tnum">{m.meet}</span>
            </InfoLine>
          )}
          <InfoLine label="Sted">
            <span>{m.venue}</span>
          </InfoLine>
          <InfoLine label="Type">
            <span>
              {homeAway(m)} · {m.kind}
            </span>
          </InfoLine>
        </div>
        {m.note && (
          <p style={{ margin: 0, padding: 12, borderRadius: 6, background: 'var(--surface2)', font: '400 15px/1.5 var(--body)', whiteSpace: 'pre-wrap' }}>
            {m.note}
          </p>
        )}
        <div className="btn-pair">
          <button type="button" className="btn btn-secondary" onClick={() => st.addToCal(m)}>
            Legg i kalender
          </button>
          <button type="button" className="btn btn-secondary" onClick={() => st.showMap(m)}>
            Vis kart
          </button>
        </div>
      </section>
      <NotifyToggle id={m.id} />
    </>
  );
}

export function MatchDetail({ id }: { id: string }) {
  const st = useStore();
  const m = st.data.matches.find((x) => x.id === id);
  if (!m) return null;
  const P = playerMap(st.data.players);
  const allowed = visiblePosts(st, st.data.posts, P);
  const o = outcomeOf(m);
  return (
    <>
      <header className="app-header">
        <button
          type="button"
          onClick={st.closeMatch}
          style={{
            minHeight: 48,
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            marginLeft: -8,
            padding: '0 8px',
            border: 'none',
            background: 'none',
            color: 'var(--ink)',
            font: '500 15px var(--body)',
            cursor: 'pointer',
          }}
        >
          <Icon name="arrow_back" />
          Spilte kamper
        </button>
      </header>
      <section style={{ padding: '20px 0 16px', display: 'flex', flexDirection: 'column', gap: 10 }}>
        <div className="note" style={{ fontSize: 13, textTransform: 'capitalize' }}>
          {fmtLong(m.date)} · {homeAway(m)} · {m.kind}
        </div>
        <h1 className="h1">{matchTitle(st, m)}</h1>
        {o && (
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 12 }}>
            <span className="tnum" style={{ font: '700 40px/1 var(--display)', letterSpacing: '-.02em' }}>
              {scoreText(m)}
            </span>
            <span style={{ font: '600 15px var(--body)', color: OUTCOME_COLOR[o] }}>{OUTCOME_WORD[o]}</span>
          </div>
        )}
        {m.note && <p style={{ margin: 0, font: '400 15px/1.5 var(--body)', whiteSpace: 'pre-wrap' }}>{m.note}</p>}
        <p className="note">{photoText(matchPhotoCount(allowed, m.id))} fra kampen</p>
        {st.role === 'coach' && (
          <button type="button" className="btn btn-secondary" style={{ alignSelf: 'flex-start' }} onClick={() => st.openResult(m.id)}>
            {hasResult(m) ? 'Endre resultat' : 'Legg inn resultat'}
          </button>
        )}
      </section>
      <NotifyToggle id={m.id} />
      <Feed posts={allowed.filter((p) => p.matchId === m.id)} P={P} emptyText="Ingen bilder fra denne kampen ennå." />
    </>
  );
}
