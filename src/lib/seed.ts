import { ascii, DAY, HOUR, iso } from './format';
import type {
  ConsentKey,
  EphemeralState,
  Flow,
  Media,
  ParentConsentDraft,
  PayForm,
  Payment,
  PersistedState,
  Player,
  PostType,
  Role,
  Subscriber,
  TeamData,
} from './types';

export const LS_KEY = 'innercircle.v2';
export const DEFAULT_TEAM = 'Laget';
export const COACH = 'Trener';
export const DEFAULT_PRICE = 20;

/** Show the test-payment hint on the payment screen. */
export const DEMO_HINTS = true;
/** Show "Bytt rolle" and "Last inn demodata" on Min side. */
export const ROLE_SWITCHER = true;

export const TYPES: Record<PostType, { label: string }> = {
  kamp: { label: 'Kamp' },
  trening: { label: 'Trening' },
  beskjed: { label: 'Beskjed' },
};
export const ROLES: Record<Role, string> = { player: 'Spiller', parent: 'Foresatt', sub: 'Abonnent', coach: 'Trener' };
export const CKEYS: [ConsentKey, string, string][] = [
  ['photo', 'Bilder', 'Bilder fra kamper og treninger'],
  ['video', 'Videoklipp', 'Korte klipp fra kamp og trening'],
  ['name', 'Fornavn i tekst', 'Fornavnet kan stå i teksten til et innlegg'],
  ['tag', 'Merking i innlegg', 'Treneren kan merke barnet, så dere finner bildene'],
];

const FIRST =
  'Emil Noah Filip Jakob Oliver William Lucas Isak Magnus Aksel Theodor Henrik Jonas Elias Matheo Mathias Johannes Liam Sander Leon Kasper Tobias Olav Ludvig Benjamin Adrian Herman Even Sebastian Vetle Martin Ulrik Kristian Markus Brage Mikkel Felix Sigurd Eirik Torstein'.split(
    ' ',
  );
const LAST =
  'Hansen Johansen Olsen Larsen Andersen Pedersen Nilsen Kristiansen Jensen Karlsen Johnsen Pettersen Eriksen Berg Haugen Hagen Johannessen Andreassen Jacobsen Dahl Jørgensen Halvorsen Henriksen Lund Sørensen Strand Moen Iversen Holm Bakken Ruud Lie Amundsen Moe Knutsen Nygård Berntsen Lunde Myhre Fredriksen'.split(
    ' ',
  );
const PARENTS =
  'Marte Thomas Ingrid Lars Camilla Erik Hilde Anders Siri Morten Kristin Jørgen Line Espen Tone Øyvind Anne Petter Lise Håkon'.split(
    ' ',
  );
const SUBF =
  'Bjørg Arne Gunn Knut Eva Rolf Wenche Terje Berit Svein Sissel Geir Turid Jan Unni Kjell Liv Odd Grete Nils Astrid Tor Elin Rune Marit Bjørn Heidi Stein'.split(
    ' ',
  );
const REL = 'mormor morfar farmor farfar tante onkel gudmor gudfar'.split(' ');

/** Demo team: 40 players (2 without consent), 7 matches, 5 posts, 31 subscribers. */
export function seed(): TeamData {
  const now = Date.now();
  const players: Player[] = FIRST.map((f, i) => {
    const l = LAST[i];
    const pf = PARENTS[i % PARENTS.length];
    const missing = i === 6 || i === 13;
    return {
      id: 'p' + (i + 1),
      name: f + ' ' + l,
      born: i % 3 === 0 ? 2013 : 2014,
      num: i + 1,
      parent: {
        name: pf + ' ' + l,
        phone: String(40000000 + (((i + 1) * 7919 * 13) % 9999999)),
        email: ascii(pf + '.' + l).toLowerCase() + '@epost.no',
      },
      consent: missing ? null : { photo: true, video: true, name: true, tag: true, at: now - 40 * DAY },
      selfLogin: false,
    };
  });
  const d = (off: number) => iso(new Date(now + off * DAY));
  const ph = (id: string, hue: number, label: string): Media => ({ id, kind: 'photo', hue, label });
  const vid = (id: string, hue: number, dur: string): Media => ({ id, kind: 'video', hue, label: 'videoklipp', dur });
  const subs: Subscriber[] = [
    { id: 's1', name: 'Inger Hansen', rel: 'mormor', via: 'p1', since: now - 120 * DAY },
    { id: 's2', name: 'Per Hansen', rel: 'farfar', via: 'p1', since: now - 90 * DAY },
    { id: 's3', name: 'Silje Hansen', rel: 'tante', via: 'p1', since: now - 30 * DAY },
  ];
  for (let k = 0; k < 28; k++) {
    const v = players[1 + ((k * 7) % 39)];
    subs.push({
      id: 's' + (k + 4),
      name: SUBF[k] + ' ' + v.name.split(' ')[1],
      rel: REL[k % REL.length],
      via: v.id,
      since: now - (10 + k * 4) * DAY,
    });
  }
  return {
    players,
    matches: [
      { id: 'm1', opp: 'Lørenskog', date: d(5), time: '12:00', venue: 'Lørenskog stadion, bane 2', home: false, kind: 'Serie', us: null, them: null },
      { id: 'm2', opp: 'Strømmen', date: d(13), time: '10:30', venue: 'Solberg kunstgress', home: true, kind: 'Cup', us: null, them: null },
      { id: 'm3', opp: 'Rælingen', date: d(19), time: '13:15', venue: 'Rælingen idrettspark', home: false, kind: 'Serie', us: null, them: null },
      { id: 'm4', opp: 'Lillestrøm', date: d(-2), time: '11:00', venue: 'Solberg kunstgress', home: true, kind: 'Serie', us: 3, them: 2 },
      { id: 'm5', opp: 'Skedsmo', date: d(-8), time: '14:00', venue: 'Skedsmohallen', home: false, kind: 'Serie', us: 1, them: 1 },
      { id: 'm6', opp: 'Fet', date: d(-15), time: '12:30', venue: 'Solberg kunstgress', home: true, kind: 'Cup', us: 4, them: 0 },
      { id: 'm7', opp: 'Bjerke', date: d(-22), time: '10:00', venue: 'Bjerke kunstgress', home: false, kind: 'Serie', us: 0, them: 2 },
    ],
    posts: [
      {
        id: 'post1', type: 'beskjed', authorId: 'ola', author: 'Ola Hansen', authorRole: 'Lagleder', ts: now - 3 * HOUR, matchId: null, media: [],
        text: 'Oppmøte 11:15 på lørdag, borte mot Lørenskog. Ta med drikkeflaske og leggskinn. Vi kjører samlet fra klubbhuset kl. 10:30.',
        tagged: [], likes: 7, likedBy: [],
      },
      {
        id: 'post2', type: 'kamp', authorId: 'coach', author: 'Kari Lund', authorRole: 'Trener', ts: now - 2 * DAY + 5 * HOUR, matchId: 'm4',
        media: [ph('a1', 350, 'kampbilde'), ph('a2', 20, 'målscoring'), ph('a3', 200, 'jubel'), ph('a4', 40, 'lagbilde')],
        text: 'For en snuoperasjon! Under 0–2 ved pause, men gutta ga seg aldri. Emil satte vinnermålet i siste minutt.',
        tagged: ['p1', 'p2', 'p3'], likes: 24, likedBy: [],
      },
      {
        id: 'post3', type: 'trening', authorId: 'coach', author: 'Kari Lund', authorRole: 'Trener', ts: now - 4 * DAY, matchId: null,
        media: [vid('b1', 150, '0:24'), ph('b2', 190, 'treningsbilde')],
        text: 'Pasningsøvelser i regnet. Fin innsats fra alle i dag!', tagged: ['p1', 'p4'], likes: 15, likedBy: [],
      },
      {
        id: 'post4', type: 'kamp', authorId: 'ola', author: 'Ola Hansen', authorRole: 'Lagleder', ts: now - 8 * DAY + 4 * HOUR, matchId: 'm5',
        media: [ph('c1', 260, 'redning'), ph('c2', 330, 'kampbilde'), ph('c3', 30, 'garderoben')],
        text: 'Rettferdig poengdeling i Skedsmohallen. Oliver med en kjempeparade i andre omgang.', tagged: ['p5', 'p6', 'p1'], likes: 31, likedBy: [],
      },
      {
        id: 'post5', type: 'kamp', authorId: 'coach', author: 'Kari Lund', authorRole: 'Trener', ts: now - 15 * DAY + 4 * HOUR, matchId: 'm6',
        media: [ph('d1', 120, 'hattrick'), ph('d2', 10, 'lagbilde')],
        text: 'Videre i cupen etter 4–0 mot Fet. Isak med hattrick!', tagged: ['p8', 'p9'], likes: 19, likedBy: [],
      },
    ],
    subs,
    notifs: [
      { id: 'n1', text: 'Ny beskjed fra Ola Hansen', ts: now - 3 * HOUR, read: false },
      { id: 'n2', text: 'Nye bilder fra kampen mot Lillestrøm', ts: now - 2 * DAY + 5 * HOUR, read: false },
      { id: 'n3', text: 'Kampen mot Lørenskog er lagt inn', ts: now - 3 * DAY, read: true },
    ],
    account: { connected: true, bank: 'Sparebank 1', number: '1503.22.48127' },
    ytdBase: 3640,
    reminders: {},
    reports: [],
  };
}

/** Twelve months of payment history, one payment per subscriber per month. */
export function buildLedger(subs: Subscriber[], price: number): Payment[] {
  const now = new Date();
  const team = Math.round(price * 70) / 100;
  const out: Payment[] = [];
  for (const x of subs) {
    for (let k = 0; k < 12; k++) {
      const a = new Date(now.getFullYear(), now.getMonth() - k, 1).getTime();
      const b = new Date(now.getFullYear(), now.getMonth() - k + 1, 1).getTime();
      const at = Math.max(a, x.since);
      if (at < b && at <= now.getTime()) out.push({ id: 'pay' + x.id + '-' + k, subId: x.id, name: x.name, at, amount: price, team });
    }
  }
  return out;
}

/** A new team with nothing in it yet. */
export const emptyTeam = (): TeamData => ({
  players: [],
  matches: [],
  posts: [],
  subs: [],
  notifs: [],
  payments: [],
  account: { connected: false, bank: '', number: '' },
  ytdBase: 0,
  reminders: {},
  reports: [],
});

const newId = () => {
  try {
    return crypto.randomUUID();
  } catch {
    return Date.now().toString(36) + Math.random().toString(36).slice(2);
  }
};

export function seedWithLedger(): TeamData {
  const d = seed();
  return { ...d, payments: buildLedger(d.subs, DEFAULT_PRICE) };
}

export const blankFlow = (): Flow => ({
  coachName: '',
  coachMode: null,
  newCoachCode: '',
  newTeamCode: '',
  role: null,
  contact: '',
  otp: '',
  teamCode: '',
  pickId: null,
  search: '',
  invite: '',
  inviteVia: null,
  terms: false,
  coachCode: '',
  err: '',
});

export const defCons = (): ParentConsentDraft => ({
  step: 1,
  draft: { photo: false, video: false, name: false, tag: false },
  check: false,
});

export const newPay = (): PayForm => ({ autoRenew: true, method: 'card', num: '', exp: '', cvc: '', err: '', busy: false });

export function freshState(): PersistedState {
  let dark = false;
  try {
    dark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  } catch {}
  return {
    v: 2,
    uid: newId(),
    team: null,
    version: 0,
    seenNotifsAt: 0,
    theme: dark ? 'dark' : 'light',
    screen: 'role',
    flow: blankFlow(),
    cons: null,
    consCtx: null,
    pcons: null,
    pcCtx: null,
    role: null,
    onboarded: {},
    prof: {
      player: { playerId: null },
      parent: { childId: null, subscribed: false },
      sub: {
        viaId: null,
        active: false,
        cancelled: false,
        method: 'card',
        last4: '4242',
        startedAt: null,
        notify: { posts: true, matches: true, results: true },
      },
      coach: {},
    },
    tab: 'lag',
    filter: 'all',
    kampTab: 'upcoming',
    openMatch: null,
    notifyMatch: {},
    data: emptyTeam(),
  };
}

export const ephemeral = (): EphemeralState => ({
  sheet: null,
  viewer: null,
  toastMsg: null,
  draft: null,
  confirm: null,
  form: {},
  pay: null,
  payCtx: null,
  allPlayers: false,
  copied: false,
  menuPost: null,
  subView: 'all',
  pf: { name: '', err: '' },
});
