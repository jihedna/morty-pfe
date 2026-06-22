import { apiClient } from './apiClient'
import {
  AppointmentCreate,
  AppointmentResponse,
  AppointmentUpdate,
  AppointmentStatusUpdate,
} from '../types/appointment'

export const appointmentsApi = {
  async createAppointment(data: AppointmentCreate): Promise<AppointmentResponse> {
    const response = await apiClient.post<AppointmentResponse>('/api/v1/appointments', data)
    return response
  },

  async getMyAppointments(params?: {
    status?: string
    property_id?: string
    date_from?: string
    date_to?: string
    skip?: number
    limit?: number
  }): Promise<AppointmentResponse[]> {
    const filteredParams = Object.fromEntries(
      Object.entries(params || {}).filter(([, value]) => value !== undefined && value !== null && value !== '')
    ) as Record<string, string | number | boolean>

    const response = await apiClient.get<AppointmentResponse[]>('/api/v1/appointments/me', filteredParams)
    return response
  },

  async getAppointment(appointmentId: string): Promise<AppointmentResponse> {
    const response = await apiClient.get<AppointmentResponse>(`/api/v1/appointments/${appointmentId}`)
    return response
  },

  async updateAppointment(appointmentId: string, data: AppointmentUpdate): Promise<AppointmentResponse> {
    const response = await apiClient.patch<AppointmentResponse>(`/api/v1/appointments/${appointmentId}`, data)
    return response
  },

  async updateAppointmentStatus(
    appointmentId: string,
    data: AppointmentStatusUpdate
  ): Promise<AppointmentResponse> {
    const response = await apiClient.patch<AppointmentResponse>(
      `/api/v1/appointments/${appointmentId}/status`,
      data
    )
    return response
  },

  async cancelAppointment(appointmentId: string): Promise<void> {
    await apiClient.delete(`/api/v1/appointments/${appointmentId}`)
  },
}
