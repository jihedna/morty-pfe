import { useState, useEffect, useCallback } from 'react'
import { clientSearchRequestsApi } from '../lib/clientSearchRequestsApi'
import { propertyApi } from '../lib/propertyApi'
import { appointmentsApi } from '../lib/appointmentsApi'
import { notificationsApi } from '../lib/notificationsApi'
import { conversationsApi } from '../lib/conversationsApi'
import { savedSearchesApi } from '../lib/savedSearchesApi'
import { AppointmentResponse } from '../types/appointment'
import { ConversationResponse } from '../types/conversation'

interface ClientDashboardMetrics {
  activeSearchRequests: number
  agentMatches: number
  favoriteCount: number
  savedSearchCount: number
  upcomingAppointments: number
  unreadNotificationCount: number
  activeConversationCount: number
  recentAppointments: AppointmentResponse[]
  recentConversations: ConversationResponse[]
}

interface UseClientDashboardResult {
  data: ClientDashboardMetrics | null
  isLoading: boolean
  error: string | null
  refetch: () => Promise<void>
}

export function useClientDashboard(): UseClientDashboardResult {
  const [data, setData] = useState<ClientDashboardMetrics | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchDashboardMetrics = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      // Fetch all metrics in parallel
      const [
        searchRequests,
        favorites,
        savedSearches,
        appointments,
        notifications,
        conversations,
      ] = await Promise.allSettled([
        clientSearchRequestsApi.getMyRequests(true),
        propertyApi.listFavorites(0, 1),
        savedSearchesApi.getMySavedSearches(0, 1, false),
        appointmentsApi.getMyAppointments({ status: 'confirmed' }),
        notificationsApi.getUnreadCount(),
        conversationsApi.getMyConversations(true),
      ])

      const activeRequests = searchRequests.status === 'fulfilled' ? searchRequests.value : []
      let agentMatches = 0
      if (activeRequests.length > 0) {
        try {
          const matches = await clientSearchRequestsApi.getAgentMatches(activeRequests[0].id)
          agentMatches = matches.length
        } catch {
          agentMatches = 0
        }
      }

      const recentAppointments = appointments.status === 'fulfilled'
        ? appointments.value
            .filter(a => new Date(a.scheduled_start).getTime() >= Date.now() - 24 * 60 * 60 * 1000)
            .sort((a, b) => new Date(a.scheduled_start).getTime() - new Date(b.scheduled_start).getTime())
            .slice(0, 3)
        : []

      const recentConversations = conversations.status === 'fulfilled'
        ? conversations.value
            .sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime())
            .slice(0, 3)
        : []

      const metrics: ClientDashboardMetrics = {
        activeSearchRequests: activeRequests.length,
        agentMatches,
        favoriteCount: favorites.status === 'fulfilled' ? favorites.value.total : 0,
        savedSearchCount: savedSearches.status === 'fulfilled' ? savedSearches.value.total : 0,
        upcomingAppointments: appointments.status === 'fulfilled' ? appointments.value.length : 0,
        unreadNotificationCount: notifications.status === 'fulfilled' ? notifications.value.unread_count : 0,
        activeConversationCount: conversations.status === 'fulfilled' ? conversations.value.length : 0,
        recentAppointments,
        recentConversations,
      }

      setData(metrics)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch dashboard metrics')
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchDashboardMetrics()
  }, [fetchDashboardMetrics])

  return { data, isLoading, error, refetch: fetchDashboardMetrics }
}
