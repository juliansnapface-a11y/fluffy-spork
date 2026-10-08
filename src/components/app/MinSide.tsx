'use client';

import { useState, type FormEvent, type ReactNode } from 'react';
import { CKEYS, ROLE_SWITCHER, TYPES } from '@/lib/seed';
import { firstName, fmtShort, initials, inviteLink, nextChargeText, rel, stripe } from '@/lib/format';
import { codes, coachName, matchTitle, playerMap, priceText, teamName } from '@/lib/selectors';
import { useStore } from '@/lib/store';
import { disablePush, enablePush, needsHomeScreen, updatePushPrefs } from '@/lib/push';
import type { Consent, Player } from '@/lib/types';
import { Icon, SwitchRow } from '../ui';
import { MediaView } from '../MediaView';

export const METHOD_NAMES = (last4: string) => ({
  card: 'Kort •••• ' + (last4 || '4242'),
  apple: 'Apple Pay',
  google: 'Google Pay',
  vipps: 'Vipps',
});


function Section({ title, aside, children }: { title: ReactNode; aside?: ReactNode; children: ReactNode }) {
  return (
    <section className="section">
      {aside ? (
        <div className="section-head">
          <h2 className="h2">{title}</h2>
          {aside}
        </div>
      ) : (
        <h2 className="h2">{title}</h2>
      )}
      {children}
    </section>
  );
}

function ValueRow({ label, value, ink }: { label: string; value: ReactNode; ink?: string }) {
  return (
    <div className="row">
      <span className="row-label">{label}</span>
      <span className="row-value" style={ink ? { color: ink } : undefined}>
        {value}
      </span>
    </div>
  );
}

function ConsentRows({ consent }: { consent: Consent | null | undefined }) {
  return (
    <div className="list" style={{ marginTop: 4 }}>
      {CKEYS.map(([k, label]) => {
        const on = !!consent?.[k];
        return (
          <div key={k} className="row">
            <span className="row-label">{label}</span>
            <span style={{ font: '600 15px var(--body)', color: on ? 'var(--ok)' : 'var(--muted)' }}>{on ? 'Ja' : 'Nei'}</span>
          </div>
        );
      })}
    </div>
  );
}

function InviteLinkBox({ link }: { link: string }) {
  const copied = useStore((s) => s.copied);
  const copyInvite = useStore((s) => s.copyInvite);
  return (
    <div className="linkbox">
      <span className="linkbox-url">{link.replace(/^https?:\/\//, '')}</span>
      <button type="button" className="link-btn" style={{ padding: '0 8px' }} onClick={() => copyInvite(link)}>
        {copied ? 'Kopiert' : 'Kopier'}
      </button>
    </div>
  );
}

export function MinSide() {
  const st = useStore();
  const { data, role, prof, theme } = st;
  const P = playerMap(data.players);
  const child = role === 'parent' ? P[prof.parent.childId || ''] : undefined;
  const me = role === 'player' ? P[prof.player.playerId || ''] : undefined;
  const via = role === 'sub' ? P[prof.sub.viaId || ''] : undefined;
  const team = teamName(st);

  const name =
    role === 'coach' ? coachName(st) : role === 'player' ? me?.name || 'Spiller' : role === 'parent' ? child?.parent.name || 'Foresatt' : prof.sub.name || 'Abonnent';
  const subtitle =
    role === 'coach'
      ? 'Trener · ' + team
      : role === 'player'
        ? 'Spiller · ' + team
        : role === 'parent'
          ? 'Foresatt til ' + (child?.name || '')
          : 'Du følger laget via ' + (via ? via.name : 'en spiller');

  return (
    <>
      <header className="app-header">
        <div className="app-title" style={{ flex: 1, minWidth: 0 }}>
          Min side
        </div>
        <button type="button" className="icon-btn" aria-label="Bytt mellom lys og mørk modus" onClick={st.toggleTheme}>
          <Icon name={theme === 'dark' ? 'light_mode' : 'dark_mode'} />
        </button>
      </header>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '16px 0', borderBottom: '1px solid var(--line)' }}>
        <span
          style={{
            width: 44,
            height: 44,
            flex: 'none',
            borderRadius: '50%',
            background: 'var(--accent)',
            color: 'var(--on-accent)',
            display: 'grid',
            placeItems: 'center',
            font: '600 15px var(--body)',
          }}
        >
          {initials(name)}
        </span>
        <div style={{ minWidth: 0 }}>
          <div style={{ font: '600 17px/1.3 var(--body)' }}>{name}</div>
          <div className="row-sub">{subtitle}</div>
        </div>
      </div>

      {role === 'coach' && <CoachSections />}
      {role === 'sub' && <SubSections />}
      {role === 'player' && me && <PlayerSections me={me} />}
      {role === 'parent' && child && <ParentSections child={child} />}

      <PushSection />

      <div className="list" style={{ marginTop: 28 }}>
        <SwitchRow label="Mørk modus" on={theme === 'dark'} onToggle={st.toggleTheme} />
      </div>
      <button type="button" className="btn btn-secondary btn-block" style={{ marginTop: 24 }} onClick={st.logout}>
        Logg ut
      </button>
      {ROLE_SWITCHER && (
        <div style={{ display: 'flex', justifyContent: 'center', gap: 24, marginTop: 8 }}>
          {role === 'coach' && (
            <button type="button" className="link-btn quiet" onClick={st.resetDemo}>
              Last inn eksempeldata
            </button>
          )}
          <button type="button" className="link-btn quiet" onClick={st.switchRole}>
            Bytt rolle
          </button>
        </div>
      )}
    </>
  );
}

function CoachSections() {
  const st = useStore();
  const C = codes(st);
  const players = [...st.data.players].sort((a, b) => (a.num || 0) - (b.num || 0));
  const shown = st.allPlayers ? players : players.slice(0, 8);
  const count = players.length === 1 ? '1 spiller' : players.length + ' spillere';
  const add = (e: FormEvent) => {
    e.preventDefault();
    st.addPlayer();
  };
  const codeRows = [
    { key: 'coach', label: 'Trenerkode', code: C.coach, hint: 'Kun for trenere. Andre trenere logger inn med denne.', copyLabel: 'Trenerkoden' },
    { key: 'team', label: 'Lagkode', code: C.team, hint: 'For spillere, foresatte og abonnenter.', copyLabel: 'Lagkoden' },
  ];
  return (
    <>
      <Section title="Lagets koder">
        <div>
          {codeRows.map((c) => (
            <div key={c.key} className="row" style={{ alignItems: 'flex-start', padding: '12px 0' }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div className="row-meta">{c.label}</div>
                <div style={{ marginTop: 2, font: '600 17px var(--body)', letterSpacing: '.04em' }}>{c.code}</div>
                <div className="row-meta" style={{ marginTop: 2, lineHeight: 1.4 }}>
                  {c.hint}
                </div>
              </div>
              <button type="button" className="link-btn" onClick={() => st.copyCode(c.code, c.copyLabel)}>
                Kopier
              </button>
            </div>
          ))}
        </div>
      </Section>
      <Section title="Spillerne på laget" aside={<span className="note">{count}</span>}>
        <p className="note">Alle spillere må godkjenne at det tas bilder av dem før de kan være med i bildestrømmen.</p>
        <form onSubmit={add} style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) auto', gap: 8, marginTop: 4 }}>
          <input
            className="input"
            value={st.pf.name}
            onChange={(e) => useStore.setState((s) => ({ pf: { ...s.pf, name: e.target.value, err: '' } }))}
            placeholder="Fornavn og etternavn"
            aria-label="Spillerens navn"
            autoComplete="off"
          />
          <button type="submit" className="btn btn-primary">
            Legg til
          </button>
        </form>
        {st.pf.err && (
          <p role="alert" className="error">
            {st.pf.err}
          </p>
        )}
        {players.length > 0 && (
          <>
            <div className="list" style={{ marginTop: 4 }}>
              {shown.map((p) => (
                <div key={p.id} className="row" style={{ padding: '4px 0' }}>
                  <span style={{ flex: 1, minWidth: 0, font: '400 16px var(--body)' }}>{p.name}</span>
                  <button type="button" className="link-btn quiet" onClick={() => st.removePlayer(p.id)}>
                    Fjern
                  </button>
                </div>
              ))}
            </div>
            {players.length > 8 && (
              <button type="button" className="link-btn start" onClick={() => useStore.setState({ allPlayers: !st.allPlayers })}>
                {st.allPlayers ? 'Vis færre' : 'Vis alle ' + players.length}
              </button>
            )}
          </>
        )}
      </Section>
    </>
  );
}

function SubSections() {
  const st = useStore();
  const sub = st.prof.sub;
  const mine = (st.data.payments || []).filter((p) => p.subId === 'sub-' + st.uid);
  const methodText =
    METHOD_NAMES(sub.last4)[sub.method] + (sub.autoRenew === false ? ' · uten automatisk trekk' : ' · automatisk trekk');
  return (
    <>
      <Section title="Abonnement">
        <div>
          <ValueRow label="Status" value={sub.cancelled ? 'Sagt opp' : 'Aktiv'} ink={sub.cancelled ? 'var(--muted)' : 'var(--ok)'} />
          <ValueRow label="Pris" value={priceText(st) + ' / mnd'} />
          <ValueRow
            label={sub.cancelled ? 'Tilgang til' : sub.autoRenew === false ? 'Utløper' : 'Neste trekk'}
            value={nextChargeText(sub.startedAt)}
          />
          <button type="button" className="row-btn" onClick={() => st.openSheet('method')}>
            <span className="row-text">
              <span style={{ font: '400 16px var(--body)' }}>Betalingsmåte</span>
              <span className="row-sub">{methodText}</span>
            </span>
            <Icon name="chevron_right" className="chev" size={20} />
          </button>
          <button type="button" className="row-btn" onClick={() => st.openSheet('receipts')}>
            <span className="row-text">
              <span style={{ font: '400 16px var(--body)' }}>Kvitteringer</span>
              <span className="row-sub">{mine.length === 1 ? '1 kvittering' : mine.length + ' kvitteringer'}</span>
            </span>
            <Icon name="chevron_right" className="chev" size={20} />
          </button>
        </div>
      </Section>
      {sub.cancelled ? (
        <button type="button" className="btn btn-primary btn-block" style={{ marginTop: 20 }} onClick={() => st.openPay('resub')}>
          Start abonnementet igjen
        </button>
      ) : (
        <button type="button" className="link-btn start" style={{ marginTop: 12 }} onClick={st.cancelSub}>
          Si opp abonnement
        </button>
      )}
    </>
  );
}

function followText(n: number) {
  return n === 0 ? 'Ingen følger laget via deg ennå' : n === 1 ? '1 følger laget via deg' : n + ' følger laget via deg';
}

function PlayerSections({ me }: { me: Player }) {
  const st = useStore();
  const c = me.consent;
  const link = inviteLink(codes(st).team, me);
  const nVia = st.data.subs.filter((x) => x.via === me.id).length;
  const text = c
    ? 'Du har signert samtykket' + (c.adult === false ? ', og en foresatt har også signert' : '') + '. Du kan ombestemme deg når som helst.'
    : me.declined === 'parent'
      ? 'En foresatt har ikke godkjent bilder. Trenerne passer på at du ikke er med på bildene.'
      : 'Du er ikke med på bilder. Trenerne passer på at du ikke er med på bildene.';
  return (
    <>
      <Section title="Samtykke">
        <p className="note">{text}</p>
        <ConsentRows consent={c} />
        <button type="button" className="link-btn start" onClick={st.openPlayerConsent}>
          {c ? 'Endre samtykke' : 'Fyll ut samtykke'}
        </button>
      </Section>
      <Section title="Inviter familien">
        <p className="note" style={{ fontSize: 15 }}>
          Send lenken til besteforeldre og andre som vil heie. De betaler {priceText(st)} i måneden.
        </p>
        <InviteLinkBox link={link} />
        <button type="button" className="btn btn-primary btn-block" onClick={() => st.shareInvite(link)}>
          Del invitasjonslenke
        </button>
        <p className="note">{followText(nVia)}</p>
      </Section>
    </>
  );
}

function ParentSections({ child }: { child: Player }) {
  const st = useStore();
  const { data, theme } = st;
  const kf = firstName(child.name);
  const cc = child.consent;
  const nOn = CKEYS.filter(([k]) => cc?.[k]).length;
  const age = child.born ? new Date().getFullYear() - child.born : null;
  const link = inviteLink(codes(st).team, child);
  const posts = data.posts.filter((p) => p.tagged.includes(child.id)).sort((x, y) => y.ts - x.ts);
  const family = data.subs.filter((x) => x.via === child.id);
  const tooYoung = age != null && age < 13;

  return (
    <>
      <Section
        title={'Samtykke for ' + kf}
        aside={
          <span style={{ font: '600 14px var(--body)', color: cc ? 'var(--ok)' : 'var(--accent-ink)' }}>
            {!cc ? 'Ikke gitt' : nOn === 4 ? 'Gitt' : 'Delvis'}
          </span>
        }
      >
        <ConsentRows consent={cc} />
        {cc ? (
          <div className="btn-pair" style={{ marginTop: 8 }}>
            <button type="button" className="btn btn-secondary" onClick={st.editParentConsent}>
              Endre samtykke
            </button>
            <button type="button" className="btn btn-secondary" style={{ color: 'var(--accent-ink)' }} onClick={st.withdrawConsent}>
              Trekk samtykke
            </button>
          </div>
        ) : (
          <button type="button" className="btn btn-primary btn-block" style={{ marginTop: 8 }} onClick={st.editParentConsent}>
            Gi samtykke
          </button>
        )}
      </Section>

      <Section title={'Der ' + kf + ' er med'}>
        {posts.length ? (
          <div className="list">
            {posts.map((p) => {
              const m = p.media[0];
              const mt = p.matchId ? data.matches.find((x) => x.id === p.matchId) : undefined;
              return (
                <div key={p.id} className="row">
                  <span
                    style={{
                      position: 'relative',
                      width: 48,
                      height: 48,
                      flex: 'none',
                      borderRadius: 4,
                      overflow: 'hidden',
                      background: m ? stripe(m.hue ?? 20, theme === 'dark') : 'var(--surface2)',
                    }}
                  >
                    {m?.src && <MediaView src={m.src} kind={m.kind} />}
                  </span>
                  <span className="row-text">
                    <span style={{ font: '500 15px/1.3 var(--body)' }}>
                      {(TYPES[p.type] || TYPES.beskjed).label + (mt ? ' · ' + matchTitle(st, mt) : '')}
                    </span>
                    <span className="row-meta">
                      {rel(p.ts)} · {p.media.length === 1 ? '1 bilde' : p.media.length + ' bilder'}
                    </span>
                  </span>
                  <button type="button" className="link-btn" style={{ fontSize: 14 }} onClick={() => st.removeChildFromPost(p.id)}>
                    Fjern {kf}
                  </button>
                </div>
              );
            })}
          </div>
        ) : (
          <p className="note">{kf} er ikke merket i noen innlegg.</p>
        )}
      </Section>

      <Section title="Invitasjonslenke">
        <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={'https://api.qrserver.com/v1/create-qr-code/?size=240x240&margin=0&data=' + encodeURIComponent(link)}
            alt="QR-kode for invitasjonslenken"
            width={112}
            height={112}
            style={{ flex: 'none', width: 112, height: 112, padding: 6, background: '#fff', border: '1px solid var(--line)', borderRadius: 4 }}
          />
          <p className="note">Besteforeldre kan skanne koden, eller du kan sende lenken. Bare de med lenken kommer inn.</p>
        </div>
        <InviteLinkBox link={link} />
        <button type="button" className="btn btn-secondary" onClick={() => st.shareInvite(link)}>
          Del lenken
        </button>
      </Section>

      <Section title="Familiens krets">
        {family.length ? (
          <div className="list">
            {family.map((x) => (
              <div key={x.id} className="row">
                <span className="row-text">
                  <span style={{ font: '500 16px var(--body)' }}>{x.name}</span>
                  <span className="row-meta">
                    {(x.rel ? x.rel + ' · ' : '') + 'siden ' + fmtShort(x.since)}
                  </span>
                </span>
                <button type="button" className="link-btn quiet" onClick={() => st.removeSub(x.id)}>
                  Fjern
                </button>
              </div>
            ))}
          </div>
        ) : (
          <p className="note">Ingen abonnerer via {kf} ennå. Del lenken over.</p>
        )}
      </Section>

      <div style={{ marginTop: 16 }}>
        <SwitchRow
          label={kf + ' logger inn selv'}
          sub={tooYoung ? 'Kan slås på fra 13 år' : 'Får egen innlogging og ser bildene der ' + kf + ' er med'}
          on={child.selfLogin}
          disabled={tooYoung}
          onToggle={() => st.updPlayer(child.id, { selfLogin: !child.selfLogin })}
        />
      </div>

      {!st.prof.parent.subscribed && (
        <Section title="Følg hele laget">
          <p className="note" style={{ fontSize: 15 }}>
            Se alle innlegg fra {teamName(st)}, ikke bare der {kf} er med. {priceText(st)} i måneden.
          </p>
          <button type="button" className="btn btn-primary" style={{ alignSelf: 'flex-start', marginTop: 4 }} onClick={() => st.openPay('parent')}>
            Abonner
          </button>
        </Section>
      )}
    </>
  );
}

const PUSH_MSG: Record<string, string> = {
  denied: 'Varsler er blokkert. Slå dem på for denne siden i innstillingene til nettleseren.',
  unsupported: 'Denne nettleseren støtter ikke varsler.',
  error: 'Fikk ikke slått på varsler. Prøv igjen.',
};

/** Push notifications on this phone, and which kinds to get. */
function PushSection() {
  const st = useStore();
  const [busy, setBusy] = useState(false);
  const team = st.team;
  const on = !!st.pushOn;
  const nf = st.prof.sub.notify || { posts: true, matches: true, results: true };
  const homeScreen = needsHomeScreen();
  if (!team) return null;

  const toggle = async () => {
    if (busy) return;
    setBusy(true);
    if (on) {
      await disablePush();
      useStore.setState({ pushOn: false });
      st.toast('Varsler er slått av på denne enheten');
    } else {
      const res = await enablePush(team.id, nf);
      if (res === 'ok') {
        useStore.setState({ pushOn: true });
        st.toast('Varsler er slått på');
      } else if (res !== 'homescreen') st.toast(PUSH_MSG[res]);
    }
    setBusy(false);
  };
  const setPref = (k: keyof typeof nf) => () => {
    const next = { ...nf, [k]: !nf[k] };
    st.setProf('sub', { notify: next });
    void updatePushPrefs(team.id, next);
  };

  return (
    <Section title="Varsler">
      {homeScreen ? (
        <p className="note">
          På iPhone må appen ligge på Hjem-skjermen for å få varsler. Trykk på Del-knappen i Safari, velg «Legg til på Hjem-skjerm», og åpne
          appen derfra.
        </p>
      ) : (
        <div>
          <SwitchRow label="Varsler på denne mobilen" sub="Du får beskjed når treneren legger ut noe" on={on} onToggle={toggle} disabled={busy} />
          {on && (
            <>
              <SwitchRow label="Nye innlegg" sub="Bilder, video og beskjeder" on={nf.posts} onToggle={setPref('posts')} />
              <SwitchRow label="Kamper" sub="Når en ny kamp blir lagt inn" on={nf.matches} onToggle={setPref('matches')} />
              <SwitchRow label="Resultater" sub="Når et resultat er lagt inn" on={nf.results} onToggle={setPref('results')} />
            </>
          )}
        </div>
      )}
    </Section>
  );
}
