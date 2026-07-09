import { useState } from 'react'
import { MEETING_TYPES } from '../lib/config'
import { formatDayLabel, dualTimeLabel } from '../lib/time'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export default function BookingForm({ day, slot, localZone, onBack, onSubmit, submitting, submitError }) {
  const [studentName, setStudentName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [meetingType, setMeetingType] = useState(MEETING_TYPES[0])
  const [notes, setNotes] = useState('')
  const [touched, setTouched] = useState(false)

  const nameValid = studentName.trim().length > 1
  const emailValid = EMAIL_RE.test(email.trim())
  const phoneValid = phone.trim().length > 4
  const formValid = nameValid && emailValid && phoneValid

  function handleSubmit(e) {
    e.preventDefault()
    setTouched(true)
    if (!formValid || submitting) return
    onSubmit({ studentName: studentName.trim(), email: email.trim(), phone: phone.trim(), meetingType, notes: notes.trim() })
  }

  return (
    <div>
      <button type="button" className="link-back" onClick={onBack} disabled={submitting}>
        ← Choose a different time
      </button>

      <div className="summary-card">
        <div className="summary-row">
          <span className="summary-label">Day</span>
          <span>{formatDayLabel(day)}</span>
        </div>
        <div className="summary-row">
          <span className="summary-label">Time</span>
          <span>{dualTimeLabel(slot.startDT, localZone)}</span>
        </div>
        <div className="summary-row">
          <span className="summary-label">Duration</span>
          <span>{slot.durationMin} minutes</span>
        </div>
      </div>

      <h2 className="section-title">Your details</h2>
      <form className="booking-form" onSubmit={handleSubmit} noValidate>
        <label className="field">
          <span className="field-label">Full name</span>
          <input
            type="text"
            value={studentName}
            onChange={(e) => setStudentName(e.target.value)}
            autoComplete="name"
            required
          />
          {touched && !nameValid && <span className="field-error">Please enter your full name.</span>}
        </label>

        <label className="field">
          <span className="field-label">Email</span>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
            required
          />
          {touched && !emailValid && <span className="field-error">Please enter a valid email.</span>}
        </label>

        <label className="field">
          <span className="field-label">Phone</span>
          <input
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            autoComplete="tel"
            required
          />
          {touched && !phoneValid && <span className="field-error">Please enter a valid phone number.</span>}
        </label>

        <label className="field">
          <span className="field-label">Meeting type</span>
          <select value={meetingType} onChange={(e) => setMeetingType(e.target.value)}>
            {MEETING_TYPES.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>
        </label>

        <label className="field">
          <span className="field-label">What would you like to talk about? (optional)</span>
          <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={4} />
        </label>

        {submitError && <p className="form-error" role="alert">{submitError}</p>}

        <button type="submit" className="btn-primary" disabled={submitting}>
          {submitting ? 'Booking…' : 'Confirm booking'}
        </button>
      </form>
    </div>
  )
}
