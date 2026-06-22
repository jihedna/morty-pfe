import { useState, useEffect, useCallback } from 'react'
import AppLayout from '../../components/layout/AppLayout'
import { adminAppointmentsApi, AppointmentResponse } from '../../lib/adminAppointmentsApi'
import { extractApiError } from '../../utils/format'

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

  const handleFilterChange = (field: string, value: string) => {
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

  const handleReschedule = async (appointmentId: string) => {
    const newStart = prompt('Enter new start time (ISO format):')
    const newEnd = prompt('Enter new end time (ISO format):')
    if (!newStart || !newEnd) return

    try {
      await adminAppointmentsApi.rescheduleAppointment(appointmentId, {
        scheduled_start: newStart,
        scheduled_end: newEnd,
      })
      loadAppointments()
    } catch (err) {
      const errorMessage = extractApiError(err)
      setError(errorMessage || 'Failed to reschedule appointment')
      if (errorMessage?.includes('409')) {
        setError('Scheduling conflict: This time slot is already booked')
      }
    }
  }

  if (isLoading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center py-12" aria-live="polite" aria-busy="true">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" aria-hidden="true"></div>
          <span className="sr-only">Loading appointments...</span>
        </div>
      </AppLayout>
    )
  }

  return (
    <AppLayout>
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">Appointment Administration</h1>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded" role="alert" aria-live="polite">
            {error}
          </div>
        )}

        {/* Filters */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-4">Filters</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-1">
                Status
              </label>
              <select
                id="status"
                value={filters.status}
                onChange={(e) => handleFilterChange('status', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Statuses</option>
                <option value="requested">Requested</option>
                <option value="confirmed">Confirmed</option>
                <option value="rescheduled">Rescheduled</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
                <option value="no_show">No Show</option>
              </select>
            </div>
            <div>
              <label htmlFor="agent-id" className="block text-sm font-medium text-gray-700 mb-1">
                Agent ID
              </label>
              <input
                id="agent-id"
                type="text"
                value={filters.agent_id}
                onChange={(e) => handleFilterChange('agent_id', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Agent ID"
              />
            </div>
            <div>
              <label htmlFor="property-id" className="block text-sm font-medium text-gray-700 mb-1">
                Property ID
              </label>
              <input
                id="property-id"
                type="text"
                value={filters.property_id}
                onChange={(e) => handleFilterChange('property_id', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Property ID"
              />
            </div>
            <div>
              <label htmlFor="date-from" className="block text-sm font-medium text-gray-700 mb-1">
                Date From
              </label>
              <input
                id="date-from"
                type="date"
                value={filters.date_from}
                onChange={(e) => handleFilterChange('date_from', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label htmlFor="date-to" className="block text-sm font-medium text-gray-700 mb-1">
                Date To
              </label>
              <input
                id="date-to"
                type="date"
                value={filters.date_to}
                onChange={(e) => handleFilterChange('date_to', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="flex items-end gap-2">
              <button
                onClick={handleResetFilters}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
              >
                Reset
              </button>
            </div>
          </div>
        </div>

        {/* Appointment List */}
        <div className="bg-white rounded-lg shadow">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Property</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Client</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Agent</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Scheduled</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {appointments.map((appointment) => (
                  <tr key={appointment.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{appointment.property.title}</div>
                      <div className="text-sm text-gray-500">{appointment.property.reference_code}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {appointment.client.first_name} {appointment.client.last_name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {appointment.agent.user.first_name} {appointment.agent.user.last_name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <div>{new Date(appointment.scheduled_start).toLocaleString()}</div>
                      <div className="text-gray-500">to {new Date(appointment.scheduled_end).toLocaleString()}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <select
                        value={appointment.status}
                        onChange={(e) => handleStatusChange(appointment.id, e.target.value)}
                        className="text-sm border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="requested">Requested</option>
                        <option value="confirmed">Confirmed</option>
                        <option value="rescheduled">Rescheduled</option>
                        <option value="completed">Completed</option>
                        <option value="cancelled">Cancelled</option>
                        <option value="no_show">No Show</option>
                      </select>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <button
                        onClick={() => handleReschedule(appointment.id)}
                        className="text-blue-600 hover:text-blue-800 mr-3 focus:outline-none focus:underline"
                      >
                        Reschedule
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {appointments.length === 0 && (
            <div className="text-center py-12 text-gray-500">
              No appointments found matching the current filters.
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  )
}
