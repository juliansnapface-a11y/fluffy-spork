'use client';

import { fmtAcct, krd, NB } from '@/lib/format';
import { price, priceText } from '@/lib/selectors';
import { useStore } from '@/lib/store';
import type { Payment, TeamData } from '@/lib/types';
import { Icon } from '../ui';

const monthStart = (y: number, m: number) => new Date(y, m, 1).getTime();
const sum = (a: Payment[]) => a.reduce((n, p) => n + p.amount, 0);

/** Earnings figures. Paid amounts never change; only the projection follows price and subscriber changes. */
export function economy(d: TeamData, monthly: number) {
  const now = new Date();
  const y = now.getFullYear();
  const mo = now.getMonth();
  const L = d.payments || [];
  const thisMonth = L.filter((p) => p.at >= monthStart(y, mo)).sort((a, b) => b.at - a.at);
  const prev = [];
  for (let k = 1; k <= 6; k++) {
    const a = monthStart(y, mo - k);
    const b = monthStart(y, mo - k + 1);
    const ps = L.filter((p) => p.at >= a && p.at < b);
    const dt = new Date(a);
    prev.push({
      key: 'pm' + k,
      label: dt.toLocaleDateString(NB, dt.getFullYear() === y ? { month: 'long' } : { month: 'long', year: 'numeric' }),
      count: ps.length === 1 ? '1 betaling' : ps.length + ' betalinger',
      amount: krd(sum(ps)),
    });
  }
  const renewing = d.subs.filter((x) => x.autoRenew !== false).length;
  const ytd = sum(L.filter((p) => p.at >= monthStart(y, 0)));
  const left = 11 - mo;
  return {
    year: y,
    monthName: now.toLocaleDateString(NB, { month: 'long', year: 'numeric' }),
    thisMonth,
    earned: sum(thisMonth),
    prev,
    renewing,
    ytd,
    left,
    projection: ytd + left * renewing * monthly,
  };
}

export function OkonomiView() {
  const st = useStore();
  const { data } = st;
  const ec = economy(data, price(st));
  const po = data.payout;
  const leftText =
    ec.left === 0
      ? 'Dette er siste måned i året'
      : ec.left + (ec.left === 1 ? ' måned' : ' måneder') + ' igjen med ' + ec.renewing + ' faste abonnenter à ' + priceText(st);

  return (
    <>
      <header className="app-header">
        <div style={{ flex: 1, minWidth: 0 }}>
          <div className="app-title">Økonomi</div>
          <div className="app-subtitle" style={{ textTransform: 'capitalize' }}>
            {ec.monthName}
          </div>
        </div>
      </header>
      <section style={{ padding: '24px 0 16px', borderBottom: '1px solid var(--line)' }}>
        <div className="note">Tjent denne måneden</div>
        <div className="tnum" style={{ marginTop: 2, font: '700 40px/1.1 var(--display)', letterSpacing: '-.025em' }}>
          {krd(ec.earned)}
        </div>
        <button
          type="button"
          className="link-btn"
          style={{ display: 'flex', alignItems: 'center', gap: 2 }}
          onClick={() => st.openSheet('earnings')}
        >
          {ec.thisMonth.length} betalinger · se hvem
          <Icon name="chevron_right" size={20} />
        </button>
      </section>

      <button type="button" className="row-btn" onClick={st.openPayout}>
        <span className="row-text">
          <span style={{ font: '400 16px var(--body)' }}>Utbetales til</span>
          <span className="row-meta">{po ? po.owner : 'Pengene holdes til du legger inn en konto'}</span>
        </span>
        {po ? (
          <span className="row-value">{fmtAcct(po.acct)}</span>
        ) : (
          <span style={{ font: '600 15px var(--body)', color: 'var(--accent-ink)' }}>Legg til konto</span>
        )}
        <Icon name="chevron_right" className="chev" size={20} />
      </button>
      <button type="button" className="row-btn" onClick={st.openPrice}>
        <span className="row-label">Pris per måned</span>
        <span className="row-value">{priceText(st)}</span>
        <Icon name="chevron_right" className="chev" size={20} />
      </button>
      <button type="button" className="row-btn" onClick={() => st.openSheet('subscribers')}>
        <span className="row-label">Abonnenter</span>
        <span className="row-value">{data.subs.length}</span>
        <Icon name="chevron_right" className="chev" size={20} />
      </button>
      <div style={{ padding: '14px 0', borderBottom: '1px solid var(--line)' }}>
        <div style={{ display: 'flex', gap: 12 }}>
          <span className="row-label">Ligger an til i {ec.year}</span>
          <span className="row-value" style={{ marginRight: 32 }}>
            {krd(ec.projection)}
          </span>
        </div>
        <p className="note" style={{ marginTop: 4, fontSize: 13 }}>
          Hittil i år {krd(ec.ytd)}. {leftText}.
        </p>
      </div>

      <section className="section">
        <h2 className="h2">Tidligere måneder</h2>
        <div>
          {ec.prev.map((p) => (
            <div key={p.key} style={{ display: 'flex', alignItems: 'baseline', gap: 12, padding: '13px 0', borderBottom: '1px solid var(--line)' }}>
              <span style={{ flex: 1, font: '400 15px var(--body)', textTransform: 'capitalize' }}>{p.label}</span>
              <span className="row-meta">{p.count}</span>
              <span className="tnum" style={{ width: 84, textAlign: 'right', font: '600 15px var(--body)' }}>
                {p.amount}
              </span>
            </div>
          ))}
        </div>
      </section>
    </>
  );
}
