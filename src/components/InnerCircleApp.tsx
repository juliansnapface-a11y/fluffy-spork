'use client';

import { useEffect, useState } from 'react';
import { registerWorker } from '@/lib/push';
import { startPersistence, useStore } from '@/lib/store';
import { currentSession } from '@/lib/supabase';
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

  // The signed-in account (hearts and subscriptions are tied to it), and the push worker.
  useEffect(() => {
    void currentSession().then((u) => u && useStore.setState({ uid: u.id }));
    void registerWorker();
  }, []);

  // Pick up changes others make: check every 8 seconds and whenever the app comes back into view.
  useEffect(() => {
    const refresh = () => {
      if (document.visibilityState === 'visible') void useStore.getState().refresh();
    };
    refresh();
    const t = setInterval(refresh, 8000);
    document.addEventListener('visibilitychange', refresh);
    window.addEventListener('focus', refresh);
    return () => {
      clearInterval(t);
      document.removeEventListener('visibilitychange', refresh);
      window.removeEventListener('focus', refresh);
    };
  }, []);

  // Invite links look like /?lag=TEAMCODE&via=PLAYERID and open the subscriber sign-up.
  useEffect(() => {
    const q = new URLSearchParams(window.location.search);
    const code = q.get('lag');
    if (!code) return;
    window.history.replaceState(null, '', window.location.pathname);
    const st = useStore.getState();
    const alreadyFollowing = st.screen === 'app' && st.role === 'sub' && st.data.teamCode === code.toUpperCase();
    if (!alreadyFollowing) st.startInvite(code, q.get('via'));
  }, []);

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
