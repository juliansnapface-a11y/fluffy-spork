# InnerCircle

A mobile web app for a team's private photo stream, built from a Claude Design prototype (`InnerCircle.dc.html`).

It is a working demo: every button does something, the data is demo data, and changes are saved in the browser (`localStorage`, key `innercircle.demo.v1`). There is no backend.

## Run

```bash
npm install
npm run dev      # http://localhost:3000
npm run build && npm start
npm run lint
```

## Try each role

The start screen has three roles. The demo shows codes you can tap to fill in, and any six digits work as the login code.

- **Trener:** "Logg inn" with `TRENER-G12`, or "Opprett lag" to start an empty team. Every coach signs the coach rules first.
- **Spiller:** choose over or under 15, use the team code `SOLBERG12` and pick yourself from the list. Players under 15 also need a parent's signature (part 2 of the form).
- **Abonnent:** team code `SOLBERG12`, pick who invited you, accept the terms and pay. Any 16-digit card, a future expiry date and a 3-digit CVC work.

"Bytt rolle" at the bottom of Min side logs out so you can try another role. Coaches also get "Last inn demodata", which restores the demo team.

## Structure

```
src/
  app/                 layout (fonts, theme before first paint), page, globals.css (tokens + shared classes)
  lib/
    types.ts           data model
    seed.ts            demo team, constants, initial state
    store.ts           zustand store: all actions and localStorage persistence
    selectors.ts       small derived values (team name, price, codes, consent rules)
    derive.ts          match and feed helpers
    format.ts          dates, money, account numbers, file helpers
  components/
    InnerCircleApp.tsx picks the screen and overlays from state
    screens/           role picker and the sign-up flow
    app/               Lag, Kamper, Økonomi, Min side, post card, bottom menu
    sheets/            bottom sheets (new post, add match, result, price, payout, …)
    overlays/          payment, consent forms, photo viewer
    ui.tsx             shared pieces: switch row, fields, radio options, tabs, signature pad
```

The app renders only in the browser (`next/dynamic` with `ssr: false`), because all of its state lives in `localStorage`.

## Notes

- Light and dark mode use CSS variables on `html[data-theme]`. A small inline script in the layout applies the saved theme before first paint.
- Bricolage Grotesque (headings) and DM Sans (text) load through `next/font`. Icons use the Material Symbols Rounded stylesheet from Google Fonts.
- The parent QR code on Min side comes from `api.qrserver.com`, so it only shows when online.
- The parent role ("Foresatt") is still in the code, but the design no longer offers it on the start screen, so it can't be reached in the UI.
