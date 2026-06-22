import { apiClient } from './apiClient'

export interface AppointmentResponse {
  id: string
  client: {
    id: string
    first_name: string
    last_name: string
    email: string
  }
  agent: {
    id: string
    office: string
    phone: string
    user: {
      id: string
      first_name: string
      last_name: string
      email: string
    }
  }
  property: {
    id: string
    reference_code: string
    title: string
    status: string
  }
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

export interface AppointmentStatusUpdate {
  status: string
  cancellation_reason?: string
}

export interface AppointmentReschedule {
  scheduled_start: string
  scheduled_end: string
}

export const agentAppointmentsApi = {
  getAgentAppointments: async (
    status?: string,
    propertyId?: string,
    dateFrom?: string,
    dateTo?: string,
    skip: number = 0,
    limit: number = 20
  ): Promise<AppointmentResponse[]> => {
    const params: Record<string, string | number> = { skip, limit }
    if (status) params.status = status
    if (propertyId) params.property_id = propertyId
    if (dateFrom) params.date_from = dateFrom
    if (dateTo) params.date_to = dateTo
    const response = await apiClient.get<AppointmentResponse[]>('/api/property-appointments/agent/me', params)
    return response
  },

  updateAppointmentStatus: async (appointmentId: string, data: AppointmentStatusUpdate): Promise<AppointmentResponse> => {
    const response = await apiClient.patch<AppointmentResponse>(`/api/property-appointments/${appointmentId}/status`, data)
    return response
  },

  rescheduleAppointment: async (appointmentId: string, data: AppointmentReschedule): Promise<AppointmentResponse> => {
    const response = await apiClient.patch<AppointmentResponse>(`/api/property-appointments/${appointmentId}/reschedule`, data)
    return response
  },
}
