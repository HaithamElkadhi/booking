import { formatDayLabel, dualTimeLabel } from '../lib/time'

export default function Confirmation({ day, slot, meetingType, localZone, onBookAnother }) {
  return (
    <div className="confirmation">
      <div className="confirmation-icon" aria-hidden="true">✓</div>
      <h2 className="section-title">You're booked</h2>
      <p className="section-hint">
        Thanks — your {meetingType.toLowerCase()} is confirmed. A confirmation will follow by email shortly.
      </p>

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
        <div className="summary-row">
          <span className="summary-label">Meeting type</span>
          <span>{meetingType}</span>
        </div>
      </div>

      <button type="button" className="btn-secondary" onClick={onBookAnother}>
        Book another slot
      </button>
    </div>
  )
}
