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

export const adminConversationsApi = {
  getAllConversations: async (params?: {
    is_active?: boolean
  }): Promise<ConversationResponse[]> => {
    const queryParams: Record<string, boolean> = {}
    if (params?.is_active !== undefined) queryParams.is_active = params.is_active

    const response = await apiClient.get<ConversationResponse[]>('/api/messaging/admin/all', queryParams)
    return response
  },

  getConversation: async (conversationId: string): Promise<ConversationWithMessages> => {
    const response = await apiClient.get<ConversationWithMessages>(`/api/messaging/${conversationId}`)
    return response
  },
}
