import { formatDayLabel, dualTimeLabel } from '../lib/time'

export default function SlotPicker({ day, slots, localZone, onSelect, onBack }) {
  return (
    <div>
      <button type="button" className="link-back" onClick={onBack}>
        ← Choose a different day
      </button>
      <h2 className="section-title">{formatDayLabel(day)}</h2>
      <p className="section-hint">Pick a time. Times are shown in Italy time and your local time.</p>
      {slots.length === 0 ? (
        <p className="empty-state">No slots left on this day.</p>
      ) : (
        <ul className="slot-list">
          {slots.map((slot) => (
            <li key={slot.startDT.toISO()}>
              <button type="button" className="slot-card" onClick={() => onSelect(slot)}>
                {dualTimeLabel(slot.startDT, localZone)}
                <span className="slot-duration">{slot.durationMin} min</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
