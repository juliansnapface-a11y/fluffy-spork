'use client';

import type { FormEvent } from 'react';
import { DEMO_HINTS, newPay } from '@/lib/seed';
import { priceText, teamName } from '@/lib/selectors';
import { useStore } from '@/lib/store';
import type { PayMethod } from '@/lib/types';
import { Field, SwitchRow, TopBar } from '../ui';

const METHODS: [PayMethod, string, boolean][] = [
  ['card', 'Kort', false],
  ['apple', 'Apple Pay', false],
  ['google', 'Google Pay', false],
  ['vipps', 'Vipps', true],
];

export function Payment() {
  const st = useStore();
  const p = st.pay || newPay();
  const autoRenew = p.autoRenew !== false;
  const submit = (e: FormEvent) => {
    e.preventDefault();
    st.paySubmit();
  };
  return (
    <div className="fullscreen">
      <form onSubmit={submit} className="fullscreen-inner" style={{ gap: 16 }}>
        <TopBar label={st.payCtx ? '' : 'Steg 3 av 3'} onBack={st.payBack} />
        <h1 className="h1">Betaling</h1>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 12, padding: '14px 0', borderTop: '1px solid var(--line)', borderBottom: '1px solid var(--line)' }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ font: '600 16px var(--body)' }}>{teamName(st)}</div>
            <div className="note">Trekkes automatisk hver måned</div>
          </div>
          <div className="tnum" style={{ font: '700 22px var(--display)', whiteSpace: 'nowrap' }}>
            {priceText(st)}
            <span style={{ font: '400 14px var(--body)', color: 'var(--muted)' }}> / mnd</span>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <span className="field-label">Betalingsmåte</span>
          {METHODS.map(([k, label, soon]) => {
            const on = p.method === k;
            return (
              <button
                key={k}
                type="button"
                aria-pressed={on}
                onClick={() => st.setPayMethod(k)}
                style={{
                  minHeight: 52,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  padding: '0 12px',
                  border: '1px solid ' + (on ? 'var(--accent-ink)' : 'var(--line)'),
                  borderRadius: 6,
                  background: 'var(--surface)',
                  color: 'var(--ink)',
                  opacity: soon ? 0.5 : 1,
                  cursor: soon ? 'not-allowed' : 'pointer',
                  font: '500 16px var(--body)',
                  textAlign: 'left',
                }}
              >
                <span className={'radio-dot' + (on ? ' on' : '')} />
                <span style={{ flex: 1 }}>{label}</span>
                {soon && <span className="row-meta">Kommer snart</span>}
              </button>
            );
          })}
        </div>

        {p.method === 'card' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <Field label="Kortnummer">
              <input
                className="input"
                value={p.num}
                onChange={(e) => st.setCard('num', e.target.value)}
                inputMode="numeric"
                autoComplete="cc-number"
                placeholder="1234 5678 9012 3456"
              />
            </Field>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <Field label="Utløper">
                <input className="input" value={p.exp} onChange={(e) => st.setCard('exp', e.target.value)} inputMode="numeric" autoComplete="cc-exp" placeholder="MM/ÅÅ" />
              </Field>
              <Field label="CVC">
                <input className="input" value={p.cvc} onChange={(e) => st.setCard('cvc', e.target.value)} inputMode="numeric" autoComplete="cc-csc" placeholder="123" />
              </Field>
            </div>
            {DEMO_HINTS && (
              <p className="note" style={{ fontSize: 13 }}>
                Demo: 16 sifre, en dato fram i tid og 3 sifre fungerer.
              </p>
            )}
          </div>
        )}

        <div className="list">
          <SwitchRow
            label="Automatisk trekk hver måned"
            sub={autoRenew ? 'Trekkes den 1. hver måned til du sier opp' : 'Du betaler for én måned. Ingen nye trekk.'}
            on={autoRenew}
            onToggle={() => st.setPay({ autoRenew: !autoRenew })}
          />
        </div>
        {p.err && (
          <p role="alert" className="error">
            {p.err}
          </p>
        )}
        <p className="note">Dette er en testversjon. Ingen penger blir trukket.</p>
        <div className="spacer" />
        <button type="submit" className="btn btn-primary btn-block">
          {p.busy ? 'Behandler …' : 'Betal ' + priceText(st)}
        </button>
      </form>
    </div>
  );
}
