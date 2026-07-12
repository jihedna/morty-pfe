import { apiClient } from './apiClient'

export interface DashboardOverviewResponse {
  total_users: number
  total_clients: number
  total_agents: number
  active_agents: number
  total_properties: number
  available_properties: number
  reserved_properties: number
  sold_properties: number
  rented_properties: number
  archived_properties: number
  total_client_search_requests: number
  active_client_search_requests: number
  total_conversations: number
  active_conversations: number
  total_messages: number
  unread_notifications: number
  total_appointments: number
  upcoming_appointments: number
  completed_appointments: number
  cancelled_appointments: number
  total_favorites: number
  active_saved_searches: number
  total_hot_leads: number
  total_warm_leads: number
  total_cold_leads: number
  average_lead_score: number | null
}

export interface LeadAnalyticsResponse {
  total_search_requests: number
  active_search_requests: number
  scored_leads: number
  unscored_leads: number
  total_hot_leads: number
  total_warm_leads: number
  total_cold_leads: number
  average_lead_score: number | null
  leads_by_property_type: Record<string, number>
  leads_by_city: Record<string, number>
  leads_by_urgency: Record<string, number>
}

export interface PropertyAnalyticsResponse {
  total_properties: number
  properties_by_status: Record<string, number>
  properties_by_type: Record<string, number>
  properties_by_listing_type: Record<string, number>
  properties_by_city: Record<string, number>
  average_sale_price: number | null
  average_rental_price: number | null
  minimum_price: number | null
  maximum_price: number | null
  featured_count: number
  created_in_period: number
  sold_or_rented_in_period: number
}

export interface AgentAnalyticsItem {
  agent_id: string
  user_id: string
  first_name: string
  last_name: string
  years_experience: number
  total_listings: number
  available_listings: number
  sold_listings: number
  rented_listings: number
  appointment_count: number
  completed_appointment_count: number
  conversation_count: number
  received_favorites: number
}

export interface AgentAnalyticsResponse {
  agents: AgentAnalyticsItem[]
  total: number
  skip: number
  limit: number
}

export interface ClientAnalyticsResponse {
  total_clients: number
  active_clients: number
  clients_with_search_requests: number
  clients_with_favorites: number
  clients_with_saved_searches: number
  clients_with_conversations: number
  clients_with_appointments: number
  average_favorites_per_client: number
  average_saved_searches_per_client: number
  average_appointments_per_client: number
}

export interface AppointmentAnalyticsResponse {
  total_appointments: number
  requested: number
  confirmed: number
  rescheduled: number
  cancelled: number
  completed: number
  no_show: number
  completion_rate: number
  cancellation_rate: number
  no_show_rate: number
  upcoming_count: number
  appointments_by_day: Record<string, number>
  appointments_by_agent: Record<string, number>
}

export interface EngagementAnalyticsResponse {
  total_conversations: number
  active_conversations: number
  total_messages: number
  average_messages_per_conversation: number
  total_notifications: number
  unread_notifications: number
  notification_read_rate: number
  total_favorites: number
  total_saved_searches: number
  saved_searches_with_notifications_enabled: number
  clients_with_engagement: number
}

export interface TimeSeriesPoint {
  period: string
  value: number
}

export interface TimeSeriesResponse {
  metric: string
  interval: string
  points: TimeSeriesPoint[]
}

export interface HeatMapPoint {
  id: string
  city: string
  district: string
  latitude: number | null
  longitude: number | null
  average_price_per_sqm: number | null
  average_rent_per_sqm: number | null
  demand_level: string
  price_trend: string
  rental_yield: number | null
  transaction_count: number
  normalized_price: number
  normalized_demand: number
}

export const adminAnalyticsApi = {
  getOverview: async (): Promise<DashboardOverviewResponse> => {
    const response = await apiClient.get<DashboardOverviewResponse>('/admin/analytics/overview')
    return response
  },

  getPropertyAnalytics: async (params?: {
    date_from?: string
    date_to?: string
    agent_id?: string
    property_type?: string
    listing_type?: string
    city?: string
    district?: string
  }): Promise<PropertyAnalyticsResponse> => {
    const queryParams: Record<string, string> = {}
    if (params?.date_from) queryParams.date_from = params.date_from
    if (params?.date_to) queryParams.date_to = params.date_to
    if (params?.agent_id) queryParams.agent_id = params.agent_id
    if (params?.property_type) queryParams.property_type = params.property_type
    if (params?.listing_type) queryParams.listing_type = params.listing_type
    if (params?.city) queryParams.city = params.city
    if (params?.district) queryParams.district = params.district

    const response = await apiClient.get<PropertyAnalyticsResponse>('/admin/analytics/properties', queryParams)
    return response
  },

  getAgentAnalytics: async (params?: {
    skip?: number
    limit?: number
    active_only?: boolean
    date_from?: string
    date_to?: string
    order_by?: string
  }): Promise<AgentAnalyticsResponse> => {
    const queryParams: Record<string, string | number | boolean> = {
      skip: params?.skip ?? 0,
      limit: params?.limit ?? 20,
      order_by: params?.order_by ?? 'total_listings',
    }
    if (params?.active_only !== undefined) queryParams.active_only = params.active_only
    if (params?.date_from) queryParams.date_from = params.date_from
    if (params?.date_to) queryParams.date_to = params.date_to

    const response = await apiClient.get<AgentAnalyticsResponse>('/admin/analytics/agents', queryParams)
    return response
  },

  getClientAnalytics: async (): Promise<ClientAnalyticsResponse> => {
    const response = await apiClient.get<ClientAnalyticsResponse>('/admin/analytics/clients')
    return response
  },

  getAppointmentAnalytics: async (params?: {
    date_from?: string
    date_to?: string
    agent_id?: string
    property_id?: string
  }): Promise<AppointmentAnalyticsResponse> => {
    const queryParams: Record<string, string> = {}
    if (params?.date_from) queryParams.date_from = params.date_from
    if (params?.date_to) queryParams.date_to = params.date_to
    if (params?.agent_id) queryParams.agent_id = params.agent_id
    if (params?.property_id) queryParams.property_id = params.property_id

    const response = await apiClient.get<AppointmentAnalyticsResponse>('/admin/analytics/appointments', queryParams)
    return response
  },

  getEngagementAnalytics: async (): Promise<EngagementAnalyticsResponse> => {
    const response = await apiClient.get<EngagementAnalyticsResponse>('/admin/analytics/engagement')
    return response
  },

  getLeadAnalytics: async (): Promise<LeadAnalyticsResponse> => {
    const response = await apiClient.get<LeadAnalyticsResponse>('/admin/analytics/leads')
    return response
  },

  getHeatMap: async (): Promise<HeatMapPoint[]> => {
    const response = await apiClient.get<HeatMapPoint[]>('/admin/analytics/heat-map')
    return response
  },

  getTimeSeries: async (params: {
    metric: string
    date_from: string
    date_to: string
    interval?: string
  }): Promise<TimeSeriesResponse> => {
    const queryParams: Record<string, string> = {
      metric: params.metric,
      date_from: params.date_from,
      date_to: params.date_to,
      interval: params.interval ?? 'day',
    }

    const response = await apiClient.get<TimeSeriesResponse>('/admin/analytics/time-series', queryParams)
    return response
  },
}
