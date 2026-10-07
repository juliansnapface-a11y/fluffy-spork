'use client';

import { useEffect, type FormEvent } from 'react';
import { download, fmtAcct, fmtDate, fmtDay, fmtShort, iso, krd, matchTime, NB, rel, stripe } from '@/lib/format';
import { TYPES } from '@/lib/seed';
import { matchTitle, playerMap, price, shortTeam, teamName } from '@/lib/selectors';
import { receiptText, useStore } from '@/lib/store';
import type { PayMethod, PostType, SheetName } from '@/lib/types';
import { economy } from '../app/OkonomiView';
import { METHOD_NAMES } from '../app/MinSide';
import { Field, SwitchRow, Tabs } from '../ui';

const TITLES: Record<Exclude<SheetName, 'confirm'>, string> = {
  composer: 'Nytt innlegg',
  addMatch: 'Legg til kamp',
  result: 'Resultat',
  postMenu: 'Innlegg',
  notifs: 'Varsler',
  price: 'Pris på abonnement',
  earnings: 'Tjent denne måneden',
  payout: 'Konto for utbetaling',
  subscribers: 'Abonnenter',
  method: 'Betalingsmåte',
  receipts: 'Kvitteringer',
};

export function SheetHost() {
  const sheet = useStore((s) => s.sheet);
  const confirm = useStore((s) => s.confirm);
  const editing = useStore((s) => !!s.draft?.id);
  const closeSheet = useStore((s) => s.closeSheet);

  useEffect(() => {
    if (!sheet) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && closeSheet();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [sheet, closeSheet]);

  if (!sheet) return null;
  const title = sheet === 'confirm' ? confirm?.title || '' : sheet === 'composer' && editing ? 'Rediger innlegg' : TITLES[sheet];

  return (
    <div className="sheet-wrap">
      <button type="button" className="sheet-scrim" onClick={closeSheet} aria-label="Lukk" tabIndex={-1} />
      <div role="dialog" aria-modal="true" aria-label={title} className="sheet">
        <div className="sheet-head">
          <h2 className="sheet-title">{title}</h2>
          <button type="button" className="link-btn" style={{ padding: '0 8px' }} onClick={closeSheet}>
            Lukk
          </button>
        </div>
        <div className="sheet-body">
          {sheet === 'composer' && <Composer />}
          {sheet === 'addMatch' && <AddMatch />}
          {sheet === 'result' && <Result />}
          {sheet === 'postMenu' && <PostMenu />}
          {sheet === 'confirm' && <Confirm />}
          {sheet === 'notifs' && <Notifs />}
          {sheet === 'price' && <Price />}
          {sheet === 'payout' && <Payout />}
          {sheet === 'earnings' && <Earnings />}
          {sheet === 'subscribers' && <Subscribers />}
          {sheet === 'method' && <Method />}
          {sheet === 'receipts' && <Receipts />}
        </div>
      </div>
    </div>
  );
}

function FormError({ text }: { text?: unknown }) {
  if (!text) return null;
  return (
    <p role="alert" className="error">
      {String(text)}
    </p>
  );
}

function Composer() {
  const st = useStore();
  const dr = st.draft;
  if (!dr) return null;
  const dark = st.theme === 'dark';
  const matches = [...st.data.matches].sort((a, b) => matchTime(b) - matchTime(a));
  const ready = (dr.text.trim() || dr.media.length) && !dr.loading;
  return (
    <>
      <div className="field">
        <span className="field-label">Type</span>
        <div
          role="group"
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3,1fr)',
            gap: 1,
            background: 'var(--line-strong)',
            border: '1px solid var(--line-strong)',
            borderRadius: 8,
            overflow: 'hidden',
          }}
        >
          {(Object.keys(TYPES) as PostType[]).map((k) => {
            const on = dr.type === k;
            return (
              <button
                key={k}
                type="button"
                aria-pressed={on}
                onClick={() => st.setDraft({ type: k })}
                style={{
                  minHeight: 46,
                  border: 'none',
                  background: on ? 'var(--ink)' : 'var(--surface)',
                  color: on ? 'var(--bg)' : 'var(--ink)',
                  font: '600 15px var(--body)',
                  cursor: 'pointer',
                }}
              >
                {TYPES[k].label}
              </button>
            );
          })}
        </div>
      </div>

      {dr.type === 'kamp' && (
        <Field label="Kamp">
          <select className="input" value={dr.matchId} onChange={(e) => st.setDraft({ matchId: e.target.value })}>
            <option value="">Ingen kamp valgt</option>
            {matches.map((m) => (
              <option key={m.id} value={m.id}>
                {matchTitle(st, m) + ' · ' + fmtDay(m.date)}
              </option>
            ))}
          </select>
        </Field>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
          <span className="field-label">Bilder</span>
          <span className="row-meta">
            {dr.media.length ? dr.media.length + (dr.media.length === 1 ? ' bilde' : ' bilder') : 'Ingen bilder ennå'}
          </span>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 4 }}>
          {dr.media.map((m) => (
            <div key={m.id} style={{ position: 'relative', aspectRatio: '1', borderRadius: 4, overflow: 'hidden', background: stripe(m.hue ?? 20, dark) }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              {m.src && <img src={m.src} alt="" className="media-img" />}
              <button
                type="button"
                onClick={() => st.removeMedia(m.id)}
                aria-label="Fjern bildet"
                style={{
                  position: 'absolute',
                  top: 0,
                  right: 0,
                  width: 40,
                  height: 40,
                  border: 'none',
                  background: 'none',
                  display: 'grid',
                  placeItems: 'center',
                  cursor: 'pointer',
                  padding: 0,
                }}
              >
                <span
                  style={{
                    width: 24,
                    height: 24,
                    borderRadius: '50%',
                    background: 'rgba(0,0,0,.65)',
                    color: '#fff',
                    display: 'grid',
                    placeItems: 'center',
                    font: '600 15px/1 var(--body)',
                  }}
                >
                  ×
                </span>
              </button>
            </div>
          ))}
          <label
            style={{
              position: 'relative',
              aspectRatio: '1',
              borderRadius: 4,
              border: '1px dashed var(--line-strong)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 2,
              cursor: 'pointer',
              font: '500 13px var(--body)',
              color: 'var(--accent-ink)',
              textAlign: 'center',
            }}
          >
            <input
              type="file"
              accept="image/*"
              multiple
              onChange={(e) => {
                const files = [...(e.target.files || [])];
                e.target.value = '';
                st.addFiles(files);
              }}
              style={{ position: 'absolute', width: 1, height: 1, opacity: 0, overflow: 'hidden' }}
            />
            {dr.loading ? (
              'Laster …'
            ) : (
              <>
                <span style={{ font: '400 26px/1 var(--body)' }}>+</span>Legg til
              </>
            )}
          </label>
        </div>
      </div>

      <Field label="Tekst">
        <textarea
          className="input"
          value={dr.text}
          onChange={(e) => st.setDraft({ text: e.target.value })}
          rows={4}
          placeholder="Hva skjedde?"
          style={{ minHeight: 120 }}
        />
      </Field>

      <div className="list">
        <SwitchRow
          label="Varsle abonnentene"
          sub={st.data.subs.length + ' abonnenter får varsel på mobilen'}
          on={dr.notify !== false}
          onToggle={() => st.setDraft({ notify: dr.notify === false })}
        />
      </div>

      <div
        style={{
          position: 'sticky',
          bottom: -16,
          margin: '0 -16px -16px',
          padding: '12px 16px 16px',
          background: 'var(--surface)',
          borderTop: '1px solid var(--line)',
        }}
      >
        <button type="button" className={'btn btn-primary btn-block' + (ready ? '' : ' btn-dim')} onClick={st.publish}>
          {dr.id ? 'Lagre endringer' : 'Legg ut innlegg'}
        </button>
      </div>
    </>
  );
}

function Chip({ label, on, onClick }: { label: string; on: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      aria-pressed={on}
      onClick={onClick}
      style={{
        minHeight: 44,
        padding: '0 14px',
        border: '1px solid ' + (on ? 'var(--ink)' : 'var(--line-strong)'),
        borderRadius: 4,
        background: on ? 'var(--ink)' : 'var(--surface)',
        color: on ? 'var(--bg)' : 'var(--ink)',
        font: '500 15px var(--body)',
        cursor: 'pointer',
      }}
    >
      {label}
    </button>
  );
}

function AddMatch() {
  const form = useStore((s) => s.form);
  const setForm = useStore((s) => s.setForm);
  const saveMatch = useStore((s) => s.saveMatch);
  const f = form as Record<string, string | boolean | undefined>;
  const bind = (k: string) => ({
    value: String(f[k] ?? ''),
    onChange: (e: { target: { value: string } }) => setForm({ [k]: e.target.value, err: '' }),
  });
  const submit = (e: FormEvent) => {
    e.preventDefault();
    saveMatch();
  };
  return (
    <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
        <Chip label="Neste kamp" on={!!f.featured} onClick={() => setForm({ featured: !f.featured })} />
        <Chip label="Hjemme" on={f.home === true} onClick={() => setForm({ home: true })} />
        <Chip label="Borte" on={f.home === false} onClick={() => setForm({ home: false })} />
        <Chip label="Serie" on={f.kind === 'Serie'} onClick={() => setForm({ kind: 'Serie' })} />
        <Chip label="Cup" on={f.kind === 'Cup'} onClick={() => setForm({ kind: 'Cup' })} />
      </div>
      <Field label="Tittel">
        <input className="input" {...bind('title')} placeholder={'F.eks. Seriekamp mot ' + (f.opp || 'Lørenskog')} />
      </Field>
      <Field label="Motstander">
        <input className="input" {...bind('opp')} placeholder="F.eks. Lørenskog" />
      </Field>
      <Field label="Dato">
        <input className="input" type="date" {...bind('date')} />
      </Field>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <Field label="Oppmøte">
          <input className="input" type="time" {...bind('meet')} />
        </Field>
        <Field label="Avspark">
          <input className="input" type="time" {...bind('time')} />
        </Field>
      </div>
      <Field label="Sted">
        <input className="input" {...bind('venue')} placeholder="F.eks. Solberg kunstgress" />
      </Field>
      <Field label="Tekst">
        <textarea
          className="input"
          {...bind('note')}
          rows={3}
          placeholder="F.eks. Husk leggskinn. Vi kjører samlet fra klubbhuset."
          style={{ minHeight: 96 }}
        />
      </Field>
      <FormError text={f.err} />
      <button type="submit" className="btn btn-primary btn-block">
        Legg til kamp
      </button>
    </form>
  );
}

function ScoreBox({ label, value, onStep }: { label: string; value: number; onStep: (dir: number) => void }) {
  return (
    <div style={{ background: 'var(--surface)', padding: '16px 8px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
      <span style={{ font: '500 15px var(--body)' }}>{label}</span>
      <span className="tnum" style={{ font: '700 48px/1 var(--display)' }}>
        {value}
      </span>
      <div style={{ display: 'flex', gap: 8 }}>
        <button type="button" className="btn btn-secondary btn-step" aria-label="Minus" onClick={() => onStep(-1)}>
          −
        </button>
        <button type="button" className="btn btn-secondary btn-step" aria-label="Pluss" onClick={() => onStep(1)}>
          +
        </button>
      </div>
    </div>
  );
}

function Result() {
  const st = useStore();
  const m = st.data.matches.find((x) => x.id === st.form.matchId);
  return (
    <>
      <p className="note">{m ? matchTitle(st, m) : ''}</p>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: 1,
          background: 'var(--line)',
          border: '1px solid var(--line)',
          borderRadius: 8,
          overflow: 'hidden',
        }}
      >
        <ScoreBox label={shortTeam(st)} value={Number(st.form.us) || 0} onStep={(d) => st.stepResult('us', d)} />
        <ScoreBox label={m?.opp || 'Motstander'} value={Number(st.form.them) || 0} onStep={(d) => st.stepResult('them', d)} />
      </div>
      <button type="button" className="btn btn-primary btn-block" onClick={st.saveResult}>
        Lagre resultat
      </button>
    </>
  );
}

function PostMenu() {
  const id = useStore((s) => s.menuPost);
  const openComposer = useStore((s) => s.openComposer);
  const deletePost = useStore((s) => s.deletePost);
  if (!id) return null;
  return (
    <div className="sheet-flush">
      <button type="button" className="row-btn" style={{ font: '500 16px var(--body)' }} onClick={() => openComposer(id)}>
        Rediger innlegg
      </button>
      <button
        type="button"
        className="row-btn"
        style={{ borderBottom: 'none', font: '500 16px var(--body)', color: 'var(--accent-ink)' }}
        onClick={() => deletePost(id)}
      >
        Slett innlegg
      </button>
    </div>
  );
}

function Confirm() {
  const c = useStore((s) => s.confirm);
  const closeSheet = useStore((s) => s.closeSheet);
  const doConfirm = useStore((s) => s.doConfirm);
  return (
    <>
      <p className="lead">{c?.body}</p>
      <div className="btn-pair">
        <button type="button" className="btn btn-secondary" onClick={closeSheet}>
          Avbryt
        </button>
        <button type="button" className="btn btn-primary" onClick={doConfirm}>
          {c?.label || 'OK'}
        </button>
      </div>
    </>
  );
}

function Notifs() {
  const notifs = useStore((s) => s.data.notifs);
  if (!notifs.length)
    return (
      <p className="note" style={{ textAlign: 'center' }}>
        Ingen varsler.
      </p>
    );
  return (
    <div className="sheet-flush">
      {notifs.map((n) => (
        <div key={n.id} className="row" style={{ padding: '14px 0' }}>
          <span style={{ width: 8, height: 8, flex: 'none', borderRadius: '50%', background: n.read ? 'transparent' : 'var(--accent)' }} />
          <span style={{ flex: 1, font: '400 15px/1.4 var(--body)' }}>{n.text}</span>
          <span className="row-meta">{rel(n.ts)}</span>
        </div>
      ))}
    </div>
  );
}

function Price() {
  const st = useStore();
  const value = String(st.form.price ?? '');
  const pv = parseInt(value, 10) || 0;
  return (
    <>
      <p className="lead" style={{ fontSize: 15 }}>
        Prisen alle abonnenter betaler hver måned. Ny pris gjelder fra neste trekk. Det som allerede er betalt, endres ikke.
      </p>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 16, padding: '8px 0' }}>
        <button type="button" className="btn btn-secondary btn-step" aria-label="5 kr mindre" onClick={() => st.stepPrice(-1)}>
          −
        </button>
        <label style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
          <input
            value={value}
            onChange={(e) => st.setForm({ price: e.target.value.replace(/\D/g, '').slice(0, 3), err: '' })}
            inputMode="numeric"
            aria-label="Pris i kroner"
            className="tnum"
            style={{
              width: 96,
              border: 'none',
              borderBottom: '1.5px solid var(--line-strong)',
              background: 'none',
              color: 'var(--ink)',
              textAlign: 'center',
              font: '700 44px/1.1 var(--display)',
              outline: 'none',
              padding: 0,
            }}
          />
          <span className="note">kr / mnd</span>
        </label>
        <button type="button" className="btn btn-secondary btn-step" aria-label="5 kr mer" onClick={() => st.stepPrice(1)}>
          +
        </button>
      </div>
      <div className="list">
        <div className="row">
          <span className="row-label">I året med {st.data.subs.length} abonnenter</span>
          <span className="row-value">{krd(pv * 12 * st.data.subs.length)}</span>
        </div>
      </div>
      <FormError text={st.form.err} />
      <button type="button" className="btn btn-primary btn-block" onClick={st.savePrice}>
        Lagre pris
      </button>
    </>
  );
}

const formatAcctInput = (v: string) => {
  const n = v.replace(/\D/g, '').slice(0, 11);
  return n.length > 6 ? fmtAcct(n) : n.length > 4 ? n.slice(0, 4) + '.' + n.slice(4) : n;
};

function Payout() {
  const form = useStore((s) => s.form);
  const setForm = useStore((s) => s.setForm);
  const savePayout = useStore((s) => s.savePayout);
  return (
    <>
      <p className="lead" style={{ fontSize: 15 }}>
        Pengene fra abonnementene betales ut hit den 5. hver måned. Bruk lagets eller klubbens konto, ikke en privat konto.
      </p>
      <Field label="Kontoeier">
        <input
          className="input"
          value={String(form.acctOwner ?? '')}
          onChange={(e) => setForm({ acctOwner: e.target.value, err: '' })}
          placeholder="F.eks. Ski IL Fotball"
        />
      </Field>
      <Field label="Kontonummer">
        <input
          className="input tnum"
          value={String(form.acct ?? '')}
          onChange={(e) => setForm({ acct: formatAcctInput(e.target.value), err: '' })}
          inputMode="numeric"
          placeholder="1234.56.78903"
          autoComplete="off"
          style={{ font: '500 17px var(--body)', letterSpacing: '.03em' }}
        />
      </Field>
      <FormError text={form.err} />
      <button type="button" className="btn btn-primary btn-block" onClick={savePayout}>
        Lagre konto
      </button>
    </>
  );
}

function Earnings() {
  const st = useStore();
  const { thisMonth } = economy(st.data, price(st));
  return (
    <div>
      {thisMonth.map((p) => (
        <div key={p.id} className="row">
          <span className="row-text">
            <span style={{ font: '500 15px var(--body)' }}>{p.name}</span>
            <span className="row-meta">Betalte {fmtShort(p.at)}</span>
          </span>
          <span className="tnum" style={{ font: '600 15px var(--body)' }}>
            {krd(p.amount)}
          </span>
        </div>
      ))}
    </div>
  );
}

function Subscribers() {
  const st = useStore();
  const P = playerMap(st.data.players);
  const subs = [...st.data.subs].sort((a, b) => a.name.localeCompare(b.name, NB));
  const via = [...new Set(subs.map((x) => x.via))];
  const byPlayer = via
    .map((id) => {
      const xs = subs.filter((x) => x.via === id);
      const p = id ? P[id] : undefined;
      return {
        key: id || 'none',
        name: p ? p.name : 'Ukjent spiller',
        n: xs.length,
        names: xs.map((x) => x.name + (x.rel ? ' (' + x.rel + ')' : '')).join(', '),
      };
    })
    .sort((a, b) => b.n - a.n || a.name.localeCompare(b.name, NB));

  return (
    <>
      <p className="note">
        {subs.length} abonnenter, vervet av {via.length} spillere.
      </p>
      <Tabs
        value={st.subView}
        items={[
          ['all', 'Alle'],
          ['player', 'Per spiller'],
        ]}
        onChange={(v) => useStore.setState({ subView: v })}
        style={{ marginTop: -8 }}
      />
      {st.subView === 'player' ? (
        <div style={{ marginTop: -18 }}>
          {byPlayer.map((r) => (
            <div key={r.key} className="row" style={{ alignItems: 'flex-start', padding: '12px 0' }}>
              <span className="row-text" style={{ gap: 3 }}>
                <span style={{ font: '500 15px var(--body)' }}>{r.name}</span>
                <span className="row-meta" style={{ lineHeight: 1.4 }}>
                  {r.names}
                </span>
              </span>
              <span className="tnum" style={{ font: '600 15px var(--body)' }}>
                {r.n}
              </span>
            </div>
          ))}
        </div>
      ) : (
        <div style={{ marginTop: -18 }}>
          {subs.map((x) => {
            const p = x.via ? P[x.via] : undefined;
            return (
              <div key={x.id} className="row">
                <span className="row-text">
                  <span style={{ font: '500 15px var(--body)' }}>{x.name}</span>
                  <span className="row-meta" style={{ lineHeight: 1.35 }}>
                    {'Vervet av ' + (p ? p.name : 'ukjent spiller') + ' · ' + (x.rel ? x.rel + ' · ' : '') + 'siden ' + fmtShort(x.since)}
                  </span>
                </span>
                <button type="button" className="link-btn quiet" aria-label={'Fjern tilgang for ' + x.name} onClick={() => st.removeSub(x.id)}>
                  Fjern
                </button>
              </div>
            );
          })}
        </div>
      )}
    </>
  );
}

function Method() {
  const sub = useStore((s) => s.prof.sub);
  const setProf = useStore((s) => s.setProf);
  const toast = useStore((s) => s.toast);
  const names = METHOD_NAMES(sub.last4);
  const choose = (k: Exclude<PayMethod, 'vipps'>) => {
    setProf('sub', { method: k });
    useStore.setState({ sheet: null });
    toast('Betalingsmåten er endret til ' + (k === 'card' ? 'Kort' : names[k]));
  };
  const items: [Exclude<PayMethod, 'vipps'>, string, string][] = [
    ['card', 'Kort', '•••• ' + (sub.last4 || '4242')],
    ['apple', 'Apple Pay', ''],
    ['google', 'Google Pay', ''],
  ];
  return (
    <>
      <div className="sheet-flush">
        {items.map(([k, label, extra]) => (
          <button key={k} type="button" className="row-btn" onClick={() => choose(k)}>
            <span className={'radio-dot' + (sub.method === k ? ' on' : '')} />
            <span style={{ flex: 1, font: '500 16px var(--body)' }}>
              {label} <span style={{ fontWeight: 400, color: 'var(--muted)' }}>{extra}</span>
            </span>
          </button>
        ))}
      </div>
      <p className="note">Vipps kommer snart.</p>
    </>
  );
}

function Receipts() {
  const st = useStore();
  const sub = st.prof.sub;
  const mine = (st.data.payments || []).filter((p) => p.subId === 'me-sub').sort((a, b) => b.at - a.at);
  const method = METHOD_NAMES(sub.last4)[sub.method];
  if (!mine.length)
    return (
      <p className="note" style={{ textAlign: 'center' }}>
        Ingen kvitteringer ennå.
      </p>
    );
  return (
    <div className="sheet-flush">
      {mine.map((p) => (
        <div key={p.id} className="row" style={{ padding: '4px 0' }}>
          <span style={{ flex: 1, font: '400 15px var(--body)' }}>{fmtDate(p.at)}</span>
          <span className="tnum" style={{ font: '600 15px var(--body)' }}>
            {krd(p.amount)}
          </span>
          <button
            type="button"
            className="link-btn"
            style={{ marginLeft: 12, fontSize: 14 }}
            onClick={() => {
              download(
                'kvittering-' + iso(new Date(p.at)) + '.txt',
                receiptText(teamName(st), p.at, krd(p.amount), method),
                'text/plain',
              );
              st.toast('Kvitteringen er lastet ned');
            }}
          >
            Last ned
          </button>
        </div>
      ))}
    </div>
  );
}

