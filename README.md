# InnerCircle

A mobile web app for a team's private photo stream, built from a Claude Design prototype (`InnerCircle.dc.html`).

Everyone on a team shares the same data: a coach creates the team, players and family log in with their email and join with the team code, and posts, photos, videos, matches, hearts and subscribers are stored in Supabase.

## Set up

1. **Database.** In Supabase, open **SQL Editor → New query**, paste all of [`supabase/schema.sql`](supabase/schema.sql) and press **Run**. It is safe to run again, and it upgrades the first version.
2. **Login emails.** In Supabase, **Authentication → Emails → Templates**: in both **Confirm signup** and **Magic Link**, include the code `{{ .Token }}` in the message. Supabase's built-in email only reaches your own project members; to log in other people, set up custom SMTP (for example Resend) under **Authentication → Emails → SMTP Settings**.
3. **Keys.** The app reads these environment variables. On Vercel the Supabase integration adds the first two.

   ```
   NEXT_PUBLIC_SUPABASE_URL=https://<project>.supabase.co
   NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_…
   VAPID_PRIVATE_KEY=…            # for push notifications (server only, keep secret)
   NEXT_PUBLIC_VAPID_PUBLIC_KEY=… # optional; a default public key is built in
   ```

   `NEXT_PUBLIC_SUPABASE_ANON_KEY` also works. Never put the Supabase service role key in the app. Generate a new VAPID pair with `npx web-push generate-vapid-keys` if you need one, and set both keys.

## Run

```bash
npm install
npm run dev      # http://localhost:3000
npm run build && npm start
npm run lint
```

## How it works

- **Accounts.** Everyone logs in with a 6-digit code sent to their email (Supabase Auth). The account remembers which teams and roles it has, so logging in on a new phone goes straight to the team.
- **Joining.** A coach creates a team with a coach code and a team code. Coaches join with the coach code and sign the coach rules. Players pick themselves from the coach's list and sign the consent form (players under 15 also need a parent's signature). Subscribers join with the team code or a player's invite link (`/?lag=CODE&via=PLAYER`), enter their name, accept the terms and pay. Codes are only used to join; after that, access is checked against the account.
- **Data.** Each team is one row in `public.teams`, holding the team document as JSON, and `public.team_members` records who is on which team as what. Nobody reads the tables directly; the app calls database functions that check the signed-in account.
- **Permissions.** Coaches can change everything. Everyone else can only change their own things: their own hearts, their own player's consent, and their own subscription and payments. Non-coaches don't receive the coach code, the payout account, coach signatures or other people's payments.
- **Saving.** Changes show at once and are saved in order. If someone else saved first, your changes are replayed on top of theirs. The app checks for changes every 8 seconds and when it comes back into view.
- **Photos, videos and signatures** are stored in the private `media` bucket, in a folder per team that only members can open. The app shows them through short-lived signed links. Videos can be up to 50 MB.
- **Push notifications.** On Min side, each person can switch on notifications for their phone and choose posts, matches and results. When a coach posts, adds a match or enters a result, `/api/notify` asks the database for the team's subscribed phones (only coaches may ask) and sends a web push. On iPhone the app must first be added to the Home Screen.

## Not real yet

- **Payment.** The payment screen is a test; no money is charged.

## Structure

```
supabase/schema.sql    database table, functions, photo bucket
src/
  app/                 layout (fonts, theme before first paint), page, globals.css (tokens + shared classes),
                       manifest.ts (installable app), api/notify (sends push notifications)
  lib/
    supabase.ts        login, database calls, private media upload and signed links
    push.ts            push notification subscribe/unsubscribe
    store.ts           zustand store: all actions, syncing with the database, local cache
    types.ts           data model
    seed.ts            constants, initial state, example data
    selectors.ts       small derived values (team name, price, codes, consent rules)
    derive.ts          match and feed helpers
    format.ts          dates, money, account numbers, file helpers
  components/
    InnerCircleApp.tsx picks the screen and overlays from state, checks for updates, handles invite links
    screens/           role picker and the sign-up flow
    app/               Lag, Kamper, Økonomi, Min side, post card, bottom menu
    sheets/            bottom sheets (new post, add match, result, price, payout, …)
    overlays/          payment, consent forms, photo viewer
    MediaView.tsx      shows a private photo or video
    ui.tsx             shared pieces: switch row, fields, radio options, tabs, signature pad
public/sw.js           service worker that shows push notifications
```

The app renders only in the browser (`next/dynamic` with `ssr: false`). Which team and role this device shows is remembered in `localStorage` (`innercircle.v3`); the login session is kept by Supabase.

## Notes

- Light and dark mode use CSS variables on `html[data-theme]`. A small inline script in the layout applies the saved theme before first paint.
- Bricolage Grotesque (headings) and DM Sans (text) load through `next/font`. Icons use the Material Symbols Rounded stylesheet from Google Fonts.
- The parent QR code on Min side comes from `api.qrserver.com`, so it only shows when online.
- The parent role ("Foresatt") is still in the code, but the design no longer offers it on the start screen, so it can't be reached in the UI.
- "Last inn eksempeldata" on a coach's Min side fills the team with 40 example players, posts and matches, replacing what is there for everyone.
