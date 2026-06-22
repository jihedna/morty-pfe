// Backend Schema Mapping for Appointment Types
// Based on backend/app/schemas/property_appointment.py

export enum AppointmentStatus {
  PENDING = 'pending',
  CONFIRMED = 'confirmed',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
  NO_SHOW = 'no_show',
}

export interface UserSummary {
  id: string
  first_name: string
  last_name: string
  email: string
}

export interface AgentSummary {
  id: string
  office: string
  phone: string
  user: UserSummary
}

export interface PropertySummary {
  id: string
  reference_code: string
  title: string
  status: string
}

export interface AppointmentCreate {
  property_id: string
  agent_id: string
  conversation_id?: string
  scheduled_start: string // ISO datetime
  scheduled_end: string // ISO datetime
  client_notes?: string
}

export interface AppointmentUpdate {
  client_notes?: string
  agent_notes?: string
}

export interface AppointmentStatusUpdate {
  status: AppointmentStatus
  cancellation_reason?: string
}

export interface AppointmentReschedule {
  scheduled_start: string // ISO datetime
  scheduled_end: string // ISO datetime
}

export interface AppointmentResponse {
  id: string
  client: UserSummary
  agent: AgentSummary
  property: PropertySummary
  conversation_id: string | null
  scheduled_start: string
  scheduled_end: string
  status: string
  client_notes: string | null
  agent_notes: string | null
  cancellation_reason: string | null
  created_at: string
  updated_at: string
}
