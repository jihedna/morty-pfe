import { useEffect, useState } from 'react'
import Modal from '../ui/Modal'
import Input from '../ui/Input'
import Textarea from '../ui/Textarea'
import Button from '../ui/Button'

interface AppointmentDialogProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (start: string, end: string, notes: string) => void
  isSubmitting: boolean
  error: string | null
}

export function AppointmentDialog({ isOpen, onClose, onSubmit, isSubmitting, error }: AppointmentDialogProps) {
  const [start, setStart] = useState('')
  const [end, setEnd] = useState('')
  const [notes, setNotes] = useState('')
  const [validationError, setValidationError] = useState<string | null>(null)

  useEffect(() => {
    if (isOpen) {
      setStart('')
      setEnd('')
      setNotes('')
      setValidationError(null)
    }
  }, [isOpen])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setValidationError(null)

    if (!start || !end) {
      setValidationError('Please select both start and end time.')
      return
    }

    const startDate = new Date(start)
    const endDate = new Date(end)
    const durationMs = endDate.getTime() - startDate.getTime()

    if (endDate <= startDate) {
      setValidationError('End time must be after start time.')
      return
    }

    const durationMinutes = durationMs / (1000 * 60)
    if (durationMinutes < 30) {
      setValidationError('Viewing must be at least 30 minutes.')
      return
    }
    if (durationMinutes > 240) {
      setValidationError('Viewing cannot be longer than 4 hours.')
      return
    }

    onSubmit(start, end, notes.trim())
  }

  const now = new Date()
  const minStart = now.toISOString().slice(0, 16)

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Request Viewing"
      size="md"
      footer={
        <>
          <Button variant="secondary" onClick={onClose} type="button" disabled={isSubmitting}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} type="submit" isLoading={isSubmitting} disabled={isSubmitting}>
            Request Appointment
          </Button>
        </>
      }
    >
      <form id="appointment-form" onSubmit={handleSubmit} className="space-y-4">
        <p className="text-navy-600 text-sm">
          Schedule a viewing appointment for this property.
        </p>
        <Input
          id="appointment-start"
          label="Start Time"
          type="datetime-local"
          value={start}
          onChange={setStart}
          min={minStart}
          required
          disabled={isSubmitting}
        />
        <Input
          id="appointment-end"
          label="End Time"
          type="datetime-local"
          value={end}
          onChange={setEnd}
          min={start || minStart}
          required
          disabled={isSubmitting}
        />
        <Textarea
          id="appointment-notes"
          label="Notes"
          placeholder="Any details or preferences for the viewing..."
          value={notes}
          onChange={setNotes}
          rows={3}
          disabled={isSubmitting}
        />
        {(validationError || error) && (
          <div className="text-sm text-red-600 bg-red-50 rounded-lg p-3" role="alert">
            {validationError || error}
          </div>
        )}
      </form>
    </Modal>
  )
}
