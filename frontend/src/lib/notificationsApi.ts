import { apiClient } from './apiClient'
import {
  NotificationListResponse,
  UnreadCountResponse,
  MarkAllReadResponse,
} from '../types/notification'

export const notificationsApi = {
  async getMyNotifications(params?: {
    skip?: number
    limit?: number
    is_read?: boolean
    notification_type?: string
    date_from?: string
    date_to?: string
  }): Promise<NotificationListResponse> {
    const filteredParams = Object.fromEntries(
      Object.entries(params || {}).filter(([, value]) => value !== undefined && value !== null && value !== '')
    ) as Record<string, string | number | boolean>

    const response = await apiClient.get<NotificationListResponse>('/api/v1/notifications/me', filteredParams)
    return response
  },

  async getUnreadCount(): Promise<UnreadCountResponse> {
    const response = await apiClient.get<UnreadCountResponse>('/api/v1/notifications/unread-count')
    return response
  },

  async markAllAsRead(): Promise<MarkAllReadResponse> {
    const response = await apiClient.patch<MarkAllReadResponse>('/api/v1/notifications/read-all')
    return response
  },

  async markNotificationAsRead(notificationId: string): Promise<NotificationListResponse> {
    const response = await apiClient.patch<NotificationListResponse>(
      `/api/v1/notifications/${notificationId}/read`
    )
    return response
  },

  async deleteNotification(notificationId: string): Promise<void> {
    await apiClient.delete(`/api/v1/notifications/${notificationId}`)
  },
}
