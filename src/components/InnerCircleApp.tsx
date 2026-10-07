'use client';

import { useEffect, useState } from 'react';
import { startPersistence, useStore } from '@/lib/store';
import { AppShell } from './app/AppShell';
import { CoachConsent, ParentConsent, PlayerConsent } from './overlays/Consent';
import { Payment } from './overlays/Payment';
import { Viewer } from './overlays/Viewer';
import { FlowScreen } from './screens/FlowScreen';
import { RoleScreen } from './screens/RoleScreen';
import { SheetHost } from './sheets/Sheets';

const FLOW_SCREENS = ['playerKind', 'login', 'otp', 'teamCode', 'pickPlayer', 'invite', 'terms', 'coachCode', 'createTeam', 'coachChoice'];

export default function InnerCircleApp() {
  const screen = useStore((s) => s.screen);
  const theme = useStore((s) => s.theme);
  const toast = useStore((s) => s.toastMsg);
  const payOpen = useStore((s) => s.screen === 'pay' || !!s.payCtx);
  const consOpen = useStore((s) => s.screen === 'consent' || s.consCtx === 'app');
  const pconsOpen = useStore((s) => s.screen === 'pconsent' || s.pcCtx === 'app');
  const [, setTick] = useState(0);

  useEffect(() => startPersistence(), []);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  // Re-render every minute so relative times ("5 min siden") stay current.
  useEffect(() => {
    const t = setInterval(() => setTick((n) => n + 1), 60000);
    return () => clearInterval(t);
  }, []);

  return (
    <>
      {screen === 'role' && <RoleScreen />}
      {FLOW_SCREENS.includes(screen) && <FlowScreen />}
      {screen === 'app' && <AppShell />}
      <SheetHost />
      {payOpen && <Payment />}
      {consOpen && <ParentConsent />}
      {pconsOpen && <PlayerConsent />}
      {screen === 'cconsent' && <CoachConsent />}
      <Viewer />
      {toast && (
        <div role="status" className="toast">
          {toast}
        </div>
      )}
    </>
  );
}
