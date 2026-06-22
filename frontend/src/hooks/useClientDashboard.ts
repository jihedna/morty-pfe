import { useState, useEffect, useCallback } from 'react'
import { clientSearchRequestsApi } from '../lib/clientSearchRequestsApi'
import { propertyApi } from '../lib/propertyApi'
import { appointmentsApi } from '../lib/appointmentsApi'
import { notificationsApi } from '../lib/notificationsApi'
import { conversationsApi } from '../lib/conversationsApi'
import { savedSearchesApi } from '../lib/savedSearchesApi'

interface ClientDashboardMetrics {
  activeSearchRequests: number
  favoriteCount: number
  savedSearchCount: number
  upcomingAppointments: number
  unreadNotificationCount: number
  activeConversationCount: number
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

      const metrics: ClientDashboardMetrics = {
        activeSearchRequests: searchRequests.status === 'fulfilled' ? searchRequests.value.length : 0,
        favoriteCount: favorites.status === 'fulfilled' ? favorites.value.total : 0,
        savedSearchCount: savedSearches.status === 'fulfilled' ? savedSearches.value.total : 0,
        upcomingAppointments: appointments.status === 'fulfilled' ? appointments.value.length : 0,
        unreadNotificationCount: notifications.status === 'fulfilled' ? notifications.value.unread_count : 0,
        activeConversationCount: conversations.status === 'fulfilled' ? conversations.value.length : 0,
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
