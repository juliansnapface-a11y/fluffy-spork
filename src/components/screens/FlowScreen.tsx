'use client';

import type { FormEvent } from 'react';
import { NB } from '@/lib/format';
import { ROLES } from '@/lib/seed';
import { useStore } from '@/lib/store';
import type { Screen } from '@/lib/types';
import { Checkbox, ChevronRow, Field, Icon, TopBar } from '../ui';

const STEP_LABELS: Partial<Record<Screen, string>> = {
  playerKind: 'Velg rolle',
  coachChoice: 'Velg rolle',
  teamCode: 'Steg 1 av 3',
  pickPlayer: 'Steg 2 av 3',
  invite: 'Steg 1 av 3',
  terms: 'Steg 2 av 3',
  coachCode: 'Trener · Logg inn',
  createTeam: 'Trener · Opprett lag',
};

const BUTTONS: Partial<Record<Screen, string>> = {
  login: 'Send kode',
  otp: 'Fortsett',
  teamCode: 'Finn laget',
  pickPlayer: 'Fortsett',
  invite: 'Finn laget',
  terms: 'Gå til betaling',
  coachCode: 'Fortsett',
  createTeam: 'Opprett lag',
};

const upper = (v: string) => v.toUpperCase();
const codeChars = (v: string) =>
  v
    .toUpperCase()
    .replace(/[^A-Z0-9ÆØÅ-]/g, '')
    .slice(0, 20);

export function FlowScreen() {
  const screen = useStore((s) => s.screen);
  const flow = useStore((s) => s.flow);
  const back = useStore((s) => s.back);
  const flowSubmit = useStore((s) => s.flowSubmit);

  const label =
    screen === 'login' || screen === 'otp' ? (flow.role ? ROLES[flow.role] : '') + ' · Logg inn' : STEP_LABELS[screen] || '';
  const btn = BUTTONS[screen];
  const dim =
    !!flow.busy ||
    (screen === 'otp' && flow.otp.length < 6) ||
    (screen === 'pickPlayer' && !flow.pickId) ||
    (screen === 'terms' && (!flow.terms || !flow.inviteVia));

  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (!flow.busy) flowSubmit();
  };

  return (
    <div className="screen">
      <TopBar label={label} onBack={back} style={{ padding: '4px 16px 0 4px' }} />
      <form
        onSubmit={submit}
        style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 16, padding: '12px 16px calc(16px + env(safe-area-inset-bottom))' }}
      >
        <FlowStep key={screen} screen={screen} />
        {flow.err && (
          <p role="alert" className="error">
            {flow.err}
          </p>
        )}
        <div className="spacer" />
        {btn && (
          <div className="sticky-action">
            <button type="submit" className={'btn btn-primary btn-block' + (dim ? ' btn-dim' : '')}>
              {flow.busy ? (screen === 'login' ? 'Sender kode …' : 'Et øyeblikk …') : btn}
            </button>
          </div>
        )}
      </form>
    </div>
  );
}

function FlowStep({ screen }: { screen: Screen }) {
  switch (screen) {
    case 'playerKind':
      return <PlayerKind />;
    case 'login':
      return <Login />;
    case 'otp':
      return <Otp />;
    case 'teamCode':
      return <TeamCode />;
    case 'pickPlayer':
      return <PickPlayer />;
    case 'invite':
      return <Invite />;
    case 'terms':
      return <Terms />;
    case 'coachChoice':
      return <CoachChoice />;
    case 'coachCode':
      return <CoachCode />;
    case 'createTeam':
      return <CreateTeam />;
    default:
      return null;
  }
}

/** Text input bound to a flow field. */
function FlowInput({
  field,
  format,
  ...rest
}: { field: 'contact' | 'teamCode' | 'invite' | 'coachCode' | 'coachName' | 'teamName' | 'newCoachCode' | 'newTeamCode' | 'search' | 'subName'; format?: (v: string) => string } & Omit<
  React.InputHTMLAttributes<HTMLInputElement>,
  'value' | 'onChange'
>) {
  const value = useStore((s) => s.flow[field] ?? '');
  const setFlow = useStore((s) => s.setFlow);
  return (
    <input
      className="input"
      value={value}
      onChange={(e) => setFlow({ [field]: format ? format(e.target.value) : e.target.value, err: '' })}
      {...rest}
    />
  );
}


function Intro({ title, text }: { title: string; text: string }) {
  return (
    <>
      <h1 className="h1">{title}</h1>
      <p className="lead">{text}</p>
    </>
  );
}

function PlayerKind() {
  const choose = useStore((s) => s.choosePlayerKind);
  return (
    <>
      <Intro title="Hvem er du?" text="Alle spillere må godkjenne samtykket selv. Er du under 15 år, må en foresatt også signere." />
      <div className="list" style={{ marginTop: 8 }}>
        <ChevronRow title="Jeg er spiller (over 15 år)" sub="Du signerer samtykket selv" onClick={() => choose(true)} />
        <ChevronRow title="Jeg er spiller (under 15 år)" sub="Du og en foresatt signerer samtykket" onClick={() => choose(false)} />
      </div>
    </>
  );
}

function Login() {
  return (
    <>
      <Intro title="Logg inn" text="Vi sender en kode til e-posten din. Ingen passord å huske." />
      <Field label="E-post">
        <FlowInput field="contact" type="email" inputMode="email" autoFocus autoComplete="email" placeholder="navn@epost.no" />
      </Field>
    </>
  );
}

function Otp() {
  const contact = useStore((s) => s.flow.contact);
  const otp = useStore((s) => s.flow.otp);
  const setOtp = useStore((s) => s.setOtp);
  const resendCode = useStore((s) => s.resendCode);
  const active = Math.min(otp.length, 5);
  return (
    <>
      <Intro title="Skriv inn koden" text={`Vi sendte en kode med 6 sifre til ${contact}.`} />
      <div style={{ position: 'relative' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6,1fr)', gap: 6 }}>
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <div
              key={i}
              className="tnum"
              style={{
                height: 56,
                border: '1px solid ' + (i === active ? 'var(--accent-ink)' : 'var(--line-strong)'),
                borderRadius: 6,
                display: 'grid',
                placeItems: 'center',
                font: '600 24px var(--body)',
              }}
            >
              {otp[i] || ''}
            </div>
          ))}
        </div>
        <input
          value={otp}
          onChange={(e) => setOtp(e.target.value)}
          autoFocus
          inputMode="numeric"
          autoComplete="one-time-code"
          aria-label="Engangskode"
          maxLength={6}
          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', opacity: 0.01, border: 'none', fontSize: 16, cursor: 'text' }}
        />
      </div>
      <p className="note">Finner du ikke e-posten? Se i søppelpost eller reklame.</p>
      <button type="button" className="link-btn start" onClick={() => void resendCode()}>
        Send ny kode
      </button>
    </>
  );
}

function TeamCode() {
  return (
    <>
      <Intro title="Lagkode" text="Lagkoden får du av treneren." />
      <Field label="Lagkode">
        <FlowInput field="teamCode" format={upper} autoFocus autoCapitalize="characters" placeholder="F.eks. SOLBERG12" />
      </Field>
    </>
  );
}

function PickPlayer() {
  const flow = useStore((s) => s.flow);
  const players = flow.peek?.players || [];
  const name = flow.peek?.teamName || '';
  const setFlow = useStore((s) => s.setFlow);
  const q = flow.search.trim().toLowerCase();
  const list = players.filter((p) => !q || p.name.toLowerCase().includes(q)).sort((a, b) => a.name.localeCompare(b.name, NB));
  return (
    <>
      <h1 className="h1">{flow.role === 'parent' ? 'Hvem er barnet ditt?' : 'Hvem er du?'}</h1>
      <p className="note">
        {name} · {players.length} spillere
      </p>
      <FlowInput field="search" placeholder="Søk etter navn" aria-label="Søk etter spiller" />
      <div className="bleed list">
        {list.map((p) => {
          const on = flow.pickId === p.id;
          return (
            <button
              key={p.id}
              type="button"
              className="row-btn"
              onClick={() => setFlow({ pickId: p.id, err: '' })}
              style={{ minHeight: 52, padding: '8px 16px', background: on ? 'var(--accent-soft)' : 'var(--surface)' }}
            >
              <span style={{ flex: 1, font: '500 16px var(--body)' }}>{p.name}</span>
              {on && <Icon name="check_circle" style={{ color: 'var(--accent-ink)' }} />}
            </button>
          );
        })}
      </div>
      {list.length === 0 && <p className="note">Fant ingen med det navnet.</p>}
    </>
  );
}

function Invite() {
  return (
    <>
      <Intro title="Lagkode" text="Lagkoden får du av en spiller på laget eller av treneren." />
      <Field label="Lagkode">
        <FlowInput field="invite" format={upper} autoFocus autoCapitalize="characters" placeholder="F.eks. SOLBERG12" />
      </Field>
    </>
  );
}

function Terms() {
  const flow = useStore((s) => s.flow);
  const players = flow.peek?.players || [];
  const name = flow.peek?.teamName || '';
  const setFlow = useStore((s) => s.setFlow);
  const sorted = [...players].sort((a, b) => a.name.localeCompare(b.name, NB));
  return (
    <>
      <p style={{ margin: 0, font: '500 14px var(--body)', color: 'var(--ok)' }}>Lagkode godkjent · {name}</p>
      <h1 className="h1">Før du starter</h1>
      <Field label="Ditt navn" hint="Treneren og familien ser navnet ditt i lista over dem som følger laget.">
        <FlowInput field="subName" autoComplete="name" placeholder="Fornavn og etternavn" />
      </Field>
      <Field label="Hvem ble du vervet av?" hint="Spilleren som inviterte deg. Du ser fortsatt hele laget.">
        <select className="input" value={flow.inviteVia || ''} onChange={(e) => setFlow({ inviteVia: e.target.value || null, err: '' })}>
          <option value="">Velg spiller …</option>
          {sorted.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>
      </Field>
      <div style={{ padding: '16px 0', borderTop: '1px solid var(--line)', borderBottom: '1px solid var(--line)', display: 'flex', flexDirection: 'column', gap: 8 }}>
        <p style={{ margin: 0, font: '600 19px/1.35 var(--display)', textWrap: 'pretty' }}>
          Bildene er bare for deg. Ikke del eller legg ut bilder av barna andre steder.
        </p>
        <p className="note">Foresatte har gitt samtykke til at du kan se bildene i InnerCircle, ikke til at de spres videre.</p>
      </div>
      <Checkbox checked={flow.terms} onToggle={() => setFlow({ terms: !flow.terms, err: '' })}>
        Jeg forstår og godtar vilkårene
      </Checkbox>
    </>
  );
}

function CoachChoice() {
  const choose = useStore((s) => s.chooseCoachMode);
  return (
    <>
      <Intro title="Trener" text="Er laget allerede på InnerCircle? Logg inn med trenerkoden. Ellers oppretter du laget her." />
      <div className="list" style={{ marginTop: 8 }}>
        <ChevronRow title="Logg inn" sub="Jeg har en trenerkode" onClick={() => choose('join')} />
        <ChevronRow title="Opprett lag" sub="Laget er ikke på InnerCircle ennå" onClick={() => choose('create')} />
      </div>
    </>
  );
}

function CoachNameField() {
  return (
    <Field label="Ditt navn" hint="Vises på innleggene du legger ut.">
      <FlowInput field="coachName" autoComplete="name" placeholder="Fornavn og etternavn" />
    </Field>
  );
}

function CoachCode() {
  return (
    <>
      <Intro title="Trenerkode" text="Trenerkoden får du av en annen trener på laget." />
      <CoachNameField />
      <Field label="Trenerkode">
        <FlowInput field="coachCode" format={upper} autoFocus autoCapitalize="characters" placeholder="F.eks. SOLBERG-TRENER" />
      </Field>
    </>
  );
}

function CreateTeam() {
  const suggest = useStore((s) => s.suggestCodes);
  return (
    <>
      <Intro title="Opprett lag" text="Navnet vises øverst i bildestrømmen for alle som følger laget." />
      <CoachNameField />
      <Field label="Lagets navn">
        <FlowInput field="teamName" autoFocus placeholder="F.eks. Solberg IL G12" />
      </Field>
      <Field label="Trenerkode" hint="Bare for trenere. Del den med de andre trenerne, så kan de logge inn.">
        <FlowInput field="newCoachCode" format={codeChars} autoCapitalize="characters" placeholder="F.eks. SOLBERG-TRENER" />
      </Field>
      <Field label="Lagkode" hint="For spillere, foresatte og abonnenter.">
        <FlowInput field="newTeamCode" format={codeChars} autoCapitalize="characters" placeholder="F.eks. SOLBERG12" />
      </Field>
      <button type="button" className="link-btn start" onClick={suggest}>
        Lag forslag til koder
      </button>
    </>
  );
}
