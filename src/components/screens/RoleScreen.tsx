'use client';

import Image from 'next/image';
import { useStore } from '@/lib/store';
import { ChevronRow, Icon } from '../ui';

export function RoleScreen() {
  const theme = useStore((s) => s.theme);
  const toggleTheme = useStore((s) => s.toggleTheme);
  const chooseRole = useStore((s) => s.chooseRole);

  return (
    <div className="screen" style={{ padding: '0 16px calc(24px + env(safe-area-inset-bottom))' }}>
      <div style={{ minHeight: 64, display: 'flex', alignItems: 'center', gap: 10 }}>
        <Image src="/ic-logo.png" alt="" width={36} height={36} style={{ borderRadius: '50%' }} priority />
        <span style={{ flex: 1, font: "700 19px var(--display)", letterSpacing: '-.02em', color: 'var(--accent-ink)' }}>InnerCircle</span>
        <button type="button" className="icon-btn" onClick={toggleTheme} aria-label="Bytt mellom lys og mørk modus" style={{ marginRight: -12 }}>
          <Icon name={theme === 'dark' ? 'light_mode' : 'dark_mode'} />
        </button>
      </div>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', padding: '48px 0 32px' }}>
        <h1 style={{ margin: 0, font: '700 34px/1.08 var(--display)', letterSpacing: '-.03em', maxWidth: 330, textWrap: 'balance' }}>
          Lagets egen bildestrøm, bare for familien
        </h1>
      </div>
      <div style={{ borderTop: '1.5px solid var(--ink)' }}>
        <ChevronRow large arrow="arrow_forward" title="Jeg er spiller" sub="Over eller under 15 år" onClick={() => chooseRole('player')} />
        <ChevronRow
          large
          arrow="arrow_forward"
          title="Jeg er abonnent"
          sub="Besteforeldre, tanter, onkler og andre som heier"
          onClick={() => chooseRole('sub')}
        />
        <ChevronRow large arrow="arrow_forward" title="Jeg er trener" sub="Trener eller lagleder" onClick={() => chooseRole('coach')} />
      </div>
      <p className="note" style={{ marginTop: 16 }}>
        Ingenting er offentlig. Bare de som er invitert, ser bildene.
      </p>
    </div>
  );
}
