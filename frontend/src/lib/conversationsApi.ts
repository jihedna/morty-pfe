import { apiClient } from './apiClient'
import {
  ConversationCreate,
  ConversationResponse,
  ConversationUpdate,
  MessageCreate,
  MessageResponse,
  ConversationWithMessages,
  UnreadCountResponse,
} from '../types/conversation'

export const conversationsApi = {
  async createConversation(data: ConversationCreate): Promise<ConversationResponse> {
    const response = await apiClient.post<ConversationResponse>('/conversations', data)
    return response
  },

  async getMyConversations(isActive?: boolean): Promise<ConversationResponse[]> {
    const params = isActive !== undefined ? { is_active: isActive } : undefined
    const response = await apiClient.get<ConversationResponse[]>('/conversations/me', params || {})
    return response
  },

  async getConversation(conversationId: string): Promise<ConversationWithMessages> {
    const response = await apiClient.get<ConversationWithMessages>(`/conversations/${conversationId}`)
    return response
  },

  async updateConversation(conversationId: string, data: ConversationUpdate): Promise<ConversationResponse> {
    const response = await apiClient.patch<ConversationResponse>(`/conversations/${conversationId}`, data)
    return response
  },

  async deleteConversation(conversationId: string): Promise<void> {
    await apiClient.delete(`/conversations/${conversationId}`)
  },

  async createMessage(conversationId: string, data: MessageCreate): Promise<MessageResponse> {
    const response = await apiClient.post<MessageResponse>(
      `/conversations/${conversationId}/messages`,
      data
    )
    return response
  },

  async getMessages(conversationId: string): Promise<MessageResponse[]> {
    const response = await apiClient.get<MessageResponse[]>(
      `/conversations/${conversationId}/messages`
    )
    return response
  },

  async deleteMessage(conversationId: string, messageId: string): Promise<void> {
    await apiClient.delete(`/conversations/${conversationId}/messages/${messageId}`)
  },

  async markConversationRead(conversationId: string): Promise<ConversationResponse> {
    const response = await apiClient.patch<ConversationResponse>(
      `/conversations/${conversationId}/read`
    )
    return response
  },

  async getUnreadCount(): Promise<UnreadCountResponse> {
    const response = await apiClient.get<UnreadCountResponse>('/conversations/unread-count')
    return response
  },
}
