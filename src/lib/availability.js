import { DateTime } from 'luxon'
import { TIMEZONE, FIELDS, BOOKING_WINDOW_DAYS } from './config'
import { nowInRome, parseHM } from './time'

// The BOOKING_WINDOW_DAYS calendar days starting today (Europe/Rome), as
// start-of-day Luxon DateTimes.
export function visibleDates(windowDays = BOOKING_WINDOW_DAYS) {
  const today = nowInRome().startOf('day')
  return Array.from({ length: windowDays }, (_, i) => today.plus({ days: i }))
}

// Blocked Dates records whose [Date, End Date] range covers the given day.
function blocksForDay(day, blocks) {
  const f = FIELDS.blockedDates
  return blocks.filter((record) => {
    const fields = record.fields
    if (!fields[f.date]) return false
    const start = DateTime.fromISO(fields[f.date], { zone: TIMEZONE }).startOf('day')
    const end = fields[f.endDate]
      ? DateTime.fromISO(fields[f.endDate], { zone: TIMEZONE }).startOf('day')
      : start
    return day >= start && day <= end
  })
}

function isFullyBlocked(dayBlocks) {
  const f = FIELDS.blockedDates
  return dayBlocks.some((record) => record.fields[f.allDay] === true)
}

// Partial-block [start, end) intervals (as Luxon DateTimes on `day`) from
// non-all-day Blocked Dates records covering that day.
function partialBlockIntervals(day, dayBlocks) {
  const f = FIELDS.blockedDates
  // Airtable omits unchecked checkbox fields from the API response rather than
  // sending `false`, so "not all-day" means anything other than `true`.
  return dayBlocks
    .filter((record) => record.fields[f.allDay] !== true)
    .map((record) => {
      const fields = record.fields
      if (!fields[f.blockedStart] || !fields[f.blockedEnd]) return null
      return {
        start: parseHM(day, fields[f.blockedStart]),
        end: parseHM(day, fields[f.blockedEnd]),
      }
    })
    .filter(Boolean)
}

function overlapsAnyInterval(slotStart, slotEnd, intervals) {
  return intervals.some(({ start, end }) => slotStart < end && slotEnd > start)
}

// Builds a Map<'yyyy-LL-dd', Array<{ startDT, endDT, durationMin, ruleId }>>
// of bookable slots for the given dates, per spec section 3.1.
export function computeAvailableSlots({ dates, rules, blocks, scheduledBookings }) {
  const rf = FIELDS.availabilityRules
  const bf = FIELDS.booking
  const now = nowInRome()

  const takenStarts = new Set(
    scheduledBookings
      .map((record) => record.fields[bf.dateTime])
      .filter(Boolean)
      .map((iso) => DateTime.fromISO(iso, { zone: TIMEZONE }).toMillis())
  )

  const activeRules = rules.filter((record) => record.fields[rf.active])

  const result = new Map()

  for (const day of dates) {
    const dayKey = day.toFormat('yyyy-LL-dd')
    const dayName = day.setLocale('en-US').toFormat('cccc')

    const dayBlocks = blocksForDay(day, blocks)
    if (isFullyBlocked(dayBlocks)) {
      result.set(dayKey, [])
      continue
    }
    const partialBlocks = partialBlockIntervals(day, dayBlocks)

    const dayRules = activeRules.filter((record) => record.fields[rf.dayOfWeek] === dayName)

    const slots = []
    for (const rule of dayRules) {
      const fields = rule.fields
      const durationMin = Number(fields[rf.slotDuration])
      if (!fields[rf.startTime] || !fields[rf.endTime] || !durationMin) continue

      const windowStart = parseHM(day, fields[rf.startTime])
      const windowEnd = parseHM(day, fields[rf.endTime])

      let slotStart = windowStart
      while (slotStart.plus({ minutes: durationMin }) <= windowEnd) {
        const slotEnd = slotStart.plus({ minutes: durationMin })

        const isPast = slotStart < now
        const isBlocked = overlapsAnyInterval(slotStart, slotEnd, partialBlocks)
        const isTaken = takenStarts.has(slotStart.toMillis())

        if (!isPast && !isBlocked && !isTaken) {
          slots.push({
            startDT: slotStart,
            endDT: slotEnd,
            durationMin,
            ruleId: rule.id,
          })
        }

        slotStart = slotEnd
      }
    }

    slots.sort((a, b) => a.startDT.toMillis() - b.startDT.toMillis())
    result.set(dayKey, slots)
  }

  return result
}
