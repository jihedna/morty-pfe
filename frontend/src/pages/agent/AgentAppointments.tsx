import { useState, useEffect, useCallback } from 'react'
import AppLayout from '../../components/layout/AppLayout'
import { agentAppointmentsApi, AppointmentResponse, AppointmentStatusUpdate, AppointmentReschedule } from '../../lib/agentAppointmentsApi'
import { extractApiError } from '../../utils/format'
import { DataTable, FilterPanel, ErrorState, PageHeader } from '../../components/ui/shared'
import Select from '../../components/ui/Select'
import Button from '../../components/ui/Button'
import Input from '../../components/ui/Input'
import Textarea from '../../components/ui/Textarea'
import Modal from '../../components/ui/Modal'
import { StatusBadge } from '../../components/StatusBadge'

const statusFilterOptions = [
  { value: '', label: 'All Statuses' },
  { value: 'requested', label: 'Requested' },
  { value: 'confirmed', label: 'Confirmed' },
  { value: 'completed', label: 'Completed' },
  { value: 'cancelled', label: 'Cancelled' },
  { value: 'rescheduled', label: 'Rescheduled' },
  { value: 'no_show', label: 'No Show' },
]

export default function AgentAppointments() {
  const [appointments, setAppointments] = useState<AppointmentResponse[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [statusFilter, setStatusFilter] = useState<string>('')
  const [skip, setSkip] = useState(0)
  const [limit] = useState(20)
  const [rescheduleDialog, setRescheduleDialog] = useState<{
    isOpen: boolean
    appointmentId: string
    appointment: AppointmentResponse | null
  }>({ isOpen: false, appointmentId: '', appointment: null })
  const [rescheduleData, setRescheduleData] = useState({
    scheduled_start: '',
    scheduled_end: '',
    agent_notes: '',
  })
  const [isRescheduling, setIsRescheduling] = useState(false)

  const loadAppointments = useCallback(async () => {
    setIsLoading(true)
    setError(null)

    try {
      const data = await agentAppointmentsApi.getAgentAppointments(
        statusFilter || undefined,
        undefined,
        undefined,
        undefined,
        skip,
        limit
      )
      setAppointments(data)
    } catch (err) {
      const errorMessage = extractApiError(err)
      setError(errorMessage || 'Failed to load appointments')
    } finally {
      setIsLoading(false)
    }
  }, [statusFilter, skip, limit])

  useEffect(() => {
    loadAppointments()
  }, [loadAppointments])

  const handleStatusFilterChange = (value: string) => {
    setStatusFilter(value)
    setSkip(0)
  }

  const handleUpdateStatus = async (appointmentId: string, status: string) => {
    try {
      const updateData: AppointmentStatusUpdate = { status }
      await agentAppointmentsApi.updateAppointmentStatus(appointmentId, updateData)
      await loadAppointments()
    } catch (err) {
      const errorMessage = extractApiError(err)
      setError(errorMessage || 'Failed to update appointment status')
    }
  }

  const handleOpenReschedule = (appointment: AppointmentResponse) => {
    setRescheduleDialog({
      isOpen: true,
      appointmentId: appointment.id,
      appointment,
    })
    setRescheduleData({
      scheduled_start: appointment.scheduled_start.slice(0, 16),
      scheduled_end: appointment.scheduled_end.slice(0, 16),
      agent_notes: appointment.agent_notes || '',
    })
    setError(null)
  }

  const handleCloseReschedule = () => {
    setRescheduleDialog({ isOpen: false, appointmentId: '', appointment: null })
    setRescheduleData({ scheduled_start: '', scheduled_end: '', agent_notes: '' })
    setError(null)
  }

  const handleReschedule = async () => {
    setError(null)

    const startDate = new Date(rescheduleData.scheduled_start)
    const endDate = new Date(rescheduleData.scheduled_end)
    const now = new Date()

    if (startDate <= now) {
      setError('Start time must be in the future')
      return
    }
    if (endDate <= startDate) {
      setError('End time must be after start time')
      return
    }

    const durationMinutes = (endDate.getTime() - startDate.getTime()) / (1000 * 60)
    if (durationMinutes < 30) {
      setError('Duration must be at least 30 minutes')
      return
    }
    if (durationMinutes > 240) {
      setError('Duration must not exceed 4 hours')
      return
    }

    setIsRescheduling(true)
    try {
      const reschedulePayload: AppointmentReschedule = {
        scheduled_start: startDate.toISOString(),
        scheduled_end: endDate.toISOString(),
        agent_notes: rescheduleData.agent_notes || undefined,
      }
      await agentAppointmentsApi.rescheduleAppointment(rescheduleDialog.appointmentId, reschedulePayload)
      handleCloseReschedule()
      await loadAppointments()
    } catch (err) {
      const errorMessage = extractApiError(err)
      if (errorMessage?.includes('409')) {
        setError('Scheduling conflict: This time slot is not available')
      } else {
        setError(errorMessage || 'Failed to reschedule appointment')
      }
    } finally {
      setIsRescheduling(false)
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    handleReschedule()
  }

  const handlePreviousPage = () => {
    if (skip > 0) setSkip(skip - limit)
  }

  const handleNextPage = () => {
    setSkip(skip + limit)
  }

  const renderActions = (appointment: AppointmentResponse) => {
    const common = (status: string) => handleUpdateStatus(appointment.id, status)
    return (
      <div className="flex justify-end gap-2 flex-wrap">
        {appointment.status === 'requested' && (
          <>
            <Button type="button" variant="primary" size="sm" onClick={() => common('confirmed')}>Confirm</Button>
            <Button type="button" variant="secondary" size="sm" onClick={() => handleOpenReschedule(appointment)}>Reschedule</Button>
            <Button type="button" variant="danger" size="sm" onClick={() => common('cancelled')}>Cancel</Button>
          </>
        )}
        {appointment.status === 'confirmed' && (
          <>
            <Button type="button" variant="primary" size="sm" onClick={() => common('completed')}>Complete</Button>
            <Button type="button" variant="secondary" size="sm" onClick={() => handleOpenReschedule(appointment)}>Reschedule</Button>
            <Button type="button" variant="danger" size="sm" onClick={() => common('no_show')}>No Show</Button>
            <Button type="button" variant="danger" size="sm" onClick={() => common('cancelled')}>Cancel</Button>
          </>
        )}
        {appointment.status === 'rescheduled' && (
          <>
            <Button type="button" variant="primary" size="sm" onClick={() => common('completed')}>Complete</Button>
            <Button type="button" variant="danger" size="sm" onClick={() => common('no_show')}>No Show</Button>
            <Button type="button" variant="danger" size="sm" onClick={() => common('cancelled')}>Cancel</Button>
          </>
        )}
      </div>
    )
  }

  const tableColumns = [
    {
      key: 'property',
      header: 'Property',
      render: (appointment: AppointmentResponse) => (
        <div>
          <div className="text-sm font-medium text-gray-900">{appointment.property.title}</div>
          <div className="text-sm text-gray-500">{appointment.property.reference_code}</div>
        </div>
      ),
    },
    {
      key: 'client',
      header: 'Client',
      render: (appointment: AppointmentResponse) => (
        <div>
          <div className="text-sm text-gray-900">{appointment.client.first_name} {appointment.client.last_name}</div>
          <div className="text-sm text-gray-500">{appointment.client.email}</div>
        </div>
      ),
    },
    {
      key: 'dateTime',
      header: 'Date & Time',
      render: (appointment: AppointmentResponse) => (
        <div className="text-sm text-gray-900">
          <div>{new Date(appointment.scheduled_start).toLocaleDateString()}</div>
          <div className="text-gray-500">
            {new Date(appointment.scheduled_start).toLocaleTimeString()} - {new Date(appointment.scheduled_end).toLocaleTimeString()}
          </div>
        </div>
      ),
    },
    { key: 'status', header: 'Status', render: (appointment: AppointmentResponse) => <StatusBadge status={appointment.status} type="appointment" /> },
    { key: 'notes', header: 'Notes', render: (appointment: AppointmentResponse) => <span className="text-sm text-gray-500">{appointment.client_notes || '-'}</span> },
    { key: 'actions', header: 'Actions', className: 'text-right', render: renderActions },
  ]

  return (
    <AppLayout>
      <div className="space-y-6">
        <PageHeader title="Appointments" subtitle="Manage your appointments and reschedule requests" />

        {error && !rescheduleDialog.isOpen && (
          <ErrorState message={error} onRetry={loadAppointments} />
        )}

        <FilterPanel
          title="Filters"
          hasFilters={!!statusFilter}
          onClear={() => handleStatusFilterChange('')}
        >
          <div className="flex flex-wrap gap-4 items-end">
            <Select
              id="status-filter"
              value={statusFilter}
              onChange={handleStatusFilterChange}
              label="Status"
              options={statusFilterOptions}
              className="w-44"
            />
          </div>
        </FilterPanel>

        <DataTable
          columns={tableColumns}
          rows={appointments}
          keyExtractor={(appointment) => appointment.id}
          isLoading={isLoading}
          loadingMessage="Loading appointments…"
          emptyTitle="No appointments found"
          emptyDescription="No appointments match the current filter."
        />

        <div className="flex items-center justify-between">
          <Button type="button" variant="outline" size="sm" onClick={handlePreviousPage} disabled={skip === 0}>Previous</Button>
          <span className="text-sm text-gray-600">
            Showing {skip + 1}-{Math.min(skip + limit, appointments.length + skip)}
          </span>
          <Button type="button" variant="outline" size="sm" onClick={handleNextPage} disabled={appointments.length < limit}>Next</Button>
        </div>
      </div>

      <Modal
        isOpen={rescheduleDialog.isOpen}
        onClose={handleCloseReschedule}
        title="Reschedule Appointment"
        footer={
          <div className="flex gap-2 justify-end">
            <Button type="button" variant="ghost" size="sm" onClick={handleCloseReschedule}>Cancel</Button>
            <Button type="button" size="sm" onClick={handleReschedule} isLoading={isRescheduling}>Reschedule</Button>
          </div>
        }
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="bg-accent-50 border border-accent-200 text-accent-700 px-4 py-3 rounded-2xl" role="alert" aria-live="polite">
              {error}
            </div>
          )}
          <Input
            id="scheduled-start"
            type="datetime-local"
            value={rescheduleData.scheduled_start}
            onChange={v => setRescheduleData(prev => ({ ...prev, scheduled_start: v }))}
            label="New Start Date & Time"
            required
          />
          <Input
            id="scheduled-end"
            type="datetime-local"
            value={rescheduleData.scheduled_end}
            onChange={v => setRescheduleData(prev => ({ ...prev, scheduled_end: v }))}
            label="New End Date & Time"
            required
          />
          <Textarea
            id="agent-notes"
            value={rescheduleData.agent_notes}
            onChange={v => setRescheduleData(prev => ({ ...prev, agent_notes: v }))}
            label="Agent Notes"
            placeholder="Add notes about the reschedule..."
            rows={3}
          />
        </form>
      </Modal>
    </AppLayout>
  )
}
