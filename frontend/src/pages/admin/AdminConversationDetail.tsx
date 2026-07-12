import { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import AppLayout from '../../components/layout/AppLayout'
import { adminConversationsApi, ConversationWithMessages } from '../../lib/adminConversationsApi'
import { extractApiError } from '../../utils/format'
import { PageHeader, LoadingState, ErrorState, Card, SectionHeader } from '../../components/ui/shared'
import Button from '../../components/ui/Button'
import { StatusBadge } from '../../components/StatusBadge'

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
        <LoadingState message='Loading conversation…' />
      </AppLayout>
    )
  }

  return (
    <AppLayout>
      <div className='space-y-6 max-w-4xl mx-auto'>
        <PageHeader
          title={conversation ? (conversation.subject || '(No subject)') : 'Conversation details'}
          subtitle={
            conversation
              ? 'Read-only view (managers cannot send messages)'
              : 'The requested conversation could not be found'
          }
          action={
            <Button
              type='button'
              variant='secondary'
              size='sm'
              onClick={() => navigate('/admin/conversations')}
            >
              Back to conversations
            </Button>
          }
        />

        {error && (
          <ErrorState message={error} onRetry={loadConversation} />
        )}

        {conversation && (
          <div className='space-y-6'>
            <Card>
              <SectionHeader title='Conversation Details' />
              <div className='grid grid-cols-1 md:grid-cols-3 gap-6'>
                <div>
                  <p className='text-xs font-medium text-gray-500 uppercase tracking-wide'>Client</p>
                  <p className='text-sm font-medium text-gray-900 mt-1'>{conversation.client_id}</p>
                </div>
                <div>
                  <p className='text-xs font-medium text-gray-500 uppercase tracking-wide'>Agent</p>
                  <p className='text-sm font-medium text-gray-900 mt-1'>{conversation.agent_id}</p>
                </div>
                <div>
                  <p className='text-xs font-medium text-gray-500 uppercase tracking-wide'>Status</p>
                  <div className='mt-1'>
                    <StatusBadge
                      status={conversation.is_active ? 'Active' : 'Inactive'}
                      type='default'
                    />
                  </div>
                </div>
                <div>
                  <p className='text-xs font-medium text-gray-500 uppercase tracking-wide'>Property</p>
                  <p className='text-sm font-medium text-gray-900 mt-1'>
                    {conversation.property_id || 'N/A'}
                  </p>
                </div>
                <div>
                  <p className='text-xs font-medium text-gray-500 uppercase tracking-wide'>Created</p>
                  <p className='text-sm font-medium text-gray-900 mt-1'>
                    {new Date(conversation.created_at).toLocaleString()}
                  </p>
                </div>
                <div>
                  <p className='text-xs font-medium text-gray-500 uppercase tracking-wide'>Last Updated</p>
                  <p className='text-sm font-medium text-gray-900 mt-1'>
                    {new Date(conversation.updated_at).toLocaleString()}
                  </p>
                </div>
              </div>
            </Card>

            <Card>
              <SectionHeader title='Messages' />
              <div className='space-y-4'>
                {conversation.messages.length === 0 ? (
                  <p className='text-sm text-gray-500'>No messages in this conversation</p>
                ) : (
                  conversation.messages.map((message) => (
                    <div
                      key={message.id}
                      className={`p-4 rounded-xl ${
                        message.sender_user_id === conversation.client_id
                          ? 'bg-primary-50 ml-8'
                          : 'bg-gray-50 mr-8'
                      }`}
                    >
                      <div className='flex justify-between items-start mb-2'>
                        <span className='text-sm font-medium text-gray-900'>
                          {message.sender_user_id === conversation.client_id ? 'Client' : 'Agent'}
                        </span>
                        <span className='text-xs text-gray-500'>
                          {new Date(message.created_at).toLocaleString()}
                        </span>
                      </div>
                      <p className='text-sm text-gray-900'>{message.content}</p>
                      {message.is_deleted && (
                        <p className='text-xs text-gray-500 mt-1 italic'>(Message deleted)</p>
                      )}
                    </div>
                  ))
                )}
              </div>
            </Card>
          </div>
        )}
      </div>
    </AppLayout>
  )
}
