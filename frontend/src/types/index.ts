// User types
export type UserRole = 'client' | 'agent' | 'manager'

export interface User {
  id: string
  email: string
  first_name: string
  last_name: string
  role: UserRole
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface UserCreate {
  email: string
  password_hash: string
  first_name: string
  last_name: string
  role: UserRole
  is_active: boolean
}

export interface LoginRequest {
  email: string
  password: string
}

export interface LoginResponse {
  access_token: string
  token_type: string
  user: User
}

// Agent types
export interface Agent {
  id: string
  user_id: string
  office: string
  phone: string
  biography: string | null
  years_experience: number
  minimum_budget: number
  maximum_budget: number
  availability_status: 'available' | 'busy' | 'unavailable'
  active_lead_count: number
  success_rate: number
  closed_deals: number
  languages: string | null
  created_at: string
  updated_at: string
}

// Property types
export type PropertyType = 'apartment' | 'villa' | 'house' | 'land' | 'commercial'
export type ListingType = 'sale' | 'rent'
export type PropertyStatus = 'draft' | 'available' | 'reserved' | 'sold' | 'rented' | 'archived'
export type Currency = 'TND' | 'USD' | 'EUR'

export interface Property {
  id: string
  agent_id: string
  title: string
  description: string | null
  property_type: PropertyType
  listing_type: ListingType
  status: PropertyStatus
  price: number
  currency: Currency
  area_sqm: number
  land_area_sqm: number | null
  rooms: number
  bedrooms: number
  bathrooms: number
  floor_number: number
  total_floors: number
  construction_year: number | null
  is_furnished: boolean
  address_line: string | null
  city: string | null
  district: string | null
  governorate: string | null
  postal_code: string | null
  latitude: number | null
  longitude: number | null
  reference_code: string | null
  is_featured: boolean
  created_at: string
  updated_at: string
}

export interface PropertyImage {
  id: string
  property_id: string
  image_url: string
  alt_text: string | null
  position: number
  is_primary: boolean
  created_at: string
  updated_at: string
}

export interface PropertyFeature {
  id: string
  property_id: string
  feature: string
  created_at: string
  updated_at: string
}

// Client search request types
export interface ClientSearchRequest {
  id: string
  user_id: string
  filters: Record<string, unknown>
  is_active: boolean
  matched_agent_id: string | null
  matched_at: string | null
  created_at: string
  updated_at: string
}

// Conversation types
export interface Conversation {
  id: string
  client_id: string
  agent_id: string
  property_id: string | null
  created_at: string
  updated_at: string
}

// Message types
export interface Message {
  id: string
  conversation_id: string
  sender_id: string
  content: string
  is_read: boolean
  created_at: string
  updated_at: string
}

// Property appointment types
export type AppointmentStatus = 'requested' | 'confirmed' | 'rescheduled' | 'cancelled' | 'completed' | 'no_show'

export interface PropertyAppointment {
  id: string
  client_id: string
  agent_id: string
  property_id: string
  scheduled_start: string
  scheduled_end: string
  status: AppointmentStatus
  notes: string | null
  created_at: string
  updated_at: string
}

// Notification types
export type NotificationType = 'message' | 'appointment' | 'property_update' | 'system'

export interface Notification {
  id: string
  user_id: string
  type: NotificationType
  title: string
  message: string
  data: Record<string, unknown> | null
  is_read: boolean
  created_at: string
  updated_at: string
}

// Property favorite types
export interface PropertyFavorite {
  id: string
  user_id: string
  property_id: string
  created_at: string
  updated_at: string
}

// Saved search types
export interface SavedSearch {
  id: string
  user_id: string
  name: string
  filters: Record<string, unknown>
  is_active: boolean
  created_at: string
  updated_at: string
}

// Admin analytics types
export interface DashboardOverviewResponse {
  total_users: number
  total_clients: number
  total_agents: number
  total_properties: number
  available_properties: number
  sold_properties: number
  rented_properties: number
  total_appointments: number
  upcoming_appointments: number
  total_conversations: number
  total_messages: number
  total_favorites: number
  total_saved_searches: number
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
  total_messages: number
  total_notifications: number
  unread_notifications: number
  total_favorites: number
  total_saved_searches: number
  active_saved_searches: number
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

// Pagination types
export interface PaginatedResponse<T> {
  items: T[]
  total: number
  skip: number
  limit: number
}

// API validation error types
export interface FieldError {
  field: string
  message: string
}

export interface ApiValidationError {
  detail: string
  status: number
  body?: Record<string, string[]>
}
