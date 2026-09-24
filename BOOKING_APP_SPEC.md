# JEExpert Booking Mini-App — Spec & Claude Code Prompt

---

## 📋 PROMPT TO PASTE INTO CLAUDE CODE

Copy everything below this line into Claude Code to kick off the build:

```
Build a standalone booking mini-app for JEExpert (like Calendly), following the spec
in BOOKING_APP_SPEC.md exactly (data model, field IDs, business logic, and edge cases).

Stack: React + Vite, plain CSS (no Tailwind needed unless you prefer it), no backend —
the frontend calls the Airtable REST API directly using fetch, same pattern as an
existing JEExpert student portal.

Deliverable: a single deployable Vite app (deployable to Vercel via drag-and-drop or CLI,
no git required) with:
1. A public booking page: date/slot picker + booking form
2. A confirmation screen after successful booking
3. Client-side double-booking re-check immediately before writing the record
4. Clean, mobile-friendly UI matching a simple, professional education-consulting brand
   (calm colors, no stock "SaaS" gradients — see BOOKING_APP_SPEC.md "Design notes")

Read the full spec below before writing any code. Ask me before making assumptions on
anything not covered by the spec.
```

---

## 1. Overview

A public, standalone booking page (like Calendly) for JEExpert. Students pick an open
slot, submit a short form, and a record is created in Airtable. If the student's email
matches an existing Prospect, the booking is linked to that Prospect; otherwise a new
Prospect is created automatically.

No custom backend. The frontend talks directly to the Airtable REST API
(`https://api.airtable.com/v0/{baseId}/{tableId}`), same approach already used in the
JEExpert student portal (jeexpert.com).

---

## 2. Data model (already built in Airtable — do not recreate these tables)

### Base: JXP-CONFIG-APP — `appVHjUwJBU3wGrOW`

**Table: Availability Rules — `tblrZ7RMVzqN2RXSi`**
Each record = one recurring weekly open window.

| Field name | Field ID | Type | Notes |
|---|---|---|---|
| Name | `fldhazMd3SECirVxw` | singleLineText | label, e.g. "Monday 9-12" |
| Day of Week | `fld6S6Tzo1Qrsk618` | singleSelect | Monday…Sunday |
| Start Time | `fldpCJaR0ZFyyYH0d` | singleLineText | `HH:mm`, 24h, Europe/Rome |
| End Time | `fldbfBqyHh8bmifv8` | singleLineText | `HH:mm`, 24h, Europe/Rome |
| Slot Duration (min) | `fldeAZY7kkZkerEqA` | number | e.g. 30 |
| Active | `fldcI0BfYRPjGvSLF` | checkbox | ignore rule if unchecked |

A day can have multiple rows (e.g. morning 9-12 + evening 14-17 = a lunch gap with no
slots). Fetch ALL active rows for the relevant days and generate slots from each row
independently.

**Table: Blocked Dates — `tbls0tia3CwVym2pl`**
One-off exceptions (holidays, time off) that override Availability Rules.

| Field name | Field ID | Type | Notes |
|---|---|---|---|
| Name | `fldWRXlk9ZzQNM48l` | singleLineText | label |
| Date | `fld9gLzep83A260WL` | date | start of blocked period |
| End Date (if range) | `fldT4Vp5268NjxxLr` | date | optional, for multi-day blocks |
| All Day | `fldyLdogIvWSdjsQc` | checkbox | if true, whole day is blocked |
| Blocked Start Time | `fldryTLlnnqjj5jME` | singleLineText | `HH:mm`, only if All Day is false |
| Blocked End Time | `fld0Wv4liYkZqjxeA` | singleLineText | `HH:mm`, only if All Day is false |
| Notes | `fldwcm3uVHikbkUfG` | multilineText | reason |

### Base: main JEExpert base — `appkqvTuc8F0AhWPp`

**Table: Prospects — `tblQPh56AAmCe1bTj`** (existing table, do not modify structure)
Relevant fields for this app:

| Field name | Field ID | Type |
|---|---|---|
| Email | `fldWBOtlmuPIXdsep` | singleLineText |
| Name | `fldrjpZMHxXReuVBK` | singleLineText |
| Surname | `fldrlBOVl9Rd2wIff` | singleLineText |
| Phone | `fldx6RMeRYPWC9BV3` | singleLineText |
| Prospect Situation | `fldLY8mOVCDsJhw23` | multipleSelects | set to `"Lead"` when auto-creating |

**Table: Booking — `tblYHIcXwoMupWnaC`**

| Field name | Field ID | Type | Notes |
|---|---|---|---|
| Name | `fldSo7qi0ykq9hNRD` | singleLineText (primary) | auto-generate e.g. "Jane Doe — 2026-07-15 09:00" |
| Student Name | `fldQVz4tlNW58I6Ip` | singleLineText | |
| Email | `fldasDMrcwqX9tVNp` | email | |
| Phone | `flduPE1kyhAPfjqTr` | phoneNumber | |
| Date & Time | `fld3ZWw07FlWQz6xj` | dateTime | Europe/Rome, ISO date, 24h time |
| Duration (min) | `fldT7aeHeWXrno7ya` | number | copy from the matching Availability Rule |
| Meeting Type | `fldrAHy70gOEIVmH5` | singleSelect | choices: `Intro Call`, `Admission Consultation`, `Visa Consultation`, `Scholarship Consultation` |
| Booking Status | `fldZHQnFb6uOQ3pNg` | singleSelect | choices: `Scheduled`, `Completed`, `Cancelled`, `No-show` — set to `Scheduled` on creation |
| Linked Prospect | `fldhR4N2XROZGK7Ha` | multipleRecordLinks → Prospects | see matching logic below |
| Meeting Link | `fldQKPTf88j2oaQW2` | url | leave blank unless you generate one |
| Notes | `fldUHN2ZyV4xKUihD` | multilineText | student's topic/notes from the form |

---

## 3. Business logic

### 3.1 Computing available slots (for a given date range, e.g. the visible week)

1. Fetch all `Availability Rules` where `Active` = true.
2. Fetch all `Blocked Dates` that overlap the visible range.
3. Fetch all existing `Booking` records with `Date & Time` in the visible range and
   `Booking Status` = `Scheduled` (ignore Cancelled/No-show/Completed — those slots are free again).
4. For each calendar day in the visible range:
   a. Find matching Availability Rules by day-of-week name.
   b. If the day is fully blocked by a Blocked Dates record (`All Day` = true, or the
      day falls inside a Date→End Date range), skip the whole day.
   c. If the day has a partial block (`All Day` = false), remove any generated slot that
      overlaps `[Blocked Start Time, Blocked End Time)`.
   d. For each remaining Availability Rule row, generate slots of `Slot Duration (min)`
      length from `Start Time` to `End Time` (exclusive of end).
   e. Remove any slot whose start time exactly matches an existing Scheduled booking's
      `Date & Time`.
5. Never generate slots in the past (compare against current time in Europe/Rome).

### 3.2 Booking flow

1. Student selects a slot + fills form: Student Name, Email, Phone, Meeting Type, Notes/topic.
2. **Re-check step (race condition mitigation):** immediately before writing, re-fetch
   Scheduled bookings for that exact `Date & Time`. If already taken, show an error and
   ask the student to pick another slot — do not silently overwrite.
3. **Prospect matching:** search Prospects table by Email (exact match, case-insensitive).
   - Match found → use that record's ID for `Linked Prospect`.
   - No match → create a new Prospect record first with Name, Surname (best-effort split
     from Student Name), Email, Phone, `Prospect Situation` = `"Lead"`. Use the new
     record's ID for `Linked Prospect`.
4. Create the Booking record with all fields above, `Booking Status` = `Scheduled`.
5. Show a confirmation screen: date/time, meeting type, and a note that a confirmation
   will follow (actual email sending is out of scope for this app — that's handled by a
   separate n8n automation watching new Booking records).

### 3.3 Timezone

- All Availability Rules / Blocked Dates times are Europe/Rome (Italy) time.
- Store `Date & Time` in the Booking table as Europe/Rome per the field's timezone config.
- Display times to the student in **both** Italy time and their detected local time
  (via `Intl.DateTimeFormat().resolvedOptions().timeZone`) since students are mostly in
  Tunisia/Morocco. Label clearly which is which, e.g. "09:00 (Italy) / 08:00 (your time)".

---

## 4. Airtable API notes

- Base REST endpoint: `https://api.airtable.com/v0/{baseId}/{tableId}`
- Auth: `Authorization: Bearer {PERSONAL_ACCESS_TOKEN}` header.
- **Use environment variables for the token** (e.g. `VITE_AIRTABLE_TOKEN` in `.env`,
  never hardcoded) — remind me in your output to create a Personal Access Token scoped
  to only: JXP-CONFIG-APP (read) + main base's Prospects & Booking tables (read/write),
  nothing else.
- For filtering by date range, use the `filterByFormula` query param
  (e.g. `IS_AFTER({Date & Time}, ...)` combined with `IS_BEFORE(...)`).
- Airtable returns max 100 records per page by default — handle `offset` pagination if a
  query could exceed that (unlikely for a single week's bookings, but do it for
  Availability Rules / Blocked Dates to be safe).

---

## 5. Design notes

- Simple, calm, professional — this represents an education consulting brand, not a
  generic SaaS tool. Avoid default purple-gradient/glassmorphism templates.
- Mobile-first: most students will open this link on their phone via WhatsApp.
- Clear steps: 1) pick a day → 2) pick a time → 3) fill details → 4) confirmation.
- Show duration and meeting type clearly before final submit.

---

## 6. Explicitly out of scope for this build

- Sending confirmation emails or calendar invites (handled separately via n8n).
- Admin/team view of bookings (they'll just use Airtable directly).
- Payment collection.
- Rescheduling/cancellation UI for students (can be a v2).
