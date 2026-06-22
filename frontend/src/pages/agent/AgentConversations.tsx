import { useState, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'
import AppLayout from '../../components/layout/AppLayout'
import { agentConversationsApi, ConversationResponse } from '../../lib/agentConversationsApi'
import { extractApiError } from '../../utils/format'

export default function AgentConversations() {
  const [conversations, setConversations] = useState<ConversationResponse[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isActiveFilter, setIsActiveFilter] = useState<boolean | undefined>(undefined)

  const loadConversations = useCallback(async () => {
    setIsLoading(true)
    setError(null)

    try {
      const data = await agentConversationsApi.getMyConversations(isActiveFilter)
      setConversations(data)
    } catch (err) {
      const errorMessage = extractApiError(err)
      setError(errorMessage || 'Failed to load conversations')
    } finally {
      setIsLoading(false)
    }
  }, [isActiveFilter])

  useEffect(() => {
    loadConversations()
  }, [loadConversations])

  const handleFilterChange = (value: string) => {
    if (value === 'all') {
      setIsActiveFilter(undefined)
    } else if (value === 'active') {
      setIsActiveFilter(true)
    } else {
      setIsActiveFilter(false)
    }
  }

  const handleMarkAsRead = async (conversationId: string) => {
    try {
      await agentConversationsApi.markConversationRead(conversationId)
      await loadConversations()
    } catch (err) {
      const errorMessage = extractApiError(err)
      setError(errorMessage || 'Failed to mark conversation as read')
    }
  }

  return (
    <AppLayout>
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">Conversations</h1>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded" role="alert" aria-live="polite">
            {error}
          </div>
        )}

        <div className="bg-white rounded-lg shadow p-6 space-y-4">
          <div className="flex flex-wrap gap-4">
            <div>
              <label htmlFor="status-filter" className="block text-sm font-medium text-gray-700 mb-1">
                Status
              </label>
              <select
                id="status-filter"
                value={isActiveFilter === undefined ? 'all' : isActiveFilter ? 'active' : 'inactive'}
                onChange={(e) => handleFilterChange(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center py-12" aria-live="polite" aria-busy="true">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" aria-hidden="true"></div>
              <span className="sr-only">Loading conversations...</span>
            </div>
          ) : conversations.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              No conversations found
            </div>
          ) : (
            <div className="space-y-4">
              {conversations.map((conversation) => (
                <div
                  key={conversation.id}
                  className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-900">{conversation.subject}</h3>
                      {conversation.property_id && (
                        <p className="text-sm text-gray-500">Property ID: {conversation.property_id}</p>
                      )}
                      <p className="text-sm text-gray-500">
                        Last updated: {new Date(conversation.updated_at).toLocaleString()}
                      </p>
                      <div className="mt-2">
                        <span
                          className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            conversation.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                          }`}
                        >
                          {conversation.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Link
                        to={`/agent/conversations/${conversation.id}`}
                        className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                      >
                        Open
                      </Link>
                      <button
                        onClick={() => handleMarkAsRead(conversation.id)}
                        className="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
                      >
                        Mark Read
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  )
}
