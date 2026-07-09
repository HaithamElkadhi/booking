# Jeexpert Booking Mini-App

A standalone booking page (like Calendly) for Jeexpert. Students pick an open
slot from Availability Rules / Blocked Dates in Airtable, submit a short
form, and a Booking record is created directly via the Airtable REST API —
no backend. See `BOOKING_APP_SPEC.md` for the full spec this app implements.

## 1. Create an Airtable Personal Access Token

Create a token at https://airtable.com/create/tokens scoped to **only**:

- Base `JXP-CONFIG-APP` (`appVHjUwJBU3wGrOW`) — **read only**
  (Availability Rules, Blocked Dates)
- Base — main Jeexpert base (`appkqvTuc8F0AhWPp`) — **read and write**,
  limited to the **Prospects** and **Booking** tables only

Do not grant access to any other base or table.

## 2. Configure the app

```
cp .env.example .env
```

Edit `.env` and paste the token:

```
VITE_AIRTABLE_TOKEN=patXXXXXXXXXXXXXX
```

`.env` is git-ignored — never commit it. Note that because this is a
frontend-only app, the token ships inside the built JS bundle and is visible
to anyone who opens the site's network tab. Keep its scope as narrow as
possible (see step 1) since it cannot be fully hidden from a public page.

## 3. Run locally

```
npm install
npm run dev
```

## 4. Build & deploy

```
npm run build
```

This produces a static `dist/` folder. Deploy it to Vercel either by:

- **Drag-and-drop**: on vercel.com, create a new project and drag the `dist`
  folder in, or
- **CLI**: `npx vercel --prod` from the project root (no git required).

Either way, set the `VITE_AIRTABLE_TOKEN` environment variable in the Vercel
project settings so it's baked in at build time — the `.env` file itself is
not deployed.

## Notes

- Booking window is currently 2 weeks ahead (`BOOKING_WINDOW_DAYS` in
  `src/lib/config.js`).
- Sending confirmation emails, an admin bookings view, payments, and
  reschedule/cancel UI are explicitly out of scope (spec section 6) — email
  confirmations are handled by a separate n8n automation watching new
  Booking records.
