import {
  AVAILABILITY_BASE_ID,
  MAIN_BASE_ID,
  TABLES,
  FIELDS,
  BOOKING_STATUS,
  PROSPECT_SITUATION_LEAD,
} from './config'
import { listAllRecords, createRecord, escapeFormulaString } from './airtableClient'

export async function fetchActiveAvailabilityRules() {
  const f = FIELDS.availabilityRules
  return listAllRecords(AVAILABILITY_BASE_ID, TABLES.availabilityRules, {
    filterByFormula: `{${f.active}}=1`,
  })
}

export async function fetchAllBlockedDates() {
  return listAllRecords(AVAILABILITY_BASE_ID, TABLES.blockedDates, {})
}

// All Scheduled bookings. Volume is low enough (a booking mini-app, not a
// call center) that fetching the whole set and filtering the visible date
// range client-side is simpler and avoids formula/timezone edge cases; we
// still paginate defensively per the spec.
export async function fetchScheduledBookings() {
  const f = FIELDS.booking
  return listAllRecords(MAIN_BASE_ID, TABLES.booking, {
    filterByFormula: `{${f.status}}='${BOOKING_STATUS.scheduled}'`,
  })
}

// Narrow, fresh check used immediately before writing a new booking, to
// mitigate a race where two students grab the same slot at once.
export async function isSlotStillOpen(slotStartISO) {
  const f = FIELDS.booking
  const formula = `AND({${f.status}}='${BOOKING_STATUS.scheduled}', IS_SAME({${f.dateTime}}, '${slotStartISO}', 'minute'))`
  const records = await listAllRecords(MAIN_BASE_ID, TABLES.booking, {
    filterByFormula: formula,
    maxRecords: 1,
  })
  return records.length === 0
}

export async function findProspectByEmail(email) {
  const f = FIELDS.prospects
  const formula = `LOWER({${f.email}})='${escapeFormulaString(email.trim().toLowerCase())}'`
  const records = await listAllRecords(MAIN_BASE_ID, TABLES.prospects, {
    filterByFormula: formula,
    maxRecords: 1,
  })
  return records[0] || null
}

// Best-effort split of a full name into first/last for the Prospect record.
export function splitName(fullName) {
  const parts = fullName.trim().split(/\s+/)
  const name = parts[0] || ''
  const surname = parts.slice(1).join(' ')
  return { name, surname }
}

export async function createProspect({ studentName, email, phone }) {
  const { name, surname } = splitName(studentName)
  const f = FIELDS.prospects
  return createRecord(MAIN_BASE_ID, TABLES.prospects, {
    [f.name]: name,
    [f.surname]: surname,
    [f.email]: email,
    [f.phone]: phone,
    [f.situation]: [PROSPECT_SITUATION_LEAD],
  })
}

// Full submit flow per spec section 3.2, steps 2-4: re-check the slot is
// still free, match/create the Prospect, then create the Booking record.
// Throws with a user-facing message if the slot was taken in the meantime.
export async function submitBooking({ slot, studentName, email, phone, meetingType, notes, bookingNameLabel }) {
  const stillOpen = await isSlotStillOpen(slot.startDT.toISO())
  if (!stillOpen) {
    const err = new Error('That slot was just booked by someone else. Please pick another time.')
    err.code = 'SLOT_TAKEN'
    throw err
  }

  let prospect = await findProspectByEmail(email)
  if (!prospect) {
    prospect = await createProspect({ studentName, email, phone })
  }

  return createBooking({
    studentName,
    email,
    phone,
    dateTimeISO: slot.startDT.toISO(),
    bookingNameLabel,
    durationMin: slot.durationMin,
    meetingType,
    notes,
    prospectId: prospect.id,
  })
}

export async function createBooking({
  studentName,
  email,
  phone,
  dateTimeISO,
  bookingNameLabel,
  durationMin,
  meetingType,
  notes,
  prospectId,
}) {
  const f = FIELDS.booking
  return createRecord(
    MAIN_BASE_ID,
    TABLES.booking,
    {
      [f.name]: bookingNameLabel,
      [f.studentName]: studentName,
      [f.email]: email,
      [f.phone]: phone,
      [f.dateTime]: dateTimeISO,
      [f.duration]: durationMin,
      [f.meetingType]: meetingType,
      [f.status]: BOOKING_STATUS.scheduled,
      [f.linkedProspect]: [prospectId],
      [f.notes]: notes || '',
    },
    // typecast lets Airtable auto-add a Meeting Type select option if it
    // doesn't exist yet (e.g. newly added types not yet configured in Airtable).
    { typecast: true }
  )
}
