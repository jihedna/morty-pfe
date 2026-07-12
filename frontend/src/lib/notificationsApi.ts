import { apiClient } from './apiClient'

export interface NotificationResponse {
  id: string
  user_id: string
  notification_type: string
  title: string
  message: string
  data: Record<string, unknown> | null
  is_read: boolean
  read_at: string | null
  created_at: string
  updated_at: string
}

export interface NotificationListResponse {
  notifications: NotificationResponse[]
  total: number
  skip: number
  limit: number
}

export interface UnreadCountResponse {
  unread_count: number
}

export interface MarkAllReadResponse {
  marked_count: number
}

export const notificationsApi = {
  getMyNotifications: async (params?: {
    skip?: number
    limit?: number
    is_read?: boolean
    notification_type?: string
    date_from?: string
    date_to?: string
  }): Promise<NotificationListResponse> => {
    const filteredParams = Object.fromEntries(
      Object.entries(params || {}).filter(([, value]) => value !== undefined && value !== null && value !== '')
    ) as Record<string, string | number | boolean>

    const response = await apiClient.get<NotificationListResponse>('/notifications/me', filteredParams)
    return response
  },

  getUnreadCount: async (): Promise<UnreadCountResponse> => {
    const response = await apiClient.get<UnreadCountResponse>('/notifications/unread-count')
    return response
  },

  markAllAsRead: async (): Promise<MarkAllReadResponse> => {
    const response = await apiClient.patch<MarkAllReadResponse>('/notifications/read-all')
    return response
  },

  markNotificationAsRead: async (notificationId: string): Promise<NotificationResponse> => {
    const response = await apiClient.patch<NotificationResponse>(`/notifications/${notificationId}/read`)
    return response
  },

  deleteNotification: async (notificationId: string): Promise<void> => {
    await apiClient.delete(`/notifications/${notificationId}`)
  },
}
