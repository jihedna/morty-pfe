import { apiClient } from './apiClient'

export interface SuggestedAction {
  label: string
  route: string
}

export interface ChatResponse {
  reply: string
  source: string
  confidence: 'high' | 'medium' | 'low'
  suggested_actions: SuggestedAction[]
}

export interface ChatContext {
  current_route?: string
  role?: string
}

export const aiChatApi = {
  sendMessage: (message: string, context?: ChatContext): Promise<ChatResponse> =>
    apiClient.post('/ai/chat', { message, context }),
}
