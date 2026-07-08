import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import AppLayout from '../../components/layout/AppLayout'
import { appointmentsApi } from '../../lib/appointmentsApi'
import { AppointmentResponse } from '../../types/appointment'

export default function ClientAppointments() {
  const [appointments, setAppointments] = useState<AppointmentResponse[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

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

  const handleCancel = async (appointmentId: string) => {
    if (confirm('Are you sure you want to cancel this appointment?')) {
      try {
        await appointmentsApi.cancelAppointment(appointmentId)
        loadAppointments()
      } catch (err) {
        setError('Failed to cancel appointment')
      }
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'requested':
        return 'bg-yellow-100 text-yellow-800'
      case 'confirmed':
        return 'bg-green-100 text-green-800'
      case 'rescheduled':
        return 'bg-blue-100 text-blue-800'
      case 'cancelled':
        return 'bg-red-100 text-red-800'
      case 'completed':
        return 'bg-gray-100 text-gray-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <AppLayout>
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">Appointments</h1>

        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : error ? (
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-red-800 mb-2">Error</h3>
            <p className="text-red-600">{error}</p>
            <button
              onClick={loadAppointments}
              className="mt-4 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
            >
              Retry
            </button>
          </div>
        ) : appointments.length === 0 ? (
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-2">No Appointments</h2>
            <p className="text-gray-600 mb-4">
              Schedule property viewings with agents.
            </p>
            <Link
              to="/properties"
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              Browse Properties
            </Link>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Property
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
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {appointments.map((appointment) => (
                  <tr key={appointment.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {appointment.property ? (
                        <Link
                          to={`/properties/${appointment.property.id}`}
                          className="text-blue-600 hover:text-blue-800"
                        >
                          {appointment.property.title || appointment.property.id}
                        </Link>
                      ) : (
                        'N/A'
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(appointment.scheduled_start).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs rounded capitalize ${getStatusColor(appointment.status)}`}>
                        {appointment.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {appointment.client_notes || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm space-x-2">
                      {appointment.status !== 'cancelled' && appointment.status !== 'completed' && (
                        <button
                          onClick={() => handleCancel(appointment.id)}
                          className="text-red-600 hover:text-red-800"
                        >
                          Cancel
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </AppLayout>
  )
}
