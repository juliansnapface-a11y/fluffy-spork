# InnerCircle

A mobile web app for a team's private photo stream, built from a Claude Design prototype (`InnerCircle.dc.html`).

Everyone on a team shares the same data: a coach creates the team, players and family join with the team code, and posts, photos, matches, hearts and subscribers are stored in Supabase.

## Set up

1. **Database.** In Supabase, open **SQL Editor → New query**, paste all of [`supabase/schema.sql`](supabase/schema.sql) and press **Run**. It is safe to run again.
2. **Keys.** The app reads two public values. On Vercel they are added automatically by the Supabase integration. Locally, put them in `.env.local`:

   ```
   NEXT_PUBLIC_SUPABASE_URL=https://<project>.supabase.co
   NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_…
   ```

   `NEXT_PUBLIC_SUPABASE_ANON_KEY` also works. Never put the service role key in the app.

## Run

```bash
npm install
npm run dev      # http://localhost:3000
npm run build && npm start
npm run lint
```

## How it works

- **Roles.** A coach creates a team with a coach code (for coaches) and a team code (for everyone else). Every coach signs the coach rules. Players pick themselves from the coach's list and sign the consent form; players under 15 also need a parent's signature. Subscribers join with the team code or a player's invite link (`/?lag=CODE&via=PLAYER`), enter their name, accept the terms and pay.
- **Data.** Each team is one row in `public.teams`, holding the team document as JSON. Nobody reads the table directly; the app calls four database functions (`create_team`, `join_team`, `team_version`, `save_team`) that check the code.
- **Permissions.** With the coach code you can change everything. With the team code you can only change hearts, consent, tags on your own child, and subscriptions; the database keeps everything else as it was.
- **Saving.** Changes show at once and are saved in order. If someone else saved first, your changes are replayed on top of theirs, so no one's change is lost. The app checks for changes every 8 seconds and when it comes back into view.
- **Photos and signatures** are uploaded to the public `media` bucket with random file names.

## Not real yet

- **Login code.** No email is sent; any six digits work. Real codes need email sending set up in Supabase (and custom SMTP for more than a few emails an hour).
- **Payment.** The payment screen is a test; no money is charged.
- **Access is by code.** Anyone who knows the team code can see the team, so use codes that are hard to guess. Photo links are public but can't be guessed.

## Structure

```
supabase/schema.sql    database table, functions, photo bucket
src/
  app/                 layout (fonts, theme before first paint), page, globals.css (tokens + shared classes)
  lib/
    supabase.ts        database calls and photo upload
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
    ui.tsx             shared pieces: switch row, fields, radio options, tabs, signature pad
```

The app renders only in the browser (`next/dynamic` with `ssr: false`). Which team and role this device uses is remembered in `localStorage` (`innercircle.v2`).

## Notes

- Light and dark mode use CSS variables on `html[data-theme]`. A small inline script in the layout applies the saved theme before first paint.
- Bricolage Grotesque (headings) and DM Sans (text) load through `next/font`. Icons use the Material Symbols Rounded stylesheet from Google Fonts.
- The parent QR code on Min side comes from `api.qrserver.com`, so it only shows when online.
- The parent role ("Foresatt") is still in the code, but the design no longer offers it on the start screen, so it can't be reached in the UI.
- "Last inn eksempeldata" on a coach's Min side fills the team with 40 example players, posts and matches, replacing what is there for everyone.
