import { apiClient } from './apiClient'

export interface ConversationResponse {
  id: string
  subject: string
  property_id: string | null
  search_request_id: string | null
  client_id: string
  agent_id: string
  is_active: boolean
  client_last_read_at: string | null
  agent_last_read_at: string | null
  created_at: string
  updated_at: string
}

export interface ConversationWithMessages extends ConversationResponse {
  messages: MessageResponse[]
}

export interface MessageResponse {
  id: string
  conversation_id: string
  sender_user_id: string
  content: string
  is_deleted: boolean
  created_at: string
  updated_at: string
}

export interface MessageCreate {
  content: string
}

export interface UnreadCountResponse {
  unread_count: number
}

export const agentConversationsApi = {
  getMyConversations: async (isActive?: boolean): Promise<ConversationResponse[]> => {
    const params: Record<string, boolean> = {}
    if (isActive !== undefined) params.is_active = isActive
    const response = await apiClient.get<ConversationResponse[]>('/api/messaging/me', params)
    return response
  },

  getConversation: async (conversationId: string): Promise<ConversationWithMessages> => {
    const response = await apiClient.get<ConversationWithMessages>(`/api/messaging/${conversationId}`)
    return response
  },

  createMessage: async (conversationId: string, data: MessageCreate): Promise<MessageResponse> => {
    const response = await apiClient.post<MessageResponse>(`/api/messaging/${conversationId}/messages`, data)
    return response
  },

  markConversationRead: async (conversationId: string): Promise<ConversationResponse> => {
    const response = await apiClient.patch<ConversationResponse>(`/api/messaging/${conversationId}/read`)
    return response
  },

  getUnreadCount: async (): Promise<UnreadCountResponse> => {
    const response = await apiClient.get<UnreadCountResponse>('/api/messaging/unread-count')
    return response
  },
}
