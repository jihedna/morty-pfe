import React, { useState, useEffect, useRef, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import AppLayout from '../../components/layout/AppLayout'
import { agentConversationsApi, ConversationWithMessages, MessageResponse } from '../../lib/agentConversationsApi'
import { extractApiError } from '../../utils/format'

export default function AgentConversationDetail() {
  const { conversationId } = useParams<{ conversationId: string }>()
  const navigate = useNavigate()
  const [conversation, setConversation] = useState<ConversationWithMessages | null>(null)
  const [messages, setMessages] = useState<MessageResponse[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [isSending, setIsSending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const loadConversation = useCallback(async () => {
    if (!conversationId) return

    setIsLoading(true)
    setError(null)

    try {
      const data = await agentConversationsApi.getConversation(conversationId)
      setConversation(data)
      setMessages(data.messages || [])
      
      // Mark as read when loaded
      await agentConversationsApi.markConversationRead(conversationId)
    } catch (err) {
      const errorMessage = extractApiError(err)
      if (errorMessage?.includes('403')) {
        setError('You do not have permission to access this conversation')
      } else if (errorMessage?.includes('404')) {
        setError('Conversation not found')
      } else {
        setError(errorMessage || 'Failed to load conversation')
      }
    } finally {
      setIsLoading(false)
    }
  }, [conversationId])

  useEffect(() => {
    loadConversation()
  }, [loadConversation])

  // Poll for new messages every 10 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      loadConversation()
    }, 10000)

    return () => clearInterval(interval)
  }, [loadConversation])

  useEffect(() => {
    if (messagesEndRef.current?.scrollIntoView) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }, [messages])

  const handleSendMessage = async () => {
    if (!conversationId || !newMessage.trim() || isSending) return

    const messageContent = newMessage.trim()
    setIsSending(true)
    setError(null)

    try {
      const message = await agentConversationsApi.createMessage(conversationId, {
        content: messageContent,
      })
      setMessages([...messages, message])
      setNewMessage('')
    } catch (err) {
      const errorMessage = extractApiError(err)
      // Preserve typed content on failure
      setError(errorMessage || 'Failed to send message')
    } finally {
      setIsSending(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  if (isLoading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center py-12" aria-live="polite" aria-busy="true">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" aria-hidden="true"></div>
          <span className="sr-only">Loading conversation...</span>
        </div>
      </AppLayout>
    )
  }

  if (error && !conversation) {
    return (
      <AppLayout>
        <div className="max-w-md mx-auto mt-8">
          <div className="bg-white rounded-lg shadow-md p-8 text-center">
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Error</h2>
            <p className="text-gray-600 mb-4">{error}</p>
            <button
              onClick={() => navigate('/agent/conversations')}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              Back to Conversations
            </button>
          </div>
        </div>
      </AppLayout>
    )
  }

  return (
    <AppLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        <div>
          <button
            onClick={() => navigate('/agent/conversations')}
            className="text-blue-600 hover:text-blue-700 mb-2 inline-block"
          >
            ← Back to Conversations
          </button>
          <h1 className="text-2xl font-bold text-gray-900">{conversation?.subject || 'Conversation'}</h1>
          <div className="mt-2 text-sm text-gray-600 space-y-1">
            <p><strong>Client ID:</strong> {conversation?.client_id}</p>
            {conversation?.property_id && (
              <p><strong>Property ID:</strong> {conversation.property_id}</p>
            )}
            {conversation?.search_request_id && (
              <p><strong>Search Request ID:</strong> {conversation.search_request_id}</p>
            )}
            <p><strong>Status:</strong> {conversation?.is_active ? 'Active' : 'Inactive'}</p>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          {/* Messages */}
          <div className="mb-6 max-h-96 overflow-y-auto">
            {messages.length === 0 ? (
              <p className="text-gray-500 text-center py-8">No messages yet. Start the conversation!</p>
            ) : (
              <div className="space-y-4">
                {messages
                  .filter(m => !m.is_deleted)
                  .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
                  .map((message) => (
                    <div
                      key={message.id}
                      className={`flex ${message.sender_user_id === conversation?.agent_id ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                          message.sender_user_id === conversation?.agent_id
                            ? 'bg-blue-600 text-white'
                            : 'bg-gray-200 text-gray-900'
                        }`}
                      >
                        <p>{message.content}</p>
                        <p className={`text-xs mt-1 ${message.sender_user_id === conversation?.agent_id ? 'text-blue-100' : 'text-gray-500'}`}>
                          {new Date(message.created_at).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  ))}
                <div ref={messagesEndRef} />
              </div>
            )}
          </div>

          {/* Error message */}
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md" role="alert" aria-live="polite">
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}

          {/* Message input */}
          <div className="border-t pt-4">
            <div className="flex gap-3">
              <textarea
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                rows={3}
                placeholder="Type your message..."
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                disabled={isSending}
                id="message-input"
              />
              <div className="flex flex-col justify-end">
                <button
                  onClick={handleSendMessage}
                  disabled={!newMessage.trim() || isSending}
                  className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  type="button"
                >
                  {isSending ? 'Sending...' : 'Send'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  )
}
