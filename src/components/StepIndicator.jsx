const STEPS = ['Day', 'Time', 'Your details', 'Confirmed']

export default function StepIndicator({ step }) {
  return (
    <ol className="step-indicator" aria-label="Booking progress">
      {STEPS.map((label, i) => {
        const stepNumber = i + 1
        const status =
          stepNumber === step ? 'current' : stepNumber < step ? 'done' : 'upcoming'
        return (
          <li key={label} className={`step step-${status}`}>
            <span className="step-dot">{status === 'done' ? '✓' : stepNumber}</span>
            <span className="step-label">{label}</span>
          </li>
        )
      })}
    </ol>
  )
}
