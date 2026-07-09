export default function DayPicker({ dates, slotsByDay, onSelect }) {
  return (
    <div>
      <h2 className="section-title">Pick a day</h2>
      <p className="section-hint">Times shown will let you compare Italy time with your own.</p>
      <ul className="day-list">
        {dates.map((day) => {
          const dayKey = day.toFormat('yyyy-LL-dd')
          const slots = slotsByDay.get(dayKey) || []
          const disabled = slots.length === 0
          return (
            <li key={dayKey}>
              <button
                type="button"
                className="day-card"
                disabled={disabled}
                onClick={() => onSelect(day)}
              >
                <span className="day-card-weekday">{day.toFormat('cccc')}</span>
                <span className="day-card-date">{day.toFormat('d LLLL')}</span>
                <span className="day-card-status">
                  {disabled ? 'No availability' : `${slots.length} slot${slots.length === 1 ? '' : 's'}`}
                </span>
              </button>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
