// Backend Schema Mapping for Notification Types
// Based on backend/app/schemas/notification.py

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
