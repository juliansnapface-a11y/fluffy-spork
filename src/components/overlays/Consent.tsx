'use client';

import { CKEYS, defCons } from '@/lib/seed';
import { fmtToday } from '@/lib/format';
import { teamName } from '@/lib/selectors';
import { useStore } from '@/lib/store';
import { Checkbox, KeyValues, RadioOptions, SignaturePad, SwitchRow, TopBar } from '../ui';

function Bullets({ items }: { items: string[] }) {
  return (
    <ul className="bullets">
      {items.map((t) => (
        <li key={t}>{t}</li>
      ))}
    </ul>
  );
}

/** Parent consent: four steps with a progress bar and per-item switches, all off by default. */
export function ParentConsent() {
  const st = useStore();
  const c = st.cons || defCons();
  const kid = st.data.players.find((p) => p.id === st.prof.parent.childId);
  const team = teamName(st);
  return (
    <div className="fullscreen">
      <div className="fullscreen-inner">
        <TopBar label={'Samtykke · steg ' + c.step + ' av 4'} onBack={st.consBack} />
        <div style={{ height: 3, background: 'var(--line)' }}>
          <div style={{ height: '100%', width: c.step * 25 + '%', background: 'var(--accent)', transition: 'width .2s' }} />
        </div>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 14, paddingTop: 28 }}>
          {c.step === 1 && (
            <>
              <h1 className="h1">{team} er ansvarlig for bildene.</h1>
              <p className="lead">Laget tar bildene, bestemmer hva som legges ut og sletter bilder når noen ber om det.</p>
            </>
          )}
          {c.step === 2 && (
            <>
              <h1 className="h1">Hva sier du ja til?</h1>
              <p className="lead">Alt er av til du slår det på. Du velger hver ting for seg.</p>
              <div className="list" style={{ marginTop: 4 }}>
                {CKEYS.map(([k, label, sub]) => (
                  <SwitchRow key={k} label={label} sub={sub} on={c.draft[k]} onToggle={() => st.consToggle(k)} />
                ))}
              </div>
            </>
          )}
          {c.step === 3 && (
            <>
              <h1 className="h1">Bare inviterte abonnenter av laget ser bildene. Ingenting er offentlig.</h1>
              <p className="lead">Bildene kan ikke søkes opp, og lenker virker bare for den som er logget inn.</p>
            </>
          )}
          {c.step === 4 && (
            <>
              <h1 className="h1">Du kan endre eller trekke samtykket når som helst.</h1>
              <p className="lead">Trekkes samtykket, blir innleggene skjult med en gang.</p>
              <div style={{ paddingTop: 8 }}>
                <Checkbox checked={c.check} onToggle={() => st.setCons({ check: !c.check })}>
                  Jeg er foresatt for {kid ? kid.name : 'barnet'}
                </Checkbox>
              </div>
            </>
          )}
        </div>
        <div className="sticky-action">
          {c.step < 4 ? (
            <button type="button" className="btn btn-primary btn-block" onClick={st.consNext}>
              Neste
            </button>
          ) : (
            <div className="btn-pair">
              <button type="button" className={'btn btn-primary' + (c.check ? '' : ' btn-dim')} onClick={st.consGive}>
                Gi samtykke
              </button>
              <button type="button" className="btn btn-secondary" onClick={st.consLater}>
                Ikke nå
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

const PLAYER_POINTS = [
  'Bildene vises bare for folk som er invitert av spillerne på laget, som besteforeldre og annen familie. De betaler litt hver måned for å følge laget, og pengene går til laget.',
  'Ingen bilder legges ut på åpne nettsider eller sosiale medier.',
  'Vi tar aldri bilder i garderoben eller dusjen.',
  'Sier du nei, er det helt greit. Du er like mye med på laget, og trenerne passer på at du ikke er med på bildene.',
];

const PARENT_POINTS = [
  'Bildene og videoene vises kun til personer som er invitert av spillerne på laget, for eksempel besteforeldre og annen familie. De betaler et månedlig beløp for å følge laget, og pengene går til laget.',
  'Ingen bilder eller videoer publiseres på åpne nettsider eller sosiale medier.',
  'Det tas aldri bilder i garderoben eller dusjen.',
  'Det er frivillig å samtykke. Spilleren kan si nei selv om foresatte har gitt tillatelse.',
  'Samtykket kan trekkes tilbake når som helst ved å kontakte treneren eller foreldrene. Dersom samtykket trekkes tilbake, slettes bilder og videoer av spilleren så langt det er mulig.',
];

/** Player consent. Over 15: one signed page. Under 15: part 1 for the player, part 2 for a parent. */
export function PlayerConsent() {
  const st = useStore();
  const c = st.pcons || { step: 1, p: null, ps: null, err: '' };
  const minor = !c.adult;
  const player = st.data.players.find((p) => p.id === st.prof.player.playerId);
  const meta: [string, React.ReactNode][] = [
    ['Spiller', <span key="n" style={{ fontWeight: 600 }}>{player?.name || ''}</span>],
    ['Dato', <span key="d" className="tnum">{fmtToday()}</span>],
  ];
  const last = c.step === 2 || !minor || c.p === 'no';
  const incomplete = c.step === 1 ? !c.p || (c.p === 'yes' && !c.ps) : !c.g || (c.g === 'yes' && !c.gs);
  const btn = last ? (c.step === 2 && c.g === 'yes' ? 'Send inn' : 'Fullfør') : 'Neste';

  return (
    <div className="fullscreen">
      <div className="fullscreen-inner">
        <TopBar label={minor ? 'Samtykke · del ' + c.step + ' av 2' : 'Samtykke'} onBack={st.pcBack} />
        {minor && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 4 }}>
            <span style={{ height: 3, background: 'var(--accent)' }} />
            <span style={{ height: 3, background: c.step === 2 ? 'var(--accent)' : 'var(--line)' }} />
          </div>
        )}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 18, paddingTop: 24 }}>
          {c.step === 1 && (
            <>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {minor && <span style={{ font: '600 13px var(--body)', color: 'var(--accent-ink)' }}>Del 1</span>}
                <h1 className="h1">{minor ? 'Til deg som spiller' : 'Samtykke til bilder og video'}</h1>
              </div>
              <KeyValues rows={meta} />
              <p className="body-text">
                Laget ditt bruker InnerCircle. Det er en lukket app der familie og venner kan se bilder og korte videoer fra treninger og
                kamper. Før vi tar bilder av deg og legger dem ut, spør vi deg. Du bestemmer selv.
              </p>
              <Bullets
                items={[
                  ...PLAYER_POINTS,
                  minor
                    ? 'Du kan ombestemme deg når som helst. Si fra til treneren eller foreldrene dine, så slettes bildene der du er med.'
                    : 'Du kan ombestemme deg når som helst. Si fra til treneren, så slettes bildene der du er med.',
                ]}
              />
              {minor && (
                <p className="note">
                  Skjemaet har to deler. Du fyller ut del 1, og en foresatt fyller ut del 2. Sier du nei, gjelder det selv om foresatte sier ja.
                </p>
              )}
              <div style={{ borderTop: '1px solid var(--line)', paddingTop: 18 }}>
                <RadioOptions
                  value={c.p}
                  onChange={(v) => st.setPC({ p: v })}
                  options={[
                    { value: 'yes', label: 'Ja, jeg vil gjerne være med på bilder og video' },
                    { value: 'no', label: 'Nei, jeg vil ikke være med' },
                  ]}
                />
              </div>
              {c.p === 'yes' && <SignaturePad key="p" label="Signatur, spiller" value={c.ps} onChange={(v) => st.setPC({ ps: v })} />}
            </>
          )}
          {c.step === 2 && (
            <>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <span style={{ font: '600 13px var(--body)', color: 'var(--accent-ink)' }}>Del 2</span>
                <h1 className="h1">Informasjon til foresatte</h1>
              </div>
              <KeyValues rows={meta} />
              <p className="body-text">
                Laget ditt bruker InnerCircle, en lukket app der familie og venner kan se bilder og korte videoer fra treninger og kamper. Vi
                ønsker å ta bilder og videoer av spillerne og publisere dem i appen. Før dette gjøres, trenger vi samtykke fra både spilleren og
                foresatte.
              </p>
              <Bullets items={PARENT_POINTS} />
              <p className="body-text">Vennligst les informasjonen og velg ett av alternativene nedenfor.</p>
              <div style={{ borderTop: '1px solid var(--line)', paddingTop: 18 }}>
                <RadioOptions
                  value={c.g}
                  onChange={(v) => st.setPC({ g: v })}
                  options={[
                    { value: 'yes', label: 'Ja, jeg godkjenner at barnet mitt er med på bilder og videoer' },
                    { value: 'no', label: 'Nei, jeg godkjenner ikke at barnet mitt er med på bilder og videoer' },
                  ]}
                />
              </div>
              {c.g === 'yes' && <SignaturePad key="g" label="Signatur, foresatt" value={c.gs} onChange={(v) => st.setPC({ gs: v })} />}
            </>
          )}
          {c.err && (
            <p role="alert" className="error">
              {c.err}
            </p>
          )}
        </div>
        <div className="sticky-action">
          <button type="button" className={'btn btn-primary btn-block' + (incomplete ? ' btn-dim' : '')} onClick={st.pcNext}>
            {btn}
          </button>
        </div>
      </div>
    </div>
  );
}

const COACH_RULES = [
  'Du legger bare ut portrettbilder og videoer av spillere som har gitt samtykke. Sjekk samtykkelisten i appen før du publiserer.',
  'Spillere som har sagt nei, skal ikke være med på bildene. Spillerens nei gjelder selv om foresatte har sagt ja.',
  'Det tas aldri bilder i garderoben eller dusjen, og ingen bilder der noen er skadet eller lei seg.',
  'Bildene og videoene vises kun til personer som er invitert av spillerne på laget, og du sletter stygge kommentarer.',
  'Ingen bilder eller videoer publiseres på åpne nettsider eller sosiale medier.',
  'Hvis en spiller eller foresatt trekker samtykket, sletter du bildene av spilleren snarest mulig.',
  'Når du slutter som trener, sier du fra til klubben og gir beskjed til den nye treneren om hvem som har sagt nei.',
  'Oppretter du laget, bekrefter du også at klubben har godkjent at laget bruker InnerCircle, og at samtykke er samlet inn før det første bildet legges ut.',
  'Det er klubben som er ansvarlig for bildene, men du står ansvarlig for at reglene blir fulgt på laget ditt. Brudd på reglene kan føre til at du mister tilgangen.',
];

/** Rules every coach signs, both when creating a team and when joining one. */
export function CoachConsent() {
  const st = useStore();
  const c = st.pcons || { step: 1, p: null, ps: null, err: '' };
  const name = st.flow.coachName.trim() || st.flow.contact || '';
  const team = c.mode === 'create' ? c.pending?.n || '' : teamName(st);
  const incomplete = !c.p || (c.p === 'yes' && !c.ps);
  return (
    <div className="fullscreen">
      <div className="fullscreen-inner">
        <TopBar label="Trener · Samtykke" onBack={st.ccBack} />
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 18, paddingTop: 16 }}>
          <h1 className="h1">Samtykke og ansvar for trenere</h1>
          <KeyValues
            rows={[
              ['Trener', name],
              ['Lag', team],
              ['Dato', fmtToday()],
            ]}
          />
          <p className="body-text">
            Laget ditt bruker InnerCircle, en lukket app der familie og venner kan se bilder og korte videoer fra treninger og kamper. Som trener
            eller lagleder er det du som legger ut bildene, og du står ansvarlig for at reglene under blir fulgt. Alle trenere og lagledere må
            godkjenne dette, både den som oppretter laget og alle som logger inn senere.
          </p>
          <Bullets items={COACH_RULES} />
          <p className="body-text">Vennligst les reglene og velg ett av alternativene nedenfor.</p>
          <div style={{ borderTop: '1px solid var(--line)', paddingTop: 18 }}>
            <RadioOptions
              value={c.p}
              onChange={(v) => st.setPC({ p: v })}
              options={[
                { value: 'yes', label: 'Ja, jeg godtar reglene og står ansvarlig for at de blir fulgt' },
                { value: 'no', label: 'Nei, jeg godtar ikke reglene (da får du ikke tilgang til laget)' },
              ]}
            />
          </div>
          {c.p === 'yes' && <SignaturePad label="Signatur, trener" value={c.ps} onChange={(v) => st.setPC({ ps: v })} />}
          {c.err && (
            <p role="alert" className="error">
              {c.err}
            </p>
          )}
        </div>
        <div className="sticky-action">
          <button type="button" className={'btn btn-primary btn-block' + (incomplete ? ' btn-dim' : '')} onClick={st.ccNext}>
            {c.p === 'no' ? 'Avslutt' : 'Godta og fortsett'}
          </button>
        </div>
      </div>
    </div>
  );
}
