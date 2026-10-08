export type Role = 'player' | 'parent' | 'sub' | 'coach';
export type Theme = 'light' | 'dark';
export type PostType = 'kamp' | 'trening' | 'beskjed';
export type ConsentKey = 'photo' | 'video' | 'name' | 'tag';

export type Screen =
  | 'role'
  | 'playerKind'
  | 'login'
  | 'otp'
  | 'teamCode'
  | 'pickPlayer'
  | 'invite'
  | 'terms'
  | 'coachChoice'
  | 'coachCode'
  | 'createTeam'
  | 'pay'
  | 'consent'
  | 'pconsent'
  | 'cconsent'
  | 'app';

export type Tab = 'lag' | 'kamper' | 'okonomi' | 'min';

export interface Consent {
  photo: boolean;
  video: boolean;
  name: boolean;
  tag: boolean;
  at: number;
  by?: 'self';
  adult?: boolean;
  playerSig?: string | null;
  parentSig?: string | null;
}

export interface Player {
  id: string;
  name: string;
  born: number | null;
  num: number;
  parent: { name: string; phone: string; email: string };
  consent: Consent | null;
  selfLogin: boolean;
  /** Who said no on the consent form, if anyone. */
  declined?: 'player' | 'parent' | null;
}

export interface Match {
  id: string;
  title?: string;
  opp: string;
  date: string; // yyyy-mm-dd
  time: string; // hh:mm
  meet?: string;
  venue: string;
  home: boolean;
  kind: 'Serie' | 'Cup';
  featured?: boolean;
  note?: string;
  us: number | null;
  them: number | null;
}

export interface Media {
  id: string;
  kind: 'photo' | 'video';
  hue?: number;
  label?: string;
  dur?: string;
  src?: string;
}

export interface Post {
  id: string;
  type: PostType;
  authorId: string;
  author: string;
  authorRole: string;
  ts: number;
  matchId: string | null;
  media: Media[];
  text: string;
  tagged: string[];
  likes: number;
  /** Device user ids that gave a heart. */
  likedBy: string[];
  edited?: boolean;
}

export interface Subscriber {
  id: string;
  name: string;
  rel: string;
  via: string | null;
  since: number;
  autoRenew?: boolean;
}

export interface Notif {
  id: string;
  text: string;
  ts: number;
  read: boolean;
  from?: 'coach';
}

export interface Payment {
  id: string;
  subId: string;
  name: string;
  at: number;
  amount: number;
  team: number;
}

export interface CoachConsentRecord {
  id: string;
  name: string;
  contact: string;
  at: number;
  sig: string;
  mode: 'join' | 'create';
}

export interface TeamData {
  players: Player[];
  matches: Match[];
  posts: Post[];
  subs: Subscriber[];
  notifs: Notif[];
  account: { connected: boolean; bank: string; number: string };
  ytdBase: number;
  reminders: Record<string, number>;
  reports: unknown[];
  teamName?: string;
  teamCode?: string;
  coachCode?: string;
  price?: number;
  payout?: { owner: string; acct: string; at: number };
  payments?: Payment[];
  coachConsents?: CoachConsentRecord[];
}

export interface Flow {
  role: Role | null;
  adult?: boolean;
  coachMode: 'join' | 'create' | null;
  coachName: string;
  contact: string;
  otp: string;
  teamCode: string;
  pickId: string | null;
  search: string;
  invite: string;
  inviteVia: string | null;
  terms: boolean;
  coachCode: string;
  teamName?: string;
  newCoachCode: string;
  newTeamCode: string;
  subName?: string;
  busy?: boolean;
  /** Team found from a code, before joining it. */
  peek?: { code: string; teamName: string; isCoachCode: boolean; players: { id: string; name: string }[] } | null;
  err: string;
}

/** Parent consent wizard (four steps with switches). */
export interface ParentConsentDraft {
  step: number;
  draft: Record<ConsentKey, boolean>;
  check: boolean;
}

/** Signed consent form for players, and the coach rules form. */
export interface SignedForm {
  step: number;
  adult?: boolean;
  coach?: boolean;
  mode?: 'join' | 'create';
  pending?: { n: string; cc: string; tc: string };
  p: 'yes' | 'no' | null;
  g?: 'yes' | 'no' | null;
  ps: string | null;
  gs?: string | null;
  busy?: boolean;
  err: string;
}

export interface SubProfile {
  name?: string;
  viaId: string | null;
  active: boolean;
  cancelled: boolean;
  method: PayMethod;
  last4: string;
  startedAt: number | null;
  autoRenew?: boolean;
  notify: { posts: boolean; matches: boolean; results: boolean };
}

export interface Profiles {
  player: { playerId: string | null };
  parent: { childId: string | null; subscribed: boolean };
  sub: SubProfile;
  coach: { name?: string };
}

export type PayMethod = 'card' | 'apple' | 'google' | 'vipps';

export interface PayForm {
  autoRenew: boolean;
  method: PayMethod;
  num: string;
  exp: string;
  cvc: string;
  err: string;
  busy: boolean;
}

export type SheetName =
  | 'composer'
  | 'addMatch'
  | 'result'
  | 'postMenu'
  | 'confirm'
  | 'notifs'
  | 'price'
  | 'earnings'
  | 'payout'
  | 'subscribers'
  | 'method'
  | 'receipts';

export interface Draft {
  id: string | null;
  type: PostType;
  matchId: string;
  media: Media[];
  tagged: string[];
  text: string;
  notify: boolean;
  loading?: boolean;
}

export interface Confirm {
  title: string;
  body: string;
  label: string;
  action: () => void;
}

/** Saved to localStorage. */
export type MemberRole = 'coach' | 'player' | 'parent' | 'sub';

export interface PersistedState {
  v: 3;
  /** The signed-in account's id, used for hearts and subscriptions. */
  uid: string;
  /** The team this device is showing, and which of your roles on it. */
  team: { id: string; role: MemberRole } | null;
  /** Push notifications are switched on for this device. */
  pushOn?: boolean;
  /** Last server version of the team document this device has seen. */
  version: number;
  /** Notifications newer than this are shown as unread. */
  seenNotifsAt: number;
  theme: Theme;
  screen: Screen;
  flow: Flow;
  cons: ParentConsentDraft | null;
  consCtx: 'app' | null;
  pcons: SignedForm | null;
  pcCtx: 'app' | null;
  role: Role | null;
  onboarded: Partial<Record<Role, boolean>>;
  prof: Profiles;
  tab: Tab;
  filter: 'all' | PostType;
  kampTab: 'upcoming' | 'played';
  openMatch: string | null;
  notifyMatch: Record<string, boolean>;
  data: TeamData;
}

/** Kept in memory only. */
export interface EphemeralState {
  sheet: SheetName | null;
  viewer: { postId: string; i: number } | null;
  toastMsg: string | null;
  draft: Draft | null;
  confirm: Confirm | null;
  form: Record<string, string | number | boolean | undefined>;
  pay: PayForm | null;
  payCtx: 'parent' | 'resub' | null;
  allPlayers: boolean;
  copied: boolean;
  menuPost: string | null;
  subView: 'all' | 'player';
  pf: { name: string; err: string };
}

export type AppState = PersistedState & EphemeralState;
