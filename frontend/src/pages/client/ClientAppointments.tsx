import { useState, useEffect } from 'react'
import AppLayout from '../../components/layout/AppLayout'
import { appointmentsApi } from '../../lib/appointmentsApi'
import { AppointmentResponse } from '../../types/appointment'
import { DataTable, ErrorState, PageHeader } from '../../components/ui/shared'
import Button from '../../components/ui/Button'
import { StatusBadge } from '../../components/StatusBadge'
import ConfirmDialog from '../../components/common/ConfirmDialog'

export default function ClientAppointments() {
  const [appointments, setAppointments] = useState<AppointmentResponse[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [cancelId, setCancelId] = useState<string | null>(null)

  const loadAppointments = async () => {
    try {
      setIsLoading(true)
      setError(null)
      const data = await appointmentsApi.getMyAppointments()
      setAppointments(data)
    } catch (err) {
      setError('Failed to load appointments')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadAppointments()
  }, [])

  const handleConfirmCancel = async () => {
    if (!cancelId) return
    try {
      await appointmentsApi.cancelAppointment(cancelId)
      setCancelId(null)
      loadAppointments()
    } catch (err) {
      setError('Failed to cancel appointment')
    }
  }

  const tableColumns = [
    {
      key: 'property',
      header: 'Property',
      render: (appointment: AppointmentResponse) =>
        appointment.property ? (
          <Button as="Link" to={`/properties/${appointment.property.id}`} variant="ghost" size="sm" className="!p-0">
            {appointment.property.title || appointment.property.id}
          </Button>
        ) : (
          <span className="text-sm text-gray-500">N/A</span>
        ),
    },
    { key: 'agent', header: 'Agent', render: (appointment: AppointmentResponse) => <span className="text-sm text-gray-700">{appointment.agent.user ? `${appointment.agent.user.first_name} ${appointment.agent.user.last_name}` : appointment.agent.id}</span> },
    { key: 'dateTime', header: 'Date & Time', render: (appointment: AppointmentResponse) => <span className="text-sm text-gray-500">{new Date(appointment.scheduled_start).toLocaleString()}</span> },
    { key: 'status', header: 'Status', render: (appointment: AppointmentResponse) => <StatusBadge status={appointment.status} type="appointment" /> },
    { key: 'notes', header: 'Notes', render: (appointment: AppointmentResponse) => <span className="text-sm text-gray-500">{appointment.client_notes || '-'}</span> },
    {
      key: 'actions',
      header: 'Actions',
      render: (appointment: AppointmentResponse) =>
        appointment.status !== 'cancelled' && appointment.status !== 'completed' ? (
          <Button type="button" variant="danger" size="sm" onClick={() => setCancelId(appointment.id)}>
            Cancel
          </Button>
        ) : (
          <span className="text-sm text-gray-400">—</span>
        ),
    },
  ]

  return (
    <AppLayout>
      <div className="mx-auto max-w-[1500px] space-y-6">
        <PageHeader
          title="Appointments"
          subtitle="Schedule property viewings with agents."
        />

        {error ? (
          <ErrorState message={error} onRetry={loadAppointments} />
        ) : (
          <DataTable
            columns={tableColumns}
            rows={appointments}
            keyExtractor={(appointment) => appointment.id}
            isLoading={isLoading}
            emptyTitle="No Appointments"
            emptyDescription="Schedule property viewings with agents."
            emptyAction={
              <Button as="Link" to="/properties" size="sm">
                Browse Properties
              </Button>
            }
          />
        )}
      </div>

      <ConfirmDialog
        isOpen={!!cancelId}
        title="Cancel Appointment"
        message="Are you sure you want to cancel this appointment?"
        confirmLabel="Cancel"
        cancelLabel="Keep"
        onConfirm={handleConfirmCancel}
        onCancel={() => setCancelId(null)}
        isDestructive
      />
    </AppLayout>
  )
}
