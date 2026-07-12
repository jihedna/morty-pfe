import { useState } from 'react'
import Select from '../ui/Select'
import FormFieldError from '../common/FormFieldError'
import { agentPropertiesApi, PropertyStatusUpdate } from '../../lib/agentPropertiesApi'
import { extractApiError } from '../../utils/format'
import ConfirmDialog from '../common/ConfirmDialog'

interface PropertyStatusActionsProps {
  propertyId: string
  currentStatus: string
  onStatusChange?: () => void
}

const STATUS_TRANSITIONS: Record<string, string[]> = {
  draft: ['available', 'archived'],
  available: ['reserved', 'archived'],
  reserved: ['available', 'archived'],
}

const STATUS_LABELS: Record<string, string> = {
  draft: 'Draft',
  available: 'Available',
  reserved: 'Reserved',
  sold: 'Sold',
  rented: 'Rented',
  archived: 'Archived',
}

const STATUS_COLORS: Record<string, string> = {
  draft: 'bg-gray-100 text-gray-800',
  available: 'bg-green-100 text-green-800',
  reserved: 'bg-yellow-100 text-yellow-800',
  sold: 'bg-blue-100 text-blue-800',
  rented: 'bg-purple-100 text-purple-800',
  archived: 'bg-red-100 text-red-800',
}

const SIGNIFICANT_TRANSITIONS = ['archived', 'sold', 'rented']

export default function PropertyStatusActions({
  propertyId,
  currentStatus,
  onStatusChange,
}: PropertyStatusActionsProps) {
  const [isUpdating, setIsUpdating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean
    status: string
    message: string
  }>({ isOpen: false, status: '', message: '' })

  const availableTransitions = STATUS_TRANSITIONS[currentStatus] || []
  const statusOptions = availableTransitions.map((status) => ({
    value: status,
    label: STATUS_LABELS[status] || status,
  }))

  const handleStatusChange = async (newStatus: string) => {
    setError(null)
    if (!newStatus) return

    if (SIGNIFICANT_TRANSITIONS.includes(newStatus)) {
      let message = `Are you sure you want to change the status to ${STATUS_LABELS[newStatus]}?`
      if (newStatus === 'archived') {
        message +=
          ' This will remove the property from public listings. You can restore it later by changing the status back to available.'
      }
      setConfirmDialog({
        isOpen: true,
        status: newStatus,
        message,
      })
      return
    }

    await executeStatusChange(newStatus)
  }

  const executeStatusChange = async (newStatus: string) => {
    setIsUpdating(true)
    setError(null)

    try {
      const updateData: PropertyStatusUpdate = { status: newStatus }
      await agentPropertiesApi.updatePropertyStatus(propertyId, updateData)
      onStatusChange?.()
    } catch (err) {
      const errorMessage = extractApiError(err)
      if (errorMessage?.includes('403')) {
        setError('Only managers can mark property as sold or rented')
      } else if (errorMessage?.includes('400')) {
        setError('Invalid status transition for this property')
      } else if (errorMessage?.includes('404')) {
        setError('Property not found')
      } else {
        setError(errorMessage || 'Failed to update property status')
      }
    } finally {
      setIsUpdating(false)
    }
  }

  const handleConfirm = () => {
    setConfirmDialog({ isOpen: false, status: '', message: '' })
    executeStatusChange(confirmDialog.status)
  }

  const handleCancel = () => {
    setConfirmDialog({ isOpen: false, status: '', message: '' })
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className={`px-2.5 py-1 text-xs font-semibold rounded-full ${STATUS_COLORS[currentStatus]}`}>
        {STATUS_LABELS[currentStatus] || currentStatus}
      </span>

      {statusOptions.length > 0 && (
        <Select
          id={`status-select-${propertyId}`}
          value=""
          onChange={handleStatusChange}
          options={statusOptions}
          placeholder="Change status..."
          disabled={isUpdating}
          className="w-44"
        />
      )}

      <FormFieldError message={error} />

      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        title="Confirm Status Change"
        message={confirmDialog.message}
        confirmLabel="Confirm"
        cancelLabel="Cancel"
        onConfirm={handleConfirm}
        onCancel={handleCancel}
        isDestructive={confirmDialog.status === 'archived'}
      />
    </div>
  )
}
