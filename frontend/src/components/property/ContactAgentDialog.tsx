import { useState } from 'react'
import Modal from '../ui/Modal'
import Textarea from '../ui/Textarea'
import Button from '../ui/Button'

interface ContactAgentDialogProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (message: string) => void
  isSubmitting: boolean
  error: string | null
}

export function ContactAgentDialog({ isOpen, onClose, onSubmit, isSubmitting, error }: ContactAgentDialogProps) {
  const [message, setMessage] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!message.trim() || isSubmitting) return
    onSubmit(message.trim())
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Contact Agent"
      size="md"
      footer={
        <>
          <Button variant="secondary" onClick={onClose} type="button" disabled={isSubmitting}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} type="submit" isLoading={isSubmitting} disabled={isSubmitting || !message.trim()}>
            Send Message
          </Button>
        </>
      }
    >
      <form id="contact-agent-form" onSubmit={handleSubmit} className="space-y-4">
        <p className="text-navy-600 text-sm">
          Send a message to the agent about this property.
        </p>
        <Textarea
          id="contact-message"
          label="Message"
          placeholder="I am interested in this property. Please contact me with more details."
          value={message}
          onChange={setMessage}
          rows={4}
          required
          disabled={isSubmitting}
        />
        {error && (
          <div className="text-sm text-red-600 bg-red-50 rounded-lg p-3" role="alert">
            {error}
          </div>
        )}
      </form>
    </Modal>
  )
}
