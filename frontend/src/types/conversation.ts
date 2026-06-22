// Backend Schema Mapping for Conversation Types
// Based on backend/app/schemas/messaging.py

export interface ConversationCreate {
  subject: string
  property_id?: string
  search_request_id?: string
  agent_id: string
}

export interface ConversationUpdate {
  subject?: string
  is_active?: boolean
}

export interface ConversationResponse {
  id: string
  client_id: string
  agent_id: string
  subject: string
  property_id: string | null
  search_request_id: string | null
  is_active: boolean
  client_last_read_at: string | null
  agent_last_read_at: string | null
  created_at: string
  updated_at: string
}

export interface MessageCreate {
  content: string
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

export interface ConversationWithMessages extends ConversationResponse {
  messages: MessageResponse[]
}

export interface UnreadCountResponse {
  unread_count: number
}
