import { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import AppLayout from '../../components/layout/AppLayout'
import { adminConversationsApi, ConversationWithMessages } from '../../lib/adminConversationsApi'
import { extractApiError } from '../../utils/format'

export default function AdminConversationDetail() {
  const { conversationId } = useParams<{ conversationId: string }>()
  const navigate = useNavigate()
  const [conversation, setConversation] = useState<ConversationWithMessages | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadConversation = useCallback(async () => {
    if (!conversationId) return

    setIsLoading(true)
    setError(null)

    try {
      const data = await adminConversationsApi.getConversation(conversationId)
      setConversation(data)
    } catch (err) {
      const errorMessage = extractApiError(err)
      setError(errorMessage || 'Failed to load conversation')
      if (errorMessage?.includes('404')) {
        setError('Conversation not found')
      }
    } finally {
      setIsLoading(false)
    }
  }, [conversationId])

  useEffect(() => {
    loadConversation()
  }, [loadConversation])

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

  if (error) {
    return (
      <AppLayout>
        <div className="space-y-6">
          <button
            onClick={() => navigate('/admin/conversations')}
            className="text-blue-600 hover:text-blue-800 focus:outline-none focus:underline"
          >
            ← Back to conversations
          </button>
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded" role="alert" aria-live="polite">
            {error}
          </div>
        </div>
      </AppLayout>
    )
  }

  if (!conversation) {
    return (
      <AppLayout>
        <div className="text-center py-12 text-gray-500">
          Conversation not found
        </div>
      </AppLayout>
    )
  }

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <button
            onClick={() => navigate('/admin/conversations')}
            className="text-blue-600 hover:text-blue-800 focus:outline-none focus:underline"
          >
            ← Back to conversations
          </button>
          <div className="text-sm text-gray-600">
            Read-only view (managers cannot send messages)
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h1 className="text-2xl font-bold mb-4">{conversation.subject || '(No subject)'}</h1>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div>
              <h3 className="text-sm font-medium text-gray-600">Client ID</h3>
              <p className="text-gray-900">{conversation.client_id}</p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-600">Agent ID</h3>
              <p className="text-gray-900">{conversation.agent_id}</p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-600">Status</h3>
              <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                conversation.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
              }`}>
                {conversation.is_active ? 'Active' : 'Inactive'}
              </span>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-600">Property ID</h3>
              <p className="text-gray-900">{conversation.property_id || 'N/A'}</p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-600">Created</h3>
              <p className="text-gray-900">{new Date(conversation.created_at).toLocaleString()}</p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-600">Last Updated</h3>
              <p className="text-gray-900">{new Date(conversation.updated_at).toLocaleString()}</p>
            </div>
          </div>

          <div className="border-t pt-6">
            <h2 className="text-lg font-semibold mb-4">Messages</h2>
            <div className="space-y-4">
              {conversation.messages.length === 0 ? (
                <p className="text-gray-500">No messages in this conversation</p>
              ) : (
                conversation.messages.map((message) => (
                  <div
                    key={message.id}
                    className={`p-4 rounded-lg ${
                      message.sender_user_id === conversation.client_id
                        ? 'bg-blue-50 ml-8'
                        : 'bg-gray-50 mr-8'
                    }`}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <span className="text-sm font-medium text-gray-900">
                        {message.sender_user_id === conversation.client_id ? 'Client' : 'Agent'}
                      </span>
                      <span className="text-xs text-gray-500">
                        {new Date(message.created_at).toLocaleString()}
                      </span>
                    </div>
                    <p className="text-gray-900">{message.content}</p>
                    {message.is_deleted && (
                      <p className="text-xs text-gray-500 mt-1 italic">(Message deleted)</p>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  )
}
