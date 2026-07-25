import { useState, useEffect, useCallback } from 'react'
import { clientSearchRequestsApi, ClientSearchRequestResponse, AgentMatchResponse } from '../lib/clientSearchRequestsApi'
import { propertyApi } from '../lib/propertyApi'
import { appointmentsApi } from '../lib/appointmentsApi'
import { notificationsApi, NotificationResponse } from '../lib/notificationsApi'
import { conversationsApi } from '../lib/conversationsApi'
import { savedSearchesApi } from '../lib/savedSearchesApi'
import { FavoritePropertySummary } from '../types/favorite'
import { AppointmentResponse } from '../types/appointment'
import { ConversationResponse } from '../types/conversation'
import { extractApiError } from '../utils/format'
import { clientDealsApi } from '../lib/clientDealsApi'

export interface ClientDashboardData {
  activeSearchRequests: number
  searchRequests: ClientSearchRequestResponse[]
  agentMatchesCount: number
  agentMatches: AgentMatchResponse[]
  favoriteCount: number
  favoriteProperties: FavoritePropertySummary[]
  savedSearchCount: number
  upcomingAppointments: number
  appointments: AppointmentResponse[]
  unreadNotificationCount: number
  notifications: NotificationResponse[]
  activeConversationCount: number
  conversations: ConversationResponse[]
  approvedDealCount: number
}

interface UseClientDashboardResult {
  data: ClientDashboardData | null
  isLoading: boolean
  error: string | null
  refetch: () => Promise<void>
}

export function useClientDashboard(): UseClientDashboardResult {
  const [data, setData] = useState<ClientDashboardData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchDashboard = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      const [
        searchRequestsResult,
        favoritesResult,
        savedSearchesResult,
        appointmentsResult,
        notificationsResult,
        unreadCountResult,
        conversationsResult,
        approvedDealsResult,
      ] = await Promise.allSettled([
        clientSearchRequestsApi.getMyRequests(true),
        propertyApi.listFavorites(0, 4),
        savedSearchesApi.getMySavedSearches(0, 1, false),
        appointmentsApi.getMyAppointments({ status: 'confirmed' }),
        notificationsApi.getMyNotifications({ limit: 5 }),
        notificationsApi.getUnreadCount(),
        conversationsApi.getMyConversations(true),
        clientDealsApi.listMyDeals('approved', 0, 1),
      ])

      const searchRequests = searchRequestsResult.status === 'fulfilled' ? searchRequestsResult.value : []
      const favorites = favoritesResult.status === 'fulfilled' ? favoritesResult.value : { favorites: [], total: 0 }
      const savedSearches = savedSearchesResult.status === 'fulfilled'
        ? savedSearchesResult.value
        : { saved_searches: [], total: 0 }
      const appointments = appointmentsResult.status === 'fulfilled' ? appointmentsResult.value : []
      const notifications = notificationsResult.status === 'fulfilled'
        ? notificationsResult.value.notifications
        : []
      const unreadCount = unreadCountResult.status === 'fulfilled' ? unreadCountResult.value.unread_count : 0
      const conversations = conversationsResult.status === 'fulfilled' ? conversationsResult.value : []
      const approvedDealCount = approvedDealsResult.status === 'fulfilled' ? approvedDealsResult.value.total : 0

      let agentMatches: AgentMatchResponse[] = []
      if (searchRequests.length > 0) {
        try {
          agentMatches = await clientSearchRequestsApi.getAgentMatches(searchRequests[0].id)
        } catch {
          agentMatches = []
        }
      }

      const favoriteProperties = favorites.favorites.map((f) => f.property)

      const recentAppointments = appointments
        .filter((a) => new Date(a.scheduled_start).getTime() >= Date.now() - 24 * 60 * 60 * 1000)
        .sort((a, b) => new Date(a.scheduled_start).getTime() - new Date(b.scheduled_start).getTime())

      const recentConversations = [...conversations]
        .sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime())
        .slice(0, 3)

      setData({
        activeSearchRequests: searchRequests.length,
        searchRequests,
        agentMatchesCount: agentMatches.length,
        agentMatches,
        favoriteCount: favorites.total,
        favoriteProperties,
        savedSearchCount: savedSearches.total,
        upcomingAppointments: appointments.length,
        appointments: recentAppointments,
        unreadNotificationCount: unreadCount,
        notifications,
        activeConversationCount: conversations.length,
        conversations: recentConversations,
        approvedDealCount,
      })
    } catch (err) {
      setError(extractApiError(err) || 'Failed to load dashboard')
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchDashboard()
  }, [fetchDashboard])

  return { data, isLoading, error, refetch: fetchDashboard }
}
