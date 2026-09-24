// Airtable base/table/field identifiers, per BOOKING_APP_SPEC.md section 2.
// Note: the Airtable record REST API addresses fields by NAME (not field ID)
// in create/update payloads and filterByFormula, so field IDs below are kept
// only as comments for traceability back to the spec.

export const TIMEZONE = 'Europe/Rome'

// How many days ahead (inclusive of today) are open for booking.
export const BOOKING_WINDOW_DAYS = 14

export const AVAILABILITY_BASE_ID = 'appVHjUwJBU3wGrOW' // JXP-CONFIG-APP
export const MAIN_BASE_ID = 'appkqvTuc8F0AhWPp' // main Jeexpert base

export const TABLES = {
  availabilityRules: 'tblrZ7RMVzqN2RXSi',
  blockedDates: 'tbls0tia3CwVym2pl',
  prospects: 'tblQPh56AAmCe1bTj',
  booking: 'tblYHIcXwoMupWnaC',
}

export const FIELDS = {
  availabilityRules: {
    name: 'Name', // fldhazMd3SECirVxw
    dayOfWeek: 'Day of Week', // fld6S6Tzo1Qrsk618
    startTime: 'Start Time', // fldpCJaR0ZFyyYH0d
    endTime: 'End Time', // fldbfBqyHh8bmifv8
    slotDuration: 'Slot Duration (min)', // fldeAZY7kkZkerEqA
    active: 'Active', // fldcI0BfYRPjGvSLF
  },
  blockedDates: {
    name: 'Name', // fldWRXlk9ZzQNM48l
    date: 'Date', // fld9gLzep83A260WL
    endDate: 'End Date (if range)', // fldT4Vp5268NjxxLr
    allDay: 'All Day', // fldyLdogIvWSdjsQc
    blockedStart: 'Blocked Start Time', // fldryTLlnnqjj5jME
    blockedEnd: 'Blocked End Time', // fld0Wv4liYkZqjxeA
    notes: 'Notes', // fldwcm3uVHikbkUfG
  },
  prospects: {
    email: 'Email', // fldWBOtlmuPIXdsep
    name: 'Name', // fldrjpZMHxXReuVBK
    surname: 'Surname', // fldrlBOVl9Rd2wIff
    phone: 'Phone', // fldx6RMeRYPWC9BV3
    situation: 'Prospect Situation', // fldLY8mOVCDsJhw23
  },
  booking: {
    name: 'Name', // fldSo7qi0ykq9hNRD
    studentName: 'Student Name', // fldQVz4tlNW58I6Ip
    email: 'Email', // fldasDMrcwqX9tVNp
    phone: 'Phone', // flduPE1kyhAPfjqTr
    dateTime: 'Date & Time', // fld3ZWw07FlWQz6xj
    duration: 'Duration (min)', // fldT7aeHeWXrno7ya
    meetingType: 'Meeting Type', // fldrAHy70gOEIVmH5
    status: 'Booking Status', // fldZHQnFb6uOQ3pNg
    linkedProspect: 'Linked Prospect', // fldhR4N2XROZGK7Ha
    meetingLink: 'Meeting Link', // fldQKPTf88j2oaQW2
    notes: 'Notes', // fldUHN2ZyV4xKUihD
  },
}

export const MEETING_TYPES = [
  'Intro Call',
  'Admission Consultation',
  'Visa Consultation',
  'Scholarship Consultation',
  'Orientation Meeting',
  'Follow up',
  'Other',
]

export const BOOKING_STATUS = {
  scheduled: 'Scheduled',
  completed: 'Completed',
  cancelled: 'Cancelled',
  noShow: 'No-show',
}

export const PROSPECT_SITUATION_LEAD = 'Lead'
