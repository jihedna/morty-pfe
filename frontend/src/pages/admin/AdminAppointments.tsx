import { useState, useEffect, useCallback } from 'react'
import AppLayout from '../../components/layout/AppLayout'
import { adminAppointmentsApi, AppointmentResponse } from '../../lib/adminAppointmentsApi'
import { extractApiError } from '../../utils/format'
import { DataTable, FilterPanel, PageHeader, LoadingState, ErrorState } from '../../components/ui/shared'
import Input from '../../components/ui/Input'
import Select from '../../components/ui/Select'
import Button from '../../components/ui/Button'
import Modal from '../../components/ui/Modal'

const statusOptions = [
  { value: 'requested', label: 'Requested' },
  { value: 'confirmed', label: 'Confirmed' },
  { value: 'rescheduled', label: 'Rescheduled' },
  { value: 'completed', label: 'Completed' },
  { value: 'cancelled', label: 'Cancelled' },
  { value: 'no_show', label: 'No Show' },
]

const statusFilterOptions = [
  { value: '', label: 'All Statuses' },
  ...statusOptions,
]

const managerStatusTransitions: Record<string, string[]> = {
  pending: ['pending', 'confirmed', 'cancelled'],
  requested: ['requested', 'confirmed', 'cancelled'],
  confirmed: ['confirmed', 'rescheduled', 'cancelled', 'completed', 'no_show'],
  rescheduled: ['rescheduled', 'confirmed', 'cancelled', 'completed', 'no_show'],
  completed: ['completed'],
  cancelled: ['cancelled'],
  no_show: ['no_show'],
}

const terminalStatuses = new Set(['completed', 'cancelled', 'no_show'])

function toDateTimeLocal(date: string | Date) {
  const d = new Date(date)
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  const hours = String(d.getHours()).padStart(2, '0')
  const minutes = String(d.getMinutes()).padStart(2, '0')
  return `${year}-${month}-${day}T${hours}:${minutes}`
}

export default function AdminAppointments() {
  const [appointments, setAppointments] = useState<AppointmentResponse[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filters, setFilters] = useState({
    status: '',
    agent_id: '',
    property_id: '',
    date_from: '',
    date_to: '',
  })
  const [skip, setSkip] = useState(0)
  const [reschedule, setReschedule] = useState<{
    id: string | null
    start: string
    end: string
  }>({ id: null, start: '', end: '' })
  const limit = 20

  const loadAppointments = useCallback(async () => {
    setIsLoading(true)
    setError(null)

    try {
      const data = await adminAppointmentsApi.getAllAppointments({
        status: filters.status || undefined,
        agent_id: filters.agent_id || undefined,
        property_id: filters.property_id || undefined,
        date_from: filters.date_from || undefined,
        date_to: filters.date_to || undefined,
        skip,
        limit,
      })
      setAppointments(data)
    } catch (err) {
      const errorMessage = extractApiError(err)
      setError(errorMessage || 'Failed to load appointments')
    } finally {
      setIsLoading(false)
    }
  }, [filters, skip, limit])

  useEffect(() => {
    loadAppointments()
  }, [loadAppointments])

  const handleFilterChange = (field: keyof typeof filters, value: string) => {
    setFilters(prev => ({ ...prev, [field]: value }))
    setSkip(0)
  }

  const handleResetFilters = () => {
    setFilters({
      status: '',
      agent_id: '',
      property_id: '',
      date_from: '',
      date_to: '',
    })
    setSkip(0)
  }

  const handleStatusChange = async (appointmentId: string, newStatus: string) => {
    try {
      await adminAppointmentsApi.updateAppointmentStatus(appointmentId, { status: newStatus })
      loadAppointments()
    } catch (err) {
      const errorMessage = extractApiError(err)
      setError(errorMessage || 'Failed to update appointment status')
      if (errorMessage?.includes('409')) {
        setError('Scheduling conflict: This time slot is already booked')
      }
    }
  }

  const handleRescheduleSubmit = async () => {
    if (!reschedule.id || !reschedule.start || !reschedule.end) return
    try {
      const start = new Date(reschedule.start + ':00').toISOString()
      const end = new Date(reschedule.end + ':00').toISOString()
      await adminAppointmentsApi.rescheduleAppointment(reschedule.id, {
        scheduled_start: start,
        scheduled_end: end,
      })
      setReschedule({ id: null, start: '', end: '' })
      loadAppointments()
    } catch (err) {
      const errorMessage = extractApiError(err)
      setError(errorMessage || 'Failed to reschedule appointment')
      if (errorMessage?.includes('409')) {
        setError('Scheduling conflict: This time slot is already booked')
      }
    }
  }

  const openReschedule = (appointment: AppointmentResponse) => {
    setReschedule({
      id: appointment.id,
      start: toDateTimeLocal(appointment.scheduled_start),
      end: toDateTimeLocal(appointment.scheduled_end),
    })
  }

  const hasFilters = Object.values(filters).some(Boolean)

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
    { key: 'client', header: 'Client', render: (appointment: AppointmentResponse) => <span className="text-sm text-gray-900">{appointment.client.first_name} {appointment.client.last_name}</span> },
    { key: 'agent', header: 'Agent', render: (appointment: AppointmentResponse) => <span className="text-sm text-gray-900">{appointment.agent.user.first_name} {appointment.agent.user.last_name}</span> },
    {
      key: 'scheduled',
      header: 'Scheduled',
      render: (appointment: AppointmentResponse) => (
        <div className="text-sm text-gray-900">
          <div>{new Date(appointment.scheduled_start).toLocaleString()}</div>
          <div className="text-gray-500">to {new Date(appointment.scheduled_end).toLocaleString()}</div>
        </div>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (appointment: AppointmentResponse) => {
        const allowedStatuses = managerStatusTransitions[appointment.status] ?? [appointment.status]
        const currentStatusOption = statusOptions.some(option => option.value === appointment.status)
          ? []
          : [{ value: appointment.status, label: appointment.status.replace('_', ' ').replace(/\b\w/g, letter => letter.toUpperCase()) }]
        const allowedOptions = [
          ...currentStatusOption,
          ...statusOptions.filter(option => allowedStatuses.includes(option.value)),
        ]

        if (terminalStatuses.has(appointment.status)) {
          return (
            <span className="inline-flex rounded-full bg-gray-100 px-3 py-1 text-sm font-medium capitalize text-gray-700">
              {appointment.status.replace('_', ' ')}
            </span>
          )
        }

        return (
          <Select
            value={appointment.status}
            onChange={v => handleStatusChange(appointment.id, v)}
            options={allowedOptions}
            className="w-36"
          />
        )
      },
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (appointment: AppointmentResponse) => terminalStatuses.has(appointment.status) ? (
        <span className="text-sm text-gray-400">Final</span>
      ) : (
        <Button type="button" variant="ghost" size="sm" onClick={() => openReschedule(appointment)}>
          Reschedule
        </Button>
      ),
    },
  ]

  if (isLoading && appointments.length === 0) {
    return (
      <AppLayout>
        <LoadingState message='Loading appointments…' />
      </AppLayout>
    )
  }

  return (
    <AppLayout>
      <div className="space-y-6">
        <PageHeader
          title='Appointment Administration'
          subtitle={`${appointments.length} appointments`}
          action={
            <Button type='button' onClick={() => loadAppointments()} size='sm'>
              Refresh
            </Button>
          }
        />

        {error && (
          <ErrorState message={error} onRetry={loadAppointments} />
        )}

        <FilterPanel
          title="Filters"
          hasFilters={hasFilters}
          onClear={handleResetFilters}
        >
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Select
              id="status"
              value={filters.status}
              onChange={v => handleFilterChange('status', v)}
              label="Status"
              options={statusFilterOptions}
            />
            <Input
              id="agent-id"
              value={filters.agent_id}
              onChange={v => handleFilterChange('agent_id', v)}
              label="Agent ID"
              placeholder="Agent ID"
            />
            <Input
              id="property-id"
              value={filters.property_id}
              onChange={v => handleFilterChange('property_id', v)}
              label="Property ID"
              placeholder="Property ID"
            />
            <Input
              id="date-from"
              type="date"
              value={filters.date_from}
              onChange={v => handleFilterChange('date_from', v)}
              label="Date From"
            />
            <Input
              id="date-to"
              type="date"
              value={filters.date_to}
              onChange={v => handleFilterChange('date_to', v)}
              label="Date To"
            />
          </div>
        </FilterPanel>

        <DataTable
          columns={tableColumns}
          rows={appointments}
          keyExtractor={(appointment) => appointment.id}
          isLoading={isLoading}
          emptyTitle="No appointments found"
          emptyDescription="No appointments found matching the current filters"
        />
      </div>

      <Modal
        isOpen={!!reschedule.id}
        onClose={() => setReschedule({ id: null, start: '', end: '' })}
        title="Reschedule Appointment"
        footer={
          <div className="flex gap-2 justify-end">
            <Button type="button" variant="ghost" size="sm" onClick={() => setReschedule({ id: null, start: '', end: '' })}>
              Cancel
            </Button>
            <Button type="button" size="sm" onClick={handleRescheduleSubmit}>
              Reschedule
            </Button>
          </div>
        }
      >
        <div className="space-y-4">
          <Input
            id="reschedule-start"
            type="datetime-local"
            value={reschedule.start}
            onChange={v => setReschedule(prev => ({ ...prev, start: v }))}
            label="Start"
          />
          <Input
            id="reschedule-end"
            type="datetime-local"
            value={reschedule.end}
            onChange={v => setReschedule(prev => ({ ...prev, end: v }))}
            label="End"
          />
        </div>
      </Modal>
    </AppLayout>
  )
}
