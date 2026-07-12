import { useState, useEffect } from 'react'
import AppLayout from '../../components/layout/AppLayout'
import {
  PageHeader,
  MetricCard,
  SectionHeader,
  Card,
  LoadingState,
  ErrorState,
} from '../../components/ui/shared'
import Button from '../../components/ui/Button'
import { agentPropertiesApi, PropertyResponse } from '../../lib/agentPropertiesApi'
import { agentAppointmentsApi, AppointmentResponse } from '../../lib/agentAppointmentsApi'
import { agentConversationsApi, ConversationResponse } from '../../lib/agentConversationsApi'
import { notificationsApi } from '../../lib/notificationsApi'
import { useAuth } from '../../contexts/AuthContext'
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
  const { user } = useAuth()
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
      const results = await Promise.allSettled([
        agentPropertiesApi.listMyProperties(undefined, 0, 1000),
        agentAppointmentsApi.getAgentAppointments('requested', undefined, undefined, undefined, 0, 1000),
        agentConversationsApi.getMyConversations(true),
        notificationsApi.getUnreadCount(),
      ])

      const [propertiesRes, appointmentsRes, conversationsRes, notificationsRes] = results
      const allProperties = propertiesRes.status === 'fulfilled' ? (propertiesRes.value as PropertyResponse[]) : []
      const requestedAppointments = appointmentsRes.status === 'fulfilled' ? (appointmentsRes.value as AppointmentResponse[]) : []
      const activeConversations = conversationsRes.status === 'fulfilled' ? (conversationsRes.value as ConversationResponse[]) : []
      const unreadCount = notificationsRes.status === 'fulfilled' ? (notificationsRes.value as { unread_count: number }).unread_count : 0

      setMetrics({
        totalListings: allProperties.length,
        availableListings: allProperties.filter((p) => p.status === 'available').length,
        reservedListings: allProperties.filter((p) => p.status === 'reserved').length,
        soldListings: allProperties.filter((p) => p.status === 'sold').length,
        rentedListings: allProperties.filter((p) => p.status === 'rented').length,
        upcomingAppointments: requestedAppointments.length,
        activeConversations: activeConversations.length,
        unreadNotifications: unreadCount,
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
        <PageHeader
          title="Agent Dashboard"
          subtitle={`Welcome back, ${user?.first_name || 'Agent'}`}
          action={
            <Button as="Link" to="/agent/properties/new">
              Add Property
            </Button>
          }
        />

        {isLoading ? (
          <LoadingState />
        ) : error ? (
          <ErrorState message={error} onRetry={loadDashboardData} />
        ) : (
          <>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <MetricCard title="Total Listings" value={metrics?.totalListings ?? 0} />
              <MetricCard title="Available" value={metrics?.availableListings ?? 0} />
              <MetricCard title="Reserved" value={metrics?.reservedListings ?? 0} />
              <MetricCard title="Sold" value={metrics?.soldListings ?? 0} />
              <MetricCard title="Rented" value={metrics?.rentedListings ?? 0} />
              <MetricCard title="Pending Appointments" value={metrics?.upcomingAppointments ?? 0} />
              <MetricCard title="Active Chats" value={metrics?.activeConversations ?? 0} />
              <MetricCard title="Unread Alerts" value={metrics?.unreadNotifications ?? 0} />
            </div>

            <Card>
              <SectionHeader title="Quick Actions" />
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                <Button as="Link" to="/agent/properties/new">
                  Add Property
                </Button>
                <Button as="Link" to="/agent/properties" variant="secondary">
                  My Listings
                </Button>
                <Button as="Link" to="/agent/appointments" variant="secondary">
                  Appointments
                </Button>
                <Button as="Link" to="/agent/conversations" variant="secondary">
                  Messages
                </Button>
                <Button as="Link" to="/agent/profile" variant="secondary">
                  Edit Profile
                </Button>
                <Button as="Link" to="/agent/notifications" variant="secondary">
                  Notifications
                </Button>
              </div>
            </Card>
          </>
        )}
      </div>
    </AppLayout>
  )
}
