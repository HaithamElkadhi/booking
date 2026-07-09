import { DateTime } from 'luxon'
import { TIMEZONE } from './config'

// Local timezone the student's browser reports, e.g. "Africa/Casablanca".
export function detectLocalZone() {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || TIMEZONE
  } catch {
    return TIMEZONE
  }
}

export function nowInRome() {
  return DateTime.now().setZone(TIMEZONE)
}

export function parseHM(dt, hm) {
  const [hour, minute] = hm.split(':').map(Number)
  return dt.set({ hour, minute, second: 0, millisecond: 0 })
}

export function formatDayLabel(dt) {
  return dt.toFormat('cccc d LLLL')
}

export function formatTimeHM(dt) {
  return dt.toFormat('HH:mm')
}

// "09:00 (Italy) / 08:00 (your time)" style dual-timezone label for a slot start.
export function dualTimeLabel(dt, localZone) {
  const italy = formatTimeHM(dt)
  if (localZone === TIMEZONE) {
    return `${italy} (Italy time)`
  }
  const local = formatTimeHM(dt.setZone(localZone))
  return `${italy} (Italy) / ${local} (your time)`
}
