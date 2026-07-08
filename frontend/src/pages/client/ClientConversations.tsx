import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import AppLayout from '../../components/layout/AppLayout'
import { conversationsApi } from '../../lib/conversationsApi'
import { ConversationResponse } from '../../types/conversation'

export default function ClientConversations() {
  const [conversations, setConversations] = useState<ConversationResponse[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadConversations = async () => {
    try {
      setIsLoading(true)
      setError(null)
      const data = await conversationsApi.getMyConversations()
      setConversations(data)
    } catch (err) {
      setError('Failed to load conversations')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadConversations()
  }, [])

  return (
    <AppLayout>
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">Messages</h1>

        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : error ? (
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-red-800 mb-2">Error</h3>
            <p className="text-red-600">{error}</p>
            <button
              onClick={loadConversations}
              className="mt-4 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
            >
              Retry
            </button>
          </div>
        ) : conversations.length === 0 ? (
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-2">No Conversations</h2>
            <p className="text-gray-600 mb-4">
              Start a conversation with an agent to discuss properties.
            </p>
            <Link
              to="/properties"
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              Browse Properties
            </Link>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Subject
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Agent
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Property
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Last Updated
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {conversations.map((conversation) => (
                  <tr key={conversation.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {conversation.subject || 'No subject'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {conversation.agent_id}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {conversation.property_id ? (
                        <Link
                          to={`/properties/${conversation.property_id}`}
                          className="text-blue-600 hover:text-blue-800"
                        >
                          View Property
                        </Link>
                      ) : (
                        'N/A'
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs rounded ${
                        conversation.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                      }`}>
                        {conversation.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(conversation.updated_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <Link
                        to={`/client/conversations/${conversation.id}`}
                        className="text-blue-600 hover:text-blue-800"
                      >
                        View
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </AppLayout>
  )
}
