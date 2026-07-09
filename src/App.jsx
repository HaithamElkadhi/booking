import { useEffect, useMemo, useState } from 'react'
import StepIndicator from './components/StepIndicator'
import DayPicker from './components/DayPicker'
import SlotPicker from './components/SlotPicker'
import BookingForm from './components/BookingForm'
import Confirmation from './components/Confirmation'
import { visibleDates, computeAvailableSlots } from './lib/availability'
import { fetchActiveAvailabilityRules, fetchAllBlockedDates, fetchScheduledBookings, submitBooking } from './lib/api'
import { detectLocalZone } from './lib/time'

const dates = visibleDates()

export default function App() {
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [rules, setRules] = useState([])
  const [blocks, setBlocks] = useState([])
  const [bookings, setBookings] = useState([])

  const [step, setStep] = useState(1)
  const [selectedDay, setSelectedDay] = useState(null)
  const [selectedSlot, setSelectedSlot] = useState(null)
  const [slotNotice, setSlotNotice] = useState('')

  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState('')
  const [confirmedMeetingType, setConfirmedMeetingType] = useState('')

  const localZone = useMemo(() => detectLocalZone(), [])

  async function loadData() {
    setLoading(true)
    setLoadError('')
    try {
      const [rulesData, blocksData, bookingsData] = await Promise.all([
        fetchActiveAvailabilityRules(),
        fetchAllBlockedDates(),
        fetchScheduledBookings(),
      ])
      setRules(rulesData)
      setBlocks(blocksData)
      setBookings(bookingsData)
    } catch (err) {
      setLoadError(err.message || 'Something went wrong loading availability.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const slotsByDay = useMemo(
    () => computeAvailableSlots({ dates, rules, blocks, scheduledBookings: bookings }),
    [rules, blocks, bookings]
  )

  function handleSelectDay(day) {
    setSelectedDay(day)
    setSlotNotice('')
    setStep(2)
  }

  function handleSelectSlot(slot) {
    setSelectedSlot(slot)
    setSubmitError('')
    setStep(3)
  }

  function handleBackToDays() {
    setSelectedDay(null)
    setSelectedSlot(null)
    setStep(1)
  }

  function handleBackToSlots() {
    setSelectedSlot(null)
    setSubmitError('')
    setStep(2)
  }

  async function handleSubmit(formData) {
    setSubmitting(true)
    setSubmitError('')
    try {
      const bookingNameLabel = `${formData.studentName} — ${selectedSlot.startDT.toFormat('yyyy-LL-dd HH:mm')}`
      await submitBooking({
        slot: selectedSlot,
        bookingNameLabel,
        ...formData,
      })
      setConfirmedMeetingType(formData.meetingType)
      setStep(4)
    } catch (err) {
      if (err.code === 'SLOT_TAKEN') {
        // Refresh bookings so the slot list reflects reality, then send the
        // student back to pick a different time.
        try {
          const freshBookings = await fetchScheduledBookings()
          setBookings(freshBookings)
        } catch {
          // ignore refresh failure, the notice still explains what happened
        }
        setSlotNotice(err.message)
        setSelectedSlot(null)
        setStep(2)
      } else {
        setSubmitError(err.message || 'Something went wrong. Please try again.')
      }
    } finally {
      setSubmitting(false)
    }
  }

  function handleBookAnother() {
    setSelectedDay(null)
    setSelectedSlot(null)
    setSubmitError('')
    setSlotNotice('')
    setStep(1)
    loadData()
  }

  return (
    <div className="app-shell">
      <header className="app-header">
        <span className="brand-name">Jeexpert</span>
        <p className="brand-tagline">Book a consultation</p>
      </header>

      <main className="app-main">
        <StepIndicator step={step} />

        {loading && <p className="loading-state">Loading availability…</p>}

        {!loading && loadError && (
          <div className="error-state">
            <p>{loadError}</p>
            <button type="button" className="btn-secondary" onClick={loadData}>
              Try again
            </button>
          </div>
        )}

        {!loading && !loadError && (
          <>
            {step === 1 && <DayPicker dates={dates} slotsByDay={slotsByDay} onSelect={handleSelectDay} />}

            {step === 2 && selectedDay && (
              <>
                {slotNotice && <p className="form-error" role="alert">{slotNotice}</p>}
                <SlotPicker
                  day={selectedDay}
                  slots={slotsByDay.get(selectedDay.toFormat('yyyy-LL-dd')) || []}
                  localZone={localZone}
                  onSelect={handleSelectSlot}
                  onBack={handleBackToDays}
                />
              </>
            )}

            {step === 3 && selectedDay && selectedSlot && (
              <BookingForm
                day={selectedDay}
                slot={selectedSlot}
                localZone={localZone}
                onBack={handleBackToSlots}
                onSubmit={handleSubmit}
                submitting={submitting}
                submitError={submitError}
              />
            )}

            {step === 4 && selectedDay && selectedSlot && (
              <Confirmation
                day={selectedDay}
                slot={selectedSlot}
                meetingType={confirmedMeetingType}
                localZone={localZone}
                onBookAnother={handleBookAnother}
              />
            )}
          </>
        )}
      </main>
    </div>
  )
}
