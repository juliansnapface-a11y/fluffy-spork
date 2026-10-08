import { create } from 'zustand';
import {
  ascii,
  copyText,
  DAY,
  download,
  firstName,
  fmtAcct,
  fmtDate,
  fmtDay,
  isEmail,
  iso,
  isPlayed,
  matchTime,
  nextChargeText,
  NB,
  resizeImage,
  validAcct,
} from './format';
import {
  blankFlow,
  COACH,
  defCons,
  emptyTeam,
  ephemeral,
  freshState,
  LS_KEY,
  newPay,
  seedWithLedger,
} from './seed';
import {
  accessToken,
  CodeTakenError,
  createTeam,
  currentSession,
  getTeam,
  joinTeam,
  myTeams,
  peekTeam,
  saveTeam,
  sendCode,
  signOut,
  teamVersion,
  uploadMedia,
  verifyCode,
  type TeamPayload,
} from './supabase';
import { scoreTitle } from './derive';
import { coachName, matchTitle, price, shortTeam, teamName } from './selectors';

const MAX_VIDEO = 50 * 1024 * 1024;

/** Length of a video file as m:ss, read from its metadata. */
function videoDuration(file: File): Promise<string> {
  return new Promise((resolve) => {
    const v = document.createElement('video');
    const url = URL.createObjectURL(file);
    const done = (txt: string) => {
      URL.revokeObjectURL(url);
      resolve(txt);
    };
    v.preload = 'metadata';
    v.onloadedmetadata = () => {
      const t = Math.round(v.duration || 0);
      done(Math.floor(t / 60) + ':' + String(t % 60).padStart(2, '0'));
    };
    v.onerror = () => done('');
    v.src = url;
  });
}
import type {
  AppState,
  ConsentKey,
  Draft,
  EphemeralState,
  Flow,
  Match,
  Media,
  MemberRole,
  ParentConsentDraft,
  PayForm,
  PayMethod,
  PersistedState,
  Player,
  Post,
  Profiles,
  Role,
  Screen,
  SheetName,
  SignedForm,
  Tab,
  TeamData,
} from './types';

const EPHEMERAL_KEYS = Object.keys(ephemeral()) as (keyof EphemeralState)[];

function loadState(): AppState {
  let s: PersistedState | null = null;
  try {
    s = JSON.parse(localStorage.getItem(LS_KEY) || 'null');
  } catch {}
  if (!s || s.v !== 3) s = freshState();
  if (!['all', 'kamp', 'trening', 'beskjed'].includes(s.filter)) s = { ...s, filter: 'all' };
  return { ...s, ...ephemeral() };
}

export interface Actions {
  /** Fetches the team from the server if it changed. */
  refresh: () => Promise<void>;
  /** Opens the subscriber sign-up with a team code from an invite link. */
  startInvite: (code: string, via: string | null) => void;
  toast: (msg: string) => void;
  toggleTheme: () => void;
  go: (screen: Screen) => void;
  setFlow: (p: Partial<Flow>) => void;
  setData: (fn: (d: TeamData) => TeamData) => void;
  setForm: (p: AppState['form']) => void;
  setProf: <R extends keyof Profiles>(r: R, patch: Partial<Profiles[R]>) => void;
  updPlayer: (id: string, patch: Partial<Player>) => void;

  // Onboarding
  chooseRole: (r: Role) => void;
  choosePlayerKind: (adult: boolean) => void;
  chooseCoachMode: (mode: 'join' | 'create') => void;
  flowSubmit: () => void;
  setOtp: (v: string) => void;
  suggestCodes: () => void;
  back: () => void;
  enterApp: (r: Role) => void;
  logout: () => void;
  /** Back to the start screen without signing out. */
  switchRole: () => void;
  resendCode: () => Promise<void>;

  // Parent consent wizard
  setCons: (p: Partial<ParentConsentDraft>) => void;
  consNext: () => void;
  consBack: () => void;
  consToggle: (k: ConsentKey) => void;
  consGive: () => void;
  consLater: () => void;
  editParentConsent: () => void;
  withdrawConsent: () => void;

  // Signed forms (player and coach)
  setPC: (p: Partial<SignedForm>) => void;
  pcNext: () => void;
  pcBack: () => void;
  openPlayerConsent: () => void;
  ccNext: () => void;
  ccBack: () => void;

  // Payment
  setPay: (p: Partial<PayForm>) => void;
  openPay: (ctx: 'parent' | 'resub') => void;
  payBack: () => void;
  setCard: (field: 'num' | 'exp' | 'cvc', raw: string) => void;
  paySubmit: () => void;
  setPayMethod: (m: PayMethod) => void;

  // App
  setTab: (t: Tab) => void;
  setFilter: (f: AppState['filter']) => void;
  setKampTab: (t: AppState['kampTab']) => void;
  openMatchView: (id: string) => void;
  closeMatch: () => void;
  goKamper: () => void;
  toggleLike: (id: string) => void;
  openViewer: (postId: string, i: number) => void;
  closeViewer: () => void;
  stepViewer: (dir: number) => void;
  openSheet: (sheet: SheetName) => void;
  closeSheet: () => void;
  ask: (title: string, body: string, label: string, action: () => void) => void;
  doConfirm: () => void;
  toggleNotifyMatch: (id: string) => void;
  addToCal: (m: Match) => void;
  showMap: (m: Match) => void;

  // Coach
  openAddMatch: () => void;
  saveMatch: () => void;
  openResult: (id: string) => void;
  stepResult: (k: 'us' | 'them', dir: number) => void;
  saveResult: () => void;
  openComposer: (postId: string | null) => void;
  setDraft: (p: Partial<Draft>) => void;
  addFiles: (files: File[]) => Promise<void>;
  removeMedia: (id: string) => void;
  publish: () => void;
  deletePost: (id: string) => void;
  copyCode: (code: string, label: string) => void;
  openPrice: () => void;
  stepPrice: (dir: number) => void;
  savePrice: () => void;
  openPayout: () => void;
  savePayout: () => void;
  removeSub: (id: string) => void;
  addPlayer: () => void;
  removePlayer: (id: string) => void;
  resetDemo: () => void;

  // Subscriber / family
  cancelSub: () => void;
  copyInvite: (link: string) => void;
  shareInvite: (link: string) => void;
  removeChildFromPost: (postId: string) => void;
}

export type Store = AppState & Actions;

let toastTimer: ReturnType<typeof setTimeout> | undefined;
let copiedTimer: ReturnType<typeof setTimeout> | undefined;
let otpTimer: ReturnType<typeof setTimeout> | undefined;

const scrollTop = () => {
  try {
    window.scrollTo(0, 0);
  } catch {}
};

export const useStore = create<Store>()((set, get) => {
  const s = () => get();
  const setFlow = (p: Partial<Flow>) => set((st) => ({ flow: { ...st.flow, ...p } }));

  // ---------- Sync with the shared team document ----------
  // Local changes are kept as a queue of functions. Each save sends the server's last
  // document with the queue applied. If someone else saved first, the queue is replayed
  // on top of their version, so no one's change is lost.
  let pending: ((d: TeamData) => TeamData)[] = [];
  let server: TeamData | null = null;
  let saving = false;
  let failedOnce = false;
  const replay = (base: TeamData) =>
    pending.reduce((d, fn) => {
      try {
        return fn(d);
      } catch {
        return d;
      }
    }, base);
  const applyServer = (p: TeamPayload) => {
    server = p.data;
    set({ version: p.version, data: replay(p.data) });
  };
  /** The session ended or this account was removed from the team: back to the start screen. */
  const signedOutError = (e: unknown) => {
    const msg = e instanceof Error ? e.message : '';
    if (!/not_signed_in|not_member|JWT|jwt/.test(msg)) return false;
    pending = [];
    server = null;
    set({ team: null, role: null, screen: 'role', sheet: null });
    toast('Logg inn igjen for å fortsette.');
    return true;
  };
  const flush = async (): Promise<void> => {
    const team = s().team;
    if (saving || !pending.length || !team || !server) return;
    saving = true;
    try {
      for (let attempt = 0; attempt < 5 && pending.length; attempt++) {
        const batch = pending.length;
        const res = await saveTeam(team.id, team.role, s().version, replay(server));
        if (res.ok) pending = pending.slice(batch);
        applyServer(res);
        if (res.ok) break;
      }
      failedOnce = false;
    } catch (e) {
      saving = false;
      if (signedOutError(e)) return;
      if (!failedOnce) toast('Fikk ikke lagret. Prøver igjen …');
      failedOnce = true;
      setTimeout(() => void flush(), 4000);
      return;
    } finally {
      saving = false;
    }
    if (pending.length) void flush();
  };
  const setData = (fn: (d: TeamData) => TeamData) => {
    set((st) => ({ data: fn(st.data) }));
    if (!s().team) return;
    pending.push(fn);
    if (server) void flush();
    else void refresh();
  };
  /** Shows a team this account has joined. */
  const connect = (p: TeamPayload) => {
    pending = [];
    set({ team: { id: p.teamId, role: p.role } });
    applyServer(p);
  };
  const refresh = async () => {
    const team = s().team;
    if (!team || saving) return;
    // With unsaved changes, only fetch if we have never loaded the server copy (e.g. right after a reload).
    if (server && pending.length) return;
    try {
      if (server && (await teamVersion(team.id)) === s().version) return;
      const p = await getTeam(team.id, team.role);
      if (!server || !pending.length) applyServer(p);
      if (pending.length) void flush();
    } catch (e) {
      signedOutError(e);
    }
  };
  const netError = 'Fikk ikke kontakt. Sjekk nettet og prøv igjen.';

  /** Tells the team's phones about something new. Only coaches can; it does nothing for others. */
  const notify = async (kind: 'posts' | 'matches' | 'results', title: string, body: string) => {
    const team = s().team;
    if (!team || team.role !== 'coach') return;
    try {
      const token = await accessToken();
      await fetch('/api/notify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + token },
        body: JSON.stringify({ teamId: team.id, kind, title, body }),
      });
    } catch {}
  };

  const setForm = (p: AppState['form']) => set((st) => ({ form: { ...st.form, ...p } }));
  const setProf = <R extends keyof Profiles>(r: R, patch: Partial<Profiles[R]>) =>
    set((st) => ({ prof: { ...st.prof, [r]: { ...st.prof[r], ...patch } } }));
  const updPlayer = (id: string, patch: Partial<Player>) =>
    setData((d) => ({ ...d, players: d.players.map((p) => (p.id === id ? { ...p, ...patch } : p)) }));
  const toast = (msg: string) => {
    set({ toastMsg: msg });
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => set({ toastMsg: null }), 2600);
  };
  const go = (screen: Screen) => {
    set({ screen });
    scrollTop();
  };
  const ask = (title: string, body: string, label: string, action: () => void) =>
    set({ sheet: 'confirm', confirm: { title, body, label, action } });
  const setPC = (p: Partial<SignedForm>) =>
    set((st) => ({ pcons: { ...(st.pcons || { step: 1, p: null, ps: null, err: '' }), ...p, err: p.err || '' } }));
  const setCons = (p: Partial<ParentConsentDraft>) => set((st) => ({ cons: { ...(st.cons || defCons()), ...p } }));
  const setPay = (p: Partial<PayForm>) => set((st) => ({ pay: { ...(st.pay || newPay()), ...p } }));

  const enterApp = (r: Role) => {
    set((st) => ({
      role: r,
      screen: 'app',
      tab: 'lag',
      filter: 'all',
      openMatch: null,
      cons: null,
      consCtx: null,
      sheet: null,
      payCtx: null,
      pay: null,
      onboarded: { ...st.onboarded, [r]: true },
    }));
    scrollTop();
  };

  // ---------- Onboarding steps ----------

  const submitLogin = async () => {
    const email = s().flow.contact.trim().toLowerCase();
    if (!isEmail(email)) return setFlow({ err: 'Skriv inn en gyldig e-postadresse.' });
    setFlow({ contact: email, busy: true, err: '', otp: '' });
    // Already signed in with this email on this device: no need for a new code.
    const session = await currentSession();
    if (session && session.email === email) {
      setFlow({ busy: false });
      set({ uid: session.id });
      return afterLogin();
    }
    try {
      await sendCode(email);
    } catch (e) {
      const msg = e instanceof Error ? e.message : '';
      return setFlow({
        busy: false,
        err: /rate|seconds|many/i.test(msg) ? 'Du har bedt om mange koder. Vent litt og prøv igjen.' : netError,
      });
    }
    setFlow({ busy: false });
    go('otp');
    toast('Vi har sendt en kode til ' + email);
  };

  const resendCode = async () => {
    try {
      await sendCode(s().flow.contact);
      toast('Ny kode er sendt');
    } catch {
      toast('Vent litt før du ber om en ny kode.');
    }
  };

  const afterOtp = async () => {
    const st = s();
    if (st.screen !== 'otp' || !st.flow.role || st.flow.busy) return;
    if (st.flow.otp.length !== 6) return setFlow({ err: 'Koden har 6 sifre.' });
    setFlow({ busy: true, err: '' });
    try {
      const uid = await verifyCode(st.flow.contact, st.flow.otp);
      set({ uid });
    } catch {
      return setFlow({ busy: false, otp: '', err: 'Koden stemmer ikke eller er utløpt. Prøv igjen eller be om en ny.' });
    }
    setFlow({ busy: false });
    await afterLogin();
  };

  /** After signing in: go straight into a team this account already belongs to, or continue sign-up. */
  const afterLogin = async () => {
    const st = s();
    const r = st.flow.role;
    if (!r) return;
    const wanted: MemberRole = r;
    if (!(r === 'coach' && st.flow.coachMode === 'create')) {
      try {
        const mine = (await myTeams()).filter((m) => m.role === wanted);
        const pick = mine.find((m) => m.teamId === st.team?.id) || mine[0];
        if (pick) {
          const p = await getTeam(pick.teamId, wanted);
          connect(p);
          if (wanted === 'player') setProf('player', { playerId: pick.playerId });
          if (wanted === 'parent') setProf('parent', { childId: pick.playerId });
          if (wanted === 'sub') {
            const own = p.data.subs.find((x) => x.id === mySubId());
            if (!own) {
              // Joined before but never finished paying.
              setFlow({ peek: { code: p.data.teamCode || '', teamName: p.data.teamName || '', isCoachCode: false, players: p.data.players }, terms: false });
              return go('terms');
            }
            setProf('sub', { viaId: own.via, name: own.name, active: true, cancelled: false, startedAt: own.since, autoRenew: own.autoRenew !== false });
          }
          enterApp(wanted);
          toast('Velkommen tilbake!');
          return;
        }
      } catch {
        return setFlow({ err: netError });
      }
    }
    const next: Record<Role, Screen> = {
      player: 'teamCode',
      parent: 'teamCode',
      sub: 'invite',
      coach: st.flow.coachMode === 'create' ? 'createTeam' : 'coachCode',
    };
    go(next[r]);
  };

  /** Looks up a code while showing a busy state. Returns null (and shows an error) if the network fails. */
  const lookup = async (code: string) => {
    setFlow({ busy: true, err: '' });
    try {
      const p = await peekTeam(code);
      setFlow({ busy: false, peek: p ? { code, teamName: p.teamName, isCoachCode: p.isCoachCode, players: p.players } : null });
      return p;
    } catch {
      setFlow({ busy: false, err: netError });
      return null;
    }
  };

  /** Joins the team in flow.peek with the given role. */
  const join = async (role: MemberRole, playerId: string | null) => {
    const peek = s().flow.peek;
    if (!peek) return false;
    setFlow({ busy: true, err: '' });
    try {
      const p = await joinTeam(peek.code, role, playerId);
      if (!p) throw new Error('not_found');
      connect(p);
      setFlow({ busy: false });
      return true;
    } catch {
      setFlow({ busy: false, err: netError });
      return false;
    }
  };

  const submitTeam = async () => {
    const c = s().flow.teamCode.replace(/\s/g, '').toUpperCase();
    if (c.length < 4) return setFlow({ err: 'Skriv inn lagkoden.' });
    const p = await lookup(c);
    if (s().flow.err) return;
    if (!p) return setFlow({ err: 'Fant ikke noe lag med den koden.' });
    setFlow({ err: '', pickId: null, search: '' });
    go('pickPlayer');
  };

  const submitPick = async () => {
    const st = s();
    const id = st.flow.pickId;
    if (!id) return setFlow({ err: st.flow.role === 'player' ? 'Velg deg selv fra lista.' : 'Velg barnet ditt fra lista.' });
    const role: MemberRole = st.flow.role === 'parent' ? 'parent' : 'player';
    if (!(await join(role, id))) return;
    if (role === 'player') {
      setProf('player', { playerId: id });
      set({ pcons: { step: 1, adult: !!st.flow.adult, p: null, g: null, ps: null, gs: null, err: '' }, pcCtx: null });
      go('pconsent');
    } else {
      setProf('parent', { childId: id });
      set({ cons: defCons(), consCtx: null });
      go('consent');
    }
  };

  const submitInvite = async () => {
    const raw = s().flow.invite.replace(/\s/g, '').toUpperCase();
    if (raw.length < 4) return setFlow({ err: 'Skriv inn lagkoden.' });
    const p = await lookup(raw);
    if (s().flow.err) return;
    if (!p) return setFlow({ err: 'Fant ikke noe lag med den koden.' });
    const via = s().flow.inviteVia;
    setFlow({ err: '', inviteVia: via && p.players.some((x) => x.id === via) ? via : null, terms: false });
    go('terms');
  };

  const submitTerms = async () => {
    const f = s().flow;
    const name = (f.subName || '').trim().replace(/\s+/g, ' ');
    if (name.length < 2) return setFlow({ err: 'Skriv inn navnet ditt.' });
    if (!f.inviteVia) return setFlow({ err: 'Velg hvem som vervet deg.' });
    if (!f.terms) return setFlow({ err: 'Du må godta vilkårene for å fortsette.' });
    if (!(await join('sub', null))) return;
    setProf('sub', { name });
    setFlow({ err: '' });
    set({ pay: newPay() });
    go('pay');
  };

  const hasFullName = (n?: string) => (n || '').trim().split(/\s+/).length >= 2;

  const submitCoach = async () => {
    const f = s().flow;
    const c = f.coachCode.replace(/\s/g, '').toUpperCase();
    if (!hasFullName(f.coachName)) return setFlow({ err: 'Skriv inn fornavn og etternavn.' });
    if (c.length < 4) return setFlow({ err: 'Skriv inn trenerkoden.' });
    const p = await lookup(c);
    if (s().flow.err) return;
    if (!p || !p.isCoachCode) return setFlow({ err: 'Koden stemmer ikke. Spør en annen trener på laget.' });
    set({ pcons: { step: 1, coach: true, mode: 'join', p: null, ps: null, err: '' } });
    setFlow({ err: '' });
    go('cconsent');
  };

  const submitCreateTeam = () => {
    const f = s().flow;
    const n = (f.teamName || '').trim().replace(/\s+/g, ' ');
    const cc = (f.newCoachCode || '').trim().toUpperCase();
    const tc = (f.newTeamCode || '').trim().toUpperCase();
    if (!hasFullName(f.coachName)) return setFlow({ err: 'Skriv inn ditt fornavn og etternavn.' });
    if (n.length < 2) return setFlow({ err: 'Skriv inn navnet på laget.' });
    if (cc.length < 6) return setFlow({ err: 'Trenerkoden må ha minst 6 tegn.' });
    if (tc.length < 6) return setFlow({ err: 'Lagkoden må ha minst 6 tegn.' });
    if (cc === tc) return setFlow({ err: 'Trenerkoden og lagkoden må være forskjellige.' });
    set({ pcons: { step: 1, coach: true, mode: 'create', pending: { n, cc, tc }, p: null, ps: null, err: '' } });
    setFlow({ err: '' });
    go('cconsent');
  };

  /** Uploads a signature drawn on the canvas to the team's private folder. */
  const storeSignature = async (sig: string | null | undefined) => {
    const team = s().team;
    if (!sig || !sig.startsWith('data:') || !team) return sig || null;
    try {
      return await uploadMedia(team.id, sig);
    } catch {
      return sig;
    }
  };

  const pcFinish = async (ok: boolean, by: 'player' | 'parent' | null) => {
    const st = s();
    const c = st.pcons || ({} as SignedForm);
    const id = st.prof.player.playerId;
    setPC({ busy: true });
    const [playerSig, parentSig] = ok ? await Promise.all([storeSignature(c.ps), c.adult ? null : storeSignature(c.gs)]) : [null, null];
    if (id)
      updPlayer(id, {
        consent: ok
          ? { photo: true, video: true, name: true, tag: true, at: Date.now(), adult: !!c.adult, playerSig, parentSig }
          : null,
        declined: ok ? null : by,
      });
    const inApp = st.pcCtx === 'app';
    set({ pcons: null, pcCtx: null });
    if (inApp) return toast(ok ? 'Samtykket er lagret' : 'Du er ikke med på bilder');
    enterApp('player');
    toast(
      ok ? 'Takk! Samtykket er signert.' : by === 'parent' ? 'Lagret. Foresatt har ikke godkjent bilder.' : 'Lagret. Du er ikke med på bilder.',
    );
  };

  const payDone = () => {
    const st = s();
    const p = st.pay || newPay();
    const ctx = st.payCtx || 'flow';
    const now = Date.now();
    const last4 = p.method === 'card' ? p.num.replace(/\s/g, '').slice(-4) : st.prof.sub.last4;
    const m0 = new Date(new Date().getFullYear(), new Date().getMonth(), 1).getTime();
    const amount = price(st);
    const team = Math.round(amount * 70) / 100;
    const autoRenew = p.autoRenew !== false;
    const addSub = (id: string, name: string, rel: string, via: string | null) =>
      setData((d) => {
        const L = d.payments || [];
        const paid = L.some((x) => x.subId === id && x.at >= m0);
        return {
          ...d,
          subs: [{ id, name, rel, via, since: now, autoRenew }, ...d.subs.filter((x) => x.id !== id)],
          payments: paid ? L : [...L, { id: 'pay' + id + now, subId: id, name, at: now, amount, team }],
        };
      });
    const subName = st.prof.sub.name || 'Abonnent';
    if (ctx === 'flow') {
      const via = st.flow.inviteVia || st.data.players[0]?.id || null;
      setProf('sub', { viaId: via, active: true, cancelled: false, method: p.method, last4, startedAt: now, autoRenew });
      addSub(mySubId(), subName, '', via);
      enterApp('sub');
      toast('Velkommen! Du følger nå laget.');
    } else if (ctx === 'parent') {
      const c = st.data.players.find((x) => x.id === st.prof.parent.childId);
      setProf('parent', { subscribed: true });
      addSub('par-' + st.uid, c ? c.parent.name || 'Foresatt' : 'Foresatt', 'forelder', c ? c.id : null);
      set({ payCtx: null, pay: null });
      toast('Nå følger du hele laget!');
    } else {
      setProf('sub', { active: true, cancelled: false, method: p.method, last4, startedAt: now, autoRenew });
      addSub(mySubId(), subName, '', st.prof.sub.viaId);
      set({ payCtx: null, pay: null });
      toast('Abonnementet er i gang igjen');
    }
  };

  const mySubId = () => 'sub-' + s().uid;

  const mkPlayer = (players: Player[], name: string): Player => ({
    id: 'p' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
    name,
    born: null,
    num: Math.max(0, ...players.map((p) => p.num || 0)) + 1,
    parent: { name: '', phone: '', email: '' },
    consent: null,
    selfLogin: false,
  });

  return {
    ...loadState(),

    refresh,
    startInvite: (code, via) => {
      set({ flow: { ...blankFlow(), role: 'sub', invite: code.toUpperCase(), inviteVia: via } });
      go('login');
    },
    toast,
    go,
    setFlow,
    setData,
    setForm,
    setProf,
    updPlayer,
    ask,
    setPC,
    setCons,
    setPay,
    enterApp,
    toggleTheme: () => set((st) => ({ theme: st.theme === 'dark' ? 'light' : 'dark' })),

    // ---------- Onboarding ----------

    chooseRole: (r) => {
      set({ flow: { ...blankFlow(), role: r === 'player' ? null : r } });
      go(r === 'player' ? 'playerKind' : r === 'coach' ? 'coachChoice' : 'login');
    },
    choosePlayerKind: (adult) => {
      setFlow({ role: 'player', adult, err: '' });
      go('login');
    },
    chooseCoachMode: (mode) => {
      setFlow({ coachMode: mode, err: '' });
      go('login');
    },
    flowSubmit: () => {
      const handlers: Partial<Record<Screen, () => void>> = {
        login: submitLogin,
        otp: afterOtp,
        teamCode: submitTeam,
        pickPlayer: submitPick,
        invite: submitInvite,
        terms: submitTerms,
        coachCode: submitCoach,
        createTeam: submitCreateTeam,
      };
      handlers[s().screen]?.();
    },
    setOtp: (raw) => {
      const v = raw.replace(/\D/g, '').slice(0, 6);
      setFlow({ otp: v, err: '' });
      if (v.length === 6) {
        clearTimeout(otpTimer);
        otpTimer = setTimeout(afterOtp, 280);
      }
    },
    suggestCodes: () => {
      const f = s().flow;
      const base = ascii((f.teamName || '').trim() || 'LAGET')
        .toUpperCase()
        .replace(/[^A-Z0-9 ]/g, '');
      const w = base.split(' ').filter(Boolean);
      const r = () => String(10 + Math.floor(Math.random() * 90));
      setFlow({ newCoachCode: (w[0] || 'LAG').slice(0, 10) + '-TRENER' + r(), newTeamCode: w.join('').slice(0, 10) + r(), err: '' });
    },
    back: () => {
      const st = s();
      const r = st.flow.role;
      const map: Partial<Record<Screen, Screen>> = {
        playerKind: 'role',
        login: r === 'player' || r === 'parent' ? 'playerKind' : r === 'coach' ? 'coachChoice' : 'role',
        coachChoice: 'role',
        pconsent: 'pickPlayer',
        otp: 'login',
        teamCode: 'login',
        pickPlayer: 'teamCode',
        invite: 'login',
        terms: 'invite',
        coachCode: 'login',
        createTeam: 'login',
        pay: 'terms',
        consent: 'pickPlayer',
      };
      setFlow({ err: '' });
      go(map[st.screen] || 'role');
    },
    logout: () => {
      pending = [];
      server = null;
      void signOut();
      set({
        role: null,
        team: null,
        onboarded: {},
        data: emptyTeam(),
        version: 0,
        screen: 'role',
        flow: blankFlow(),
        sheet: null,
        payCtx: null,
        pay: null,
        tab: 'lag',
        openMatch: null,
      });
      scrollTop();
    },
    switchRole: () => {
      set({ role: null, screen: 'role', flow: blankFlow(), sheet: null, payCtx: null, pay: null, tab: 'lag', openMatch: null });
      scrollTop();
    },
    resendCode,

    // ---------- Parent consent wizard ----------

    consNext: () => setCons({ step: Math.min(4, (s().cons || defCons()).step + 1) }),
    consBack: () => {
      const c = s().cons || defCons();
      if (c.step > 1) return setCons({ step: c.step - 1 });
      if (s().consCtx === 'app') return set({ consCtx: null, cons: null });
      go('pickPlayer');
    },
    consToggle: (k) => {
      const c = s().cons || defCons();
      setCons({ draft: { ...c.draft, [k]: !c.draft[k] } });
    },
    consGive: () => {
      const st = s();
      const c = st.cons || defCons();
      const inApp = st.consCtx === 'app';
      if (!c.check) return toast('Kryss av for at du er foresatt først');
      const any = Object.values(c.draft).some(Boolean);
      if (st.prof.parent.childId) updPlayer(st.prof.parent.childId, { consent: any ? { ...c.draft, at: Date.now() } : null });
      if (inApp) {
        set({ consCtx: null, cons: null });
        toast('Samtykket er oppdatert');
      } else {
        enterApp('parent');
        toast('Takk! Samtykket er lagret.');
      }
    },
    consLater: () => {
      if (s().consCtx === 'app') return set({ consCtx: null, cons: null });
      enterApp('parent');
      toast('Du kan gi samtykke senere under Min side');
    },
    editParentConsent: () => {
      const st = s();
      const cc = st.data.players.find((p) => p.id === st.prof.parent.childId)?.consent;
      set({
        cons: { step: 1, draft: { photo: !!cc?.photo, video: !!cc?.video, name: !!cc?.name, tag: !!cc?.tag }, check: false },
        consCtx: 'app',
      });
    },
    withdrawConsent: () => {
      const st = s();
      const child = st.data.players.find((p) => p.id === st.prof.parent.childId);
      if (!child) return;
      const kf = firstName(child.name);
      ask('Trekke samtykket?', 'Innlegg der ' + kf + ' er merket, blir skjult med en gang. Du kan gi samtykke igjen senere.', 'Trekk samtykke', () => {
        updPlayer(child.id, { consent: null });
        toast('Samtykket er trukket');
      });
    },

    // ---------- Signed forms ----------

    pcNext: () => {
      const c = s().pcons || ({ step: 1 } as SignedForm);
      const minor = !c.adult;
      if (c.step === 1) {
        if (!c.p) return setPC({ err: 'Velg ett av alternativene.' });
        if (c.p === 'yes' && !c.ps) return setPC({ err: 'Skriv signaturen din i feltet.' });
        if (c.p === 'no') return pcFinish(false, 'player');
        if (minor) {
          setPC({ step: 2 });
          scrollTop();
          return;
        }
        return pcFinish(true, null);
      }
      if (!c.g) return setPC({ err: 'Velg ett av alternativene.' });
      if (c.g === 'yes' && !c.gs) return setPC({ err: 'Foresatt må signere i feltet.' });
      pcFinish(c.g === 'yes', c.g === 'yes' ? null : 'parent');
    },
    pcBack: () => {
      const c = s().pcons;
      if (c?.step === 2) return setPC({ step: 1 });
      if (s().pcCtx === 'app') return set({ pcCtx: null, pcons: null });
      get().back();
    },
    openPlayerConsent: () => {
      const st = s();
      const pc = st.data.players.find((p) => p.id === st.prof.player.playerId)?.consent;
      set({
        pcCtx: 'app',
        pcons: { step: 1, adult: pc ? pc.adult !== false : !!st.flow.adult, p: null, g: null, ps: null, gs: null, err: '' },
      });
    },
    ccNext: async () => {
      const st = s();
      const c = st.pcons;
      if (!c?.p) return setPC({ err: 'Velg ett av alternativene.' });
      if (c.busy) return;
      if (c.p === 'no') {
        set({ pcons: null, flow: blankFlow() });
        go('role');
        toast('Du får ikke tilgang til laget uten å godta reglene.');
        return;
      }
      if (!c.ps) return setPC({ err: 'Skriv signaturen din i feltet.' });
      setPC({ busy: true });
      const cn = (st.flow.coachName || '').trim().replace(/\s+/g, ' ') || COACH;
      const rec = { id: 'cc' + Date.now(), name: cn, contact: st.flow.contact || '', at: Date.now(), sig: '', mode: c.mode || 'join' };
      if (c.mode === 'create' && c.pending) {
        const { n, cc, tc } = c.pending;
        try {
          connect(await createTeam(n, cc, tc, emptyTeam()));
          const sig = (await storeSignature(c.ps)) || '';
          setData((d) => ({ ...d, coachConsents: [{ ...rec, sig }] }));
        } catch (e) {
          set({ pcons: null });
          go('createTeam');
          setFlow({ err: e instanceof CodeTakenError ? 'En av kodene er allerede i bruk. Velg andre koder.' : netError });
          return;
        }
        setProf('coach', { name: cn });
        set({ pcons: null });
        enterApp('coach');
        set({ tab: 'min' });
        toast(n + ' er opprettet. Legg inn spillerne.');
        return;
      }
      if (!(await join('coach', null))) return setPC({ busy: false, err: netError });
      const sig = (await storeSignature(c.ps)) || '';
      setProf('coach', { name: cn });
      setData((d) => ({ ...d, coachConsents: [...(d.coachConsents || []), { ...rec, sig }] }));
      set({ pcons: null });
      enterApp('coach');
      toast('Velkommen, trener!');
    },
    ccBack: () => {
      const m = s().pcons?.mode;
      set({ pcons: null });
      go(m === 'create' ? 'createTeam' : 'coachCode');
    },

    // ---------- Payment ----------

    openPay: (ctx) => set({ payCtx: ctx, pay: newPay() }),
    payBack: () => {
      if (s().payCtx) return set({ payCtx: null, pay: null });
      get().back();
    },
    setCard: (field, raw) => {
      const d = raw.replace(/\D/g, '');
      if (field === 'num') return setPay({ num: d.slice(0, 16).replace(/(.{4})/g, '$1 ').trim(), err: '' });
      if (field === 'exp') {
        let e = d.slice(0, 4);
        if (e.length > 2) e = e.slice(0, 2) + '/' + e.slice(2);
        return setPay({ exp: e, err: '' });
      }
      setPay({ cvc: d.slice(0, 3), err: '' });
    },
    setPayMethod: (m) => {
      if (m === 'vipps') return toast('Vipps kommer snart');
      setPay({ method: m, err: '' });
    },
    paySubmit: () => {
      const p = s().pay || newPay();
      if (p.busy) return;
      if (p.method === 'card') {
        const n = p.num.replace(/\s/g, '');
        const [mm, yy] = p.exp.split('/');
        if (n.length < 16) return setPay({ err: 'Kortnummeret må ha 16 sifre.' });
        if (!mm || !yy || +mm < 1 || +mm > 12 || yy.length < 2) return setPay({ err: 'Sjekk utløpsdatoen (MM/ÅÅ).' });
        if (p.cvc.length < 3) return setPay({ err: 'CVC er de tre sifrene bak på kortet.' });
      }
      setPay({ busy: true, err: '' });
      setTimeout(payDone, 1300);
    },

    // ---------- App ----------

    setTab: (t) => {
      set({ tab: t, openMatch: null });
      scrollTop();
    },
    setFilter: (f) => set({ filter: f }),
    setKampTab: (t) => set({ kampTab: t, openMatch: null }),
    openMatchView: (id) => {
      set({ tab: 'kamper', openMatch: id });
      scrollTop();
    },
    closeMatch: () => {
      set({ openMatch: null, kampTab: 'played' });
      scrollTop();
    },
    goKamper: () => {
      set({ tab: 'kamper', kampTab: 'upcoming', openMatch: null });
      scrollTop();
    },
    toggleLike: (id) => {
      const r = s().uid;
      setData((d) => ({
        ...d,
        posts: d.posts.map((p) =>
          p.id !== id ? p : { ...p, likedBy: p.likedBy.includes(r) ? p.likedBy.filter((x) => x !== r) : [...p.likedBy, r] },
        ),
      }));
    },
    openViewer: (postId, i) => set({ viewer: { postId, i } }),
    closeViewer: () => set({ viewer: null }),
    stepViewer: (dir) => {
      const v = s().viewer;
      if (!v) return;
      const p = s().data.posts.find((x) => x.id === v.postId);
      if (!p) return;
      set({ viewer: { ...v, i: Math.max(0, Math.min(p.media.length - 1, v.i + dir)) } });
    },
    openSheet: (sheet) => set({ sheet }),
    closeSheet: () => {
      if (s().sheet === 'notifs') set({ seenNotifsAt: Date.now() });
      set({ sheet: null, confirm: null, menuPost: null });
    },
    doConfirm: () => {
      const c = s().confirm;
      set({ sheet: null, confirm: null });
      c?.action();
    },
    toggleNotifyMatch: (id) => {
      const on = !s().notifyMatch[id];
      set((st) => ({ notifyMatch: { ...st.notifyMatch, [id]: on } }));
      toast(on ? 'Du får varsel når bildene kommer' : 'Varselet er slått av');
    },
    addToCal: (m) => {
      const st = new Date(m.date + 'T' + m.time);
      const en = new Date(st.getTime() + 90 * 60e3);
      const f = (x: Date) => x.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
      const short = shortTeam(s());
      const title = m.home ? short + ' – ' + m.opp : m.opp + ' – ' + short;
      download(
        'kamp-' + ascii(m.opp || 'kamp').toLowerCase() + '.ics',
        [
          'BEGIN:VCALENDAR',
          'VERSION:2.0',
          'PRODID:-//InnerCircle//NO',
          'BEGIN:VEVENT',
          'UID:' + m.id + '@innercircle.no',
          'DTSTAMP:' + f(new Date()),
          'DTSTART:' + f(st),
          'DTEND:' + f(en),
          'SUMMARY:' + title + ' (G12)',
          'LOCATION:' + m.venue,
          'END:VEVENT',
          'END:VCALENDAR',
        ].join('\r\n'),
        'text/calendar',
      );
      toast('Kampen er lagt i kalenderen');
    },
    showMap: (m) => {
      try {
        window.open('https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent(m.venue), '_blank', 'noopener');
      } catch {}
      toast('Åpner kart for ' + m.venue);
    },

    // ---------- Coach ----------

    openAddMatch: () =>
      set({
        sheet: 'addMatch',
        form: {
          note: '',
          title: '',
          opp: '',
          date: iso(new Date(Date.now() + 7 * DAY)),
          meet: '11:15',
          time: '12:00',
          venue: '',
          home: true,
          kind: 'Serie',
          featured: false,
          err: '',
        },
      }),
    saveMatch: () => {
      const f = s().form as Record<string, string | boolean>;
      const title = String(f.title || '').trim();
      const opp = String(f.opp || '').trim();
      const venue = String(f.venue || '').trim();
      if (!title && !opp) return setForm({ err: 'Gi kampen en tittel.' });
      if (!f.date) return setForm({ err: 'Velg dato for kampen.' });
      if (!f.meet && !f.time) return setForm({ err: 'Legg inn oppmøtetid.' });
      if (!venue) return setForm({ err: 'Skriv inn hvor kampen spilles.' });
      const m: Match = {
        id: 'm' + Date.now(),
        title,
        opp,
        date: String(f.date),
        time: String(f.time || f.meet),
        meet: String(f.meet || ''),
        venue,
        home: !!f.home,
        kind: f.kind === 'Cup' ? 'Cup' : 'Serie',
        featured: !!f.featured,
        note: String(f.note || '').trim(),
        us: null,
        them: null,
      };
      setData((d) => ({ ...d, matches: [...d.matches.map((x) => (m.featured ? { ...x, featured: false } : x)), m] }));
      set({ sheet: null, tab: 'kamper', kampTab: isPlayed(m) ? 'played' : 'upcoming', openMatch: null });
      scrollTop();
      toast(matchTitle(s(), m) + ' er lagt til');
      void notify('matches', teamName(s()), 'Ny kamp: ' + matchTitle(s(), m) + ', ' + fmtDay(m.date) + ' kl. ' + m.time);
    },
    openResult: (id) => {
      const m = s().data.matches.find((x) => x.id === id);
      if (!m) return;
      set({ sheet: 'result', form: { matchId: id, us: m.us ?? 0, them: m.them ?? 0 } });
    },
    stepResult: (k, dir) => {
      const v = Number(s().form[k]) || 0;
      setForm({ [k]: Math.max(0, Math.min(30, v + dir)) });
    },
    saveResult: () => {
      const f = s().form;
      setData((d) => ({
        ...d,
        matches: d.matches.map((m) => (m.id === f.matchId ? { ...m, us: Number(f.us), them: Number(f.them) } : m)),
      }));
      set({ sheet: null });
      toast('Resultatet er lagret');
      const rm = s().data.matches.find((m) => m.id === f.matchId);
      if (rm) void notify('results', teamName(s()), 'Resultat: ' + scoreTitle(s(), rm));
    },
    openComposer: (postId) => {
      const st = s();
      let dr: Draft;
      const p = postId ? st.data.posts.find((x) => x.id === postId) : null;
      if (p) {
        dr = { id: p.id, type: p.type, matchId: p.matchId || '', media: p.media.slice(), tagged: p.tagged.slice(), text: p.text, notify: false };
      } else {
        const last = st.data.matches.filter(isPlayed).sort((a, b) => matchTime(b) - matchTime(a))[0];
        dr = { id: null, type: 'kamp', matchId: last ? last.id : '', media: [], tagged: [], text: '', notify: true };
      }
      set({ draft: dr, sheet: 'composer', menuPost: null });
    },
    setDraft: (p) => set((st) => ({ draft: st.draft ? { ...st.draft, ...p } : st.draft })),
    addFiles: async (files) => {
      const team = s().team;
      const picked = files.filter((f) => f.type.startsWith('image/') || f.type.startsWith('video/'));
      if (!picked.length || !team) return;
      get().setDraft({ loading: true });
      const out: Media[] = [];
      for (const f of picked.slice(0, 10)) {
        const id = 'm' + Date.now() + Math.random().toString(36).slice(2, 6);
        try {
          if (f.type.startsWith('video/')) {
            if (f.size > MAX_VIDEO) {
              toast('Videoen er for stor. Maks 50 MB, omtrent ett minutt.');
              continue;
            }
            const dur = await videoDuration(f);
            out.push({ id, kind: 'video', src: await uploadMedia(team.id, f), label: 'videoklipp', dur });
          } else {
            out.push({ id, kind: 'photo', src: await uploadMedia(team.id, await resizeImage(f)), label: 'bilde' });
          }
        } catch {
          toast('Fikk ikke lastet opp ' + (f.type.startsWith('video/') ? 'videoen' : 'ett av bildene') + '. Prøv igjen.');
        }
      }
      set((st) => ({ draft: st.draft ? { ...st.draft, loading: false, media: [...st.draft.media, ...out] } : st.draft }));
    },
    removeMedia: (id) => set((st) => ({ draft: st.draft && { ...st.draft, media: st.draft.media.filter((m) => m.id !== id) } })),
    publish: () => {
      const st = s();
      const dr = st.draft;
      if (!dr) return;
      if (!dr.text.trim() && !dr.media.length) return toast('Legg til tekst eller bilder først');
      const matchId = dr.type === 'kamp' && dr.matchId ? dr.matchId : null;
      if (dr.id) {
        setData((d) => ({
          ...d,
          posts: d.posts.map((p) =>
            p.id === dr.id ? { ...p, type: dr.type, matchId, media: dr.media, tagged: dr.tagged, text: dr.text.trim(), edited: true } : p,
          ),
        }));
        set({ sheet: null, draft: null });
        toast('Innlegget er oppdatert');
        return;
      }
      const now = Date.now();
      const author = coachName(st);
      const post: Post = {
        id: 'post' + now,
        type: dr.type,
        authorId: 'coach',
        author,
        authorRole: 'Trener',
        ts: now,
        matchId,
        media: dr.media,
        tagged: dr.tagged,
        text: dr.text.trim(),
        likes: 0,
        likedBy: [],
      };
      const notifyAll = dr.notify !== false;
      setData((d) => ({
        ...d,
        posts: [post, ...d.posts],
        notifs: notifyAll ? [{ id: 'n' + now, text: 'Nytt innlegg fra ' + author, ts: now, read: false, from: 'coach' as const }, ...d.notifs] : d.notifs,
      }));
      set({ sheet: null, draft: null, tab: 'lag', filter: 'all', openMatch: null });
      if (notifyAll) void notify('posts', teamName(s()), author + ': ' + (post.text || (post.media.length === 1 ? 'Nytt bilde' : 'Nye bilder')).slice(0, 120));
      scrollTop();
      toast(notifyAll ? 'Publisert. Laget er varslet.' : 'Innlegget er publisert');
    },
    deletePost: (id) =>
      ask('Slette innlegget?', 'Innlegget og bildene forsvinner for alle. Dette kan ikke angres.', 'Slett', () => {
        setData((d) => ({ ...d, posts: d.posts.filter((p) => p.id !== id) }));
        toast('Innlegget er slettet');
      }),
    copyCode: (code, label) => copyText(code, () => toast(label + ' er kopiert')),
    openPrice: () => set({ sheet: 'price', form: { price: String(price(s())), err: '' } }),
    stepPrice: (dir) => {
      const v = parseInt(String(s().form.price), 10) || 0;
      setForm({ price: String(Math.max(10, Math.min(200, v + dir * 5))), err: '' });
    },
    savePrice: () => {
      const v = parseInt(String(s().form.price), 10);
      if (!v || v < 10 || v > 200) return setForm({ err: 'Prisen må være mellom 10 og 200 kr.' });
      setData((d) => ({ ...d, price: v }));
      set({ sheet: null });
      toast('Prisen er nå ' + v + ' kr i måneden');
    },
    openPayout: () => {
      const p = s().data.payout;
      set({ sheet: 'payout', form: { acctOwner: p?.owner || teamName(s()), acct: p?.acct ? fmtAcct(p.acct) : '', err: '' } });
    },
    savePayout: () => {
      const f = s().form;
      const owner = String(f.acctOwner || '').trim();
      const n = String(f.acct || '').replace(/\D/g, '');
      if (!owner) return setForm({ err: 'Skriv inn hvem som eier kontoen.' });
      if (n.length !== 11) return setForm({ err: 'Kontonummeret må ha 11 siffer.' });
      if (!validAcct(n)) return setForm({ err: 'Kontonummeret ser ikke riktig ut. Sjekk sifrene.' });
      setData((d) => ({ ...d, payout: { owner, acct: n, at: Date.now() } }));
      set({ sheet: null });
      toast('Pengene går nå til ' + fmtAcct(n));
    },
    removeSub: (id) => {
      const x = s().data.subs.find((v) => v.id === id);
      ask('Fjerne tilgangen?', (x ? x.name : 'Abonnenten') + ' mister tilgang til bildestrømmen og blir ikke trukket mer.', 'Fjern tilgang', () => {
        setData((d) => ({ ...d, subs: d.subs.filter((v) => v.id !== id) }));
        toast('Tilgangen er fjernet');
      });
    },
    addPlayer: () => {
      const name = s().pf.name.trim().replace(/\s+/g, ' ');
      const setPf = (p: Partial<AppState['pf']>) => set((st) => ({ pf: { ...st.pf, ...p } }));
      if (name.split(' ').length < 2) return setPf({ err: 'Skriv inn fornavn og etternavn.' });
      if (s().data.players.some((p) => p.name.toLowerCase() === name.toLowerCase())) return setPf({ err: name + ' står allerede på lista.' });
      setData((d) => ({ ...d, players: [...d.players, mkPlayer(d.players, name)] }));
      setPf({ name: '', err: '' });
      toast(name + ' er lagt til');
    },
    removePlayer: (id) => {
      const p = s().data.players.find((x) => x.id === id);
      ask(
        'Fjerne ' + (p ? firstName(p.name) : 'spilleren') + '?',
        (p ? p.name : 'Spilleren') + ' fjernes fra laget og kan ikke merkes i nye innlegg.',
        'Fjern',
        () => {
          setData((d) => ({
            ...d,
            players: d.players.filter((x) => x.id !== id),
            posts: d.posts.map((q) => ({ ...q, tagged: q.tagged.filter((t) => t !== id) })),
          }));
          toast('Spilleren er fjernet');
        },
      );
    },
    resetDemo: () =>
      ask(
        'Laste inn eksempeldata?',
        'Laget fylles med 40 eksempelspillere, innlegg, kamper og abonnenter. Det som ligger der nå, erstattes for alle på laget.',
        'Last inn',
        () => {
        setData((d) => ({ ...seedWithLedger(), teamName: d.teamName, teamCode: d.teamCode, coachCode: d.coachCode, coachConsents: d.coachConsents }));
        toast('Eksempeldata er lastet inn');
        },
      ),

    // ---------- Subscriber / family ----------

    cancelSub: () => {
      const until = nextChargeText(s().prof.sub.startedAt);
      ask(
        'Si opp abonnementet?',
        'Du blir ikke trukket mer. Du ser bildene til ' + until + '. Det du allerede har betalt, går fortsatt til laget.',
        'Si opp',
        () => {
          setProf('sub', { cancelled: true });
          setData((d) => ({ ...d, subs: d.subs.filter((x) => x.id !== mySubId()) }));
          toast('Abonnementet er sagt opp');
        },
      );
    },
    copyInvite: (link) =>
      copyText(link, () => {
        set({ copied: true });
        clearTimeout(copiedTimer);
        copiedTimer = setTimeout(() => set({ copied: false }), 2000);
        toast('Lenken er kopiert');
      }),
    shareInvite: (link) => {
      const data = { title: 'Følg ' + teamName(s()) + ' på InnerCircle', text: 'Bli med i lagets lukkede bildestrøm.', url: link };
      if (typeof navigator.share === 'function') navigator.share(data).catch(() => {});
      else get().copyInvite(link);
    },
    removeChildFromPost: (postId) => {
      const childId = s().prof.parent.childId;
      const child = s().data.players.find((p) => p.id === childId);
      if (!child) return;
      setData((d) => ({ ...d, posts: d.posts.map((q) => (q.id === postId ? { ...q, tagged: q.tagged.filter((t) => t !== child.id) } : q)) }));
      toast(firstName(child.name) + ' er fjernet fra innlegget');
    },
  };
});

/** Saves the persisted part of the state whenever it changes. Returns an unsubscribe function. */
export function startPersistence() {
  let last = '';
  let warned = false;
  const save = (st: Store) => {
    const o: Record<string, unknown> = {};
    for (const k of Object.keys(st) as (keyof Store)[]) {
      if (typeof st[k] === 'function' || (EPHEMERAL_KEYS as string[]).includes(k)) continue;
      o[k] = st[k];
    }
    const str = JSON.stringify(o);
    if (str === last) return;
    last = str;
    try {
      localStorage.setItem(LS_KEY, str);
    } catch {
      if (!warned) {
        warned = true;
        setTimeout(() => st.toast('Lagringsplassen er full. Prøv færre eller mindre bilder.'), 0);
      }
    }
  };
  save(useStore.getState());
  return useStore.subscribe(save);
}

/** Receipt text for a subscriber's payment. */
export function receiptText(team: string, at: number, amount: string, method: string) {
  return [
    'KVITTERING – InnerCircle',
    '',
    team,
    'Abonnement, ' + new Date(at).toLocaleDateString(NB, { month: 'long', year: 'numeric' }),
    'Dato: ' + fmtDate(at),
    'Beløp: ' + amount,
    'Betalt med: ' + method,
  ].join('\n');
}
