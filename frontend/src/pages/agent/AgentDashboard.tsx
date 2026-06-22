import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import AppLayout from '../../components/layout/AppLayout'
import { agentPropertiesApi } from '../../lib/agentPropertiesApi'
import { agentAppointmentsApi } from '../../lib/agentAppointmentsApi'
import { agentConversationsApi } from '../../lib/agentConversationsApi'
import { notificationsApi } from '../../lib/notificationsApi'
import { extractApiError } from '../../utils/format'

interface DashboardMetrics {
  totalListings: number
  availableListings: number
  reservedListings: number
  soldListings: number
  rentedListings: number
  upcomingAppointments: number
  activeConversations: number
  unreadNotifications: number
}

export default function AgentDashboard() {
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadDashboardData()
  }, [])

  const loadDashboardData = async () => {
    setIsLoading(true)
    setError(null)

    try {
      // Load data in parallel with error handling
      const results = await Promise.allSettled([
        agentPropertiesApi.listMyProperties(undefined, 0, 1000),
        agentPropertiesApi.listMyProperties('available', 0, 1000),
        agentPropertiesApi.listMyProperties('reserved', 0, 1000),
        agentPropertiesApi.listMyProperties('sold', 0, 1000),
        agentPropertiesApi.listMyProperties('rented', 0, 1000),
        agentAppointmentsApi.getAgentAppointments('requested', undefined, undefined, undefined, 0, 1000),
        agentConversationsApi.getMyConversations(true),
        notificationsApi.getUnreadCount(),
      ])

      const [
        allProperties,
        availableProperties,
        reservedProperties,
        soldProperties,
        rentedProperties,
        requestedAppointments,
        activeConversations,
        unreadNotifications,
      ] = results.map((result, index) => {
        if (result.status === 'fulfilled') {
          return result.value
        }
        // Return appropriate null/default based on index
        if (index === 7) return { unread_count: 0 } as { unread_count: number } // unreadNotifications
        return [] as unknown[] // arrays
      })

      setMetrics({
        totalListings: (allProperties as unknown[] | undefined)?.length || 0,
        availableListings: (availableProperties as unknown[] | undefined)?.length || 0,
        reservedListings: (reservedProperties as unknown[] | undefined)?.length || 0,
        soldListings: (soldProperties as unknown[] | undefined)?.length || 0,
        rentedListings: (rentedProperties as unknown[] | undefined)?.length || 0,
        upcomingAppointments: (requestedAppointments as unknown[] | undefined)?.length || 0,
        activeConversations: (activeConversations as unknown[] | undefined)?.length || 0,
        unreadNotifications: (unreadNotifications as { unread_count: number } | undefined)?.unread_count || 0,
      })
    } catch (err) {
      const errorMessage = extractApiError(err)
      setError(errorMessage || 'Failed to load dashboard data')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Agent Dashboard</h1>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded" role="alert" aria-live="polite">
            {error}
          </div>
        )}

        {isLoading ? (
          <div className="flex items-center justify-center py-12" aria-live="polite" aria-busy="true">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" aria-hidden="true"></div>
            <span className="sr-only">Loading dashboard data...</span>
          </div>
        ) : metrics ? (
          <>
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <MetricCard title="Total Listings" value={metrics.totalListings} />
              <MetricCard title="Available" value={metrics.availableListings} />
              <MetricCard title="Reserved" value={metrics.reservedListings} />
              <MetricCard title="Sold" value={metrics.soldListings} />
              <MetricCard title="Rented" value={metrics.rentedListings} />
              <MetricCard title="Upcoming Appointments" value={metrics.upcomingAppointments} />
              <MetricCard title="Active Conversations" value={metrics.activeConversations} />
              <MetricCard title="Unread Notifications" value={metrics.unreadNotifications} />
            </div>

            {/* Quick Actions */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold mb-4">Quick Actions</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <QuickActionLink to="/agent/properties/new" label="Add Property" />
                <QuickActionLink to="/agent/properties" label="Manage Listings" />
                <QuickActionLink to="/agent/appointments" label="View Appointments" />
                <QuickActionLink to="/agent/conversations" label="Open Messages" />
                <QuickActionLink to="/agent/profile" label="Edit Profile" />
                <QuickActionLink to="/agent/notifications" label="Notifications" />
              </div>
            </div>
          </>
        ) : null}
      </div>
    </AppLayout>
  )
}

function MetricCard({ title, value }: { title: string; value: number }) {
  return (
    <div className="bg-white rounded-lg shadow p-6">
      <p className="text-sm text-gray-600">{title}</p>
      <p className="text-3xl font-bold text-gray-900" aria-label={`${title}: ${value}`}>{value}</p>
    </div>
  )
}

function QuickActionLink({ to, label }: { to: string; label: string }) {
  return (
    <Link
      to={to}
      className="block text-center px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
    >
      {label}
    </Link>
  )
}
