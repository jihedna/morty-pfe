import { useCallback, useEffect, useRef, useState } from 'react'
import { agentAppointmentsApi, AppointmentResponse } from '../lib/agentAppointmentsApi'
import { agentConversationsApi, ConversationResponse } from '../lib/agentConversationsApi'
import { agentLeadsApi, AgentLeadFilters, AgentLeadResponse } from '../lib/agentLeadsApi'
import { agentPropertiesApi, PropertyResponse } from '../lib/agentPropertiesApi'
import { notificationsApi } from '../lib/notificationsApi'
import { extractApiError } from '../utils/format'

export interface AgentDashboardData {
  properties: PropertyResponse[]
  leads: AgentLeadResponse[]
  leadTotal: number
  appointments: AppointmentResponse[]
  conversations: ConversationResponse[]
  unreadNotifications: number
  unreadMessages: number
}

interface UseAgentDashboardResult {
  data: AgentDashboardData | null
  isLoading: boolean
  error: string | null
  partialError: string | null
  refetch: () => Promise<void>
}

export function useAgentDashboard(leadFilters: AgentLeadFilters = {}): UseAgentDashboardResult {
  const [data, setData] = useState<AgentDashboardData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [partialError, setPartialError] = useState<string | null>(null)
  const requestId = useRef(0)

  const refetch = useCallback(async () => {
    const currentRequest = ++requestId.current
    setIsLoading(true)
    setError(null)
    setPartialError(null)

    try {
      const results = await Promise.allSettled([
        agentPropertiesApi.listMyProperties(undefined, 0, 1000),
        agentLeadsApi.getLeads({ ...leadFilters, skip: 0, limit: 100 }),
        agentAppointmentsApi.getAgentAppointments(undefined, undefined, undefined, undefined, 0, 100),
        agentConversationsApi.getMyConversations(true),
        notificationsApi.getUnreadCount(),
        agentConversationsApi.getUnreadCount(),
      ])

      if (currentRequest !== requestId.current) return
      const rejectedCount = results.filter((result) => result.status === 'rejected').length
      if (rejectedCount === results.length) {
        setError('Unable to load agent dashboard data.')
        return
      }
      if (rejectedCount > 0) setPartialError('Some dashboard data is temporarily unavailable.')

      const [propertiesResult, leadsResult, appointmentsResult, conversationsResult, notificationsResult, messagesResult] = results
      const properties = propertiesResult.status === 'fulfilled' && Array.isArray(propertiesResult.value) ? propertiesResult.value : []
      const leadsResponse = leadsResult.status === 'fulfilled' && leadsResult.value ? leadsResult.value : { leads: [], total: 0 }
      const appointments = appointmentsResult.status === 'fulfilled' && Array.isArray(appointmentsResult.value) ? appointmentsResult.value : []
      const conversations = conversationsResult.status === 'fulfilled' && Array.isArray(conversationsResult.value) ? conversationsResult.value : []
      const unreadNotifications = notificationsResult.status === 'fulfilled' ? notificationsResult.value?.unread_count ?? 0 : 0
      const unreadMessages = messagesResult.status === 'fulfilled' ? messagesResult.value?.unread_count ?? 0 : 0

      setData({
        properties,
        leads: leadsResponse.leads,
        leadTotal: leadsResponse.total,
        appointments: appointments
          .filter((appointment) => new Date(appointment.scheduled_start).getTime() >= Date.now() && !['completed', 'cancelled', 'no_show'].includes(appointment.status))
          .sort((a, b) => new Date(a.scheduled_start).getTime() - new Date(b.scheduled_start).getTime()),
        conversations: [...conversations].sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()),
        unreadNotifications,
        unreadMessages,
      })
    } catch (err) {
      if (currentRequest === requestId.current) setError(extractApiError(err) || 'Failed to load dashboard data')
    } finally {
      if (currentRequest === requestId.current) setIsLoading(false)
    }
  }, [leadFilters])

  useEffect(() => {
    void refetch()
    return () => {
      requestId.current += 1
    }
  }, [refetch])

  return { data, isLoading, error, partialError, refetch }
}
