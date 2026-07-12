import { apiClient } from './apiClient'

export interface AppointmentResponse {
  id: string
  property_id: string
  client_id: string
  agent_id: string
  scheduled_start: string
  scheduled_end: string
  status: string
  client_notes: string | null
  agent_notes: string | null
  cancellation_reason: string | null
  created_at: string
  updated_at: string
  property: {
    id: string
    reference_code: string
    title: string
    status: string
  }
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
  conversation_id: string | null
}

export interface AppointmentStatusUpdate {
  status: string
  cancellation_reason?: string
}

export interface AppointmentReschedule {
  scheduled_start: string
  scheduled_end: string
  agent_notes?: string
}

export const adminAppointmentsApi = {
  getAllAppointments: async (params?: {
    status?: string
    property_id?: string
    agent_id?: string
    date_from?: string
    date_to?: string
    skip?: number
    limit?: number
  }): Promise<AppointmentResponse[]> => {
    const queryParams: Record<string, string | number> = {
      skip: params?.skip ?? 0,
      limit: params?.limit ?? 20,
    }
    if (params?.status) queryParams.status = params.status
    if (params?.property_id) queryParams.property_id = params.property_id
    if (params?.agent_id) queryParams.agent_id = params.agent_id
    if (params?.date_from) queryParams.date_from = params.date_from
    if (params?.date_to) queryParams.date_to = params.date_to

    const response = await apiClient.get<AppointmentResponse[]>('/appointments/admin/all', queryParams)
    return response
  },

  getAppointment: async (appointmentId: string): Promise<AppointmentResponse> => {
    const response = await apiClient.get<AppointmentResponse>(`/appointments/${appointmentId}`)
    return response
  },

  updateAppointmentStatus: async (appointmentId: string, statusData: AppointmentStatusUpdate): Promise<AppointmentResponse> => {
    const response = await apiClient.patch<AppointmentResponse>(`/appointments/${appointmentId}/status`, statusData)
    return response
  },

  rescheduleAppointment: async (appointmentId: string, rescheduleData: AppointmentReschedule): Promise<AppointmentResponse> => {
    const response = await apiClient.patch<AppointmentResponse>(`/appointments/${appointmentId}/reschedule`, rescheduleData)
    return response
  },
}
