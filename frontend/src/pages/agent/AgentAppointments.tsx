import { useState, useEffect, useCallback } from 'react'
import AppLayout from '../../components/layout/AppLayout'
import { agentAppointmentsApi, AppointmentResponse, AppointmentStatusUpdate, AppointmentReschedule } from '../../lib/agentAppointmentsApi'
import { extractApiError } from '../../utils/format'

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

  const handleReschedule = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    // Validation
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

    const durationMs = endDate.getTime() - startDate.getTime()
    const durationMinutes = durationMs / (1000 * 60)

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
        scheduled_start: new Date(rescheduleData.scheduled_start).toISOString(),
        scheduled_end: new Date(rescheduleData.scheduled_end).toISOString(),
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

  const handlePreviousPage = () => {
    if (skip > 0) {
      setSkip(skip - limit)
    }
  }

  const handleNextPage = () => {
    setSkip(skip + limit)
  }

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'requested':
        return 'bg-yellow-100 text-yellow-800'
      case 'confirmed':
        return 'bg-green-100 text-green-800'
      case 'completed':
        return 'bg-blue-100 text-blue-800'
      case 'cancelled':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <AppLayout>
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">Appointments</h1>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded" role="alert" aria-live="polite">
            {error}
          </div>
        )}

        <div className="bg-white rounded-lg shadow p-6 space-y-4">
          <div className="flex flex-wrap gap-4">
            <div>
              <label htmlFor="status-filter" className="block text-sm font-medium text-gray-700 mb-1">
                Status
              </label>
              <select
                id="status-filter"
                value={statusFilter}
                onChange={(e) => handleStatusFilterChange(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Statuses</option>
                <option value="requested">Requested</option>
                <option value="confirmed">Confirmed</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center py-12" aria-live="polite" aria-busy="true">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" aria-hidden="true"></div>
              <span className="sr-only">Loading appointments...</span>
            </div>
          ) : appointments.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              No appointments found
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Property
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Client
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Date & Time
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Notes
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {appointments.map((appointment) => (
                      <tr key={appointment.id}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <div className="text-sm font-medium text-gray-900">{appointment.property.title}</div>
                            <div className="text-sm text-gray-500">{appointment.property.reference_code}</div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {appointment.client.first_name} {appointment.client.last_name}
                          </div>
                          <div className="text-sm text-gray-500">{appointment.client.email}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          <div>{new Date(appointment.scheduled_start).toLocaleDateString()}</div>
                          <div className="text-gray-500">
                            {new Date(appointment.scheduled_start).toLocaleTimeString()} -{' '}
                            {new Date(appointment.scheduled_end).toLocaleTimeString()}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusBadgeColor(appointment.status)}`}>
                            {appointment.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {appointment.client_notes || '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <div className="flex justify-end gap-2 flex-wrap">
                            {appointment.status === 'requested' && (
                              <>
                                <button
                                  onClick={() => handleUpdateStatus(appointment.id, 'confirmed')}
                                  className="text-green-600 hover:text-green-900"
                                >
                                  Confirm
                                </button>
                                <button
                                  onClick={() => handleOpenReschedule(appointment)}
                                  className="text-blue-600 hover:text-blue-900"
                                >
                                  Reschedule
                                </button>
                                <button
                                  onClick={() => handleUpdateStatus(appointment.id, 'cancelled')}
                                  className="text-red-600 hover:text-red-900"
                                >
                                  Cancel
                                </button>
                              </>
                            )}
                            {appointment.status === 'confirmed' && (
                              <>
                                <button
                                  onClick={() => handleUpdateStatus(appointment.id, 'completed')}
                                  className="text-blue-600 hover:text-blue-900"
                                >
                                  Complete
                                </button>
                                <button
                                  onClick={() => handleOpenReschedule(appointment)}
                                  className="text-blue-600 hover:text-blue-900"
                                >
                                  Reschedule
                                </button>
                                <button
                                  onClick={() => handleUpdateStatus(appointment.id, 'no_show')}
                                  className="text-orange-600 hover:text-orange-900"
                                >
                                  No Show
                                </button>
                                <button
                                  onClick={() => handleUpdateStatus(appointment.id, 'cancelled')}
                                  className="text-red-600 hover:text-red-900"
                                >
                                  Cancel
                                </button>
                              </>
                            )}
                            {appointment.status === 'rescheduled' && (
                              <>
                                <button
                                  onClick={() => handleUpdateStatus(appointment.id, 'completed')}
                                  className="text-blue-600 hover:text-blue-900"
                                >
                                  Complete
                                </button>
                                <button
                                  onClick={() => handleUpdateStatus(appointment.id, 'no_show')}
                                  className="text-orange-600 hover:text-orange-900"
                                >
                                  No Show
                                </button>
                                <button
                                  onClick={() => handleUpdateStatus(appointment.id, 'cancelled')}
                                  className="text-red-600 hover:text-red-900"
                                >
                                  Cancel
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="flex items-center justify-between">
                <button
                  onClick={handlePreviousPage}
                  disabled={skip === 0}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 disabled:bg-gray-100 disabled:cursor-not-allowed"
                >
                  Previous
                </button>
                <span className="text-sm text-gray-600">
                  Showing {skip + 1}-{Math.min(skip + limit, appointments.length + skip)}
                </span>
                <button
                  onClick={handleNextPage}
                  disabled={appointments.length < limit}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 disabled:bg-gray-100 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </div>
            </>
          )}
        </div>

        {/* Reschedule Dialog */}
        {rescheduleDialog.isOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-lg max-w-md w-full mx-4 p-6">
              <h2 className="text-xl font-semibold mb-4">Reschedule Appointment</h2>
              
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4" role="alert">
                  {error}
                </div>
              )}

              <form onSubmit={handleReschedule} className="space-y-4">
                <div>
                  <label htmlFor="scheduled_start" className="block text-sm font-medium text-gray-700 mb-1">
                    New Start Date & Time *
                  </label>
                  <input
                    type="datetime-local"
                    id="scheduled_start"
                    value={rescheduleData.scheduled_start}
                    onChange={(e) => setRescheduleData({ ...rescheduleData, scheduled_start: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>

                <div>
                  <label htmlFor="scheduled_end" className="block text-sm font-medium text-gray-700 mb-1">
                    New End Date & Time *
                  </label>
                  <input
                    type="datetime-local"
                    id="scheduled_end"
                    value={rescheduleData.scheduled_end}
                    onChange={(e) => setRescheduleData({ ...rescheduleData, scheduled_end: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>

                <div>
                  <label htmlFor="agent_notes" className="block text-sm font-medium text-gray-700 mb-1">
                    Agent Notes
                  </label>
                  <textarea
                    id="agent_notes"
                    value={rescheduleData.agent_notes}
                    onChange={(e) => setRescheduleData({ ...rescheduleData, agent_notes: e.target.value })}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Add notes about the reschedule..."
                  />
                </div>

                <div className="flex justify-end gap-4 pt-4">
                  <button
                    type="button"
                    onClick={handleCloseReschedule}
                    className="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isRescheduling}
                    className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                  >
                    {isRescheduling ? 'Rescheduling...' : 'Reschedule'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  )
}
