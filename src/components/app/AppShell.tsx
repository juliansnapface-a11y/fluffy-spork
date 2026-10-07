'use client';

import { useStore } from '@/lib/store';
import type { Tab } from '@/lib/types';
import { Icon } from '../ui';
import { KamperView, MatchDetail } from './KamperView';
import { LagView } from './LagView';
import { MinSide } from './MinSide';
import { OkonomiView } from './OkonomiView';

export function AppShell() {
  const tab = useStore((s) => s.tab);
  const openMatch = useStore((s) => s.openMatch);
  const isCoach = useStore((s) => s.role === 'coach');
  const setTab = useStore((s) => s.setTab);

  const tabs: [Tab, string, string][] = [
    ['lag', 'Lag', 'groups'],
    ['kamper', 'Kamper', 'sports_soccer'],
    ...(isCoach ? ([['okonomi', 'Økonomi', 'payments']] as [Tab, string, string][]) : []),
    ['min', 'Min side', 'person'],
  ];
  // Økonomi is coach-only; fall back to Lag if a saved tab no longer applies.
  const current: Tab = tab === 'okonomi' && !isCoach ? 'lag' : tab;

  return (
    <>
      <div className="screen" style={{ padding: '0 16px calc(88px + env(safe-area-inset-bottom))' }}>
        {current === 'lag' && <LagView />}
        {current === 'kamper' && (openMatch ? <MatchDetail id={openMatch} /> : <KamperView />)}
        {current === 'okonomi' && <OkonomiView />}
        {current === 'min' && <MinSide />}
      </div>
      <nav aria-label="Hovedmeny" style={{ position: 'fixed', left: 0, right: 0, bottom: 0, zIndex: 40, background: 'var(--navbg)', borderTop: '1px solid var(--line)' }}>
        <div
          style={{
            maxWidth: 480,
            margin: '0 auto',
            display: 'grid',
            gridAutoFlow: 'column',
            gridAutoColumns: '1fr',
            paddingBottom: 'env(safe-area-inset-bottom)',
          }}
        >
          {tabs.map(([k, label, icon]) => {
            const active = current === k;
            return (
              <button
                key={k}
                type="button"
                onClick={() => setTab(k)}
                aria-current={active ? 'page' : undefined}
                style={{
                  minHeight: 60,
                  border: 'none',
                  background: 'none',
                  color: active ? 'var(--accent-ink)' : 'var(--muted)',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 3,
                  font: '500 12px var(--body)',
                  cursor: 'pointer',
                }}
              >
                <Icon name={icon} size={24} filled={active} />
                {label}
              </button>
            );
          })}
        </div>
      </nav>
    </>
  );
}
