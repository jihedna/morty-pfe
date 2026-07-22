import { useEffect, useState } from 'react'
import AppLayout from '../../components/layout/AppLayout'
import ConversationListItem from '../../components/client/ConversationListItem'
import Button from '../../components/ui/Button'
import Input from '../../components/ui/Input'
import { EmptyState, ErrorState, LoadingState, PageHeader } from '../../components/ui/shared'
import { agentConversationsApi, ConversationResponse } from '../../lib/agentConversationsApi'
import { extractApiError } from '../../utils/format'

export default function AgentConversations() {
  const [conversations, setConversations] = useState<ConversationResponse[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState('')

  const loadConversations = async () => {
    setIsLoading(true)
    setError(null)
    try {
      const data = await agentConversationsApi.getMyConversations()
      setConversations(
        data.sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime())
      )
    } catch (err) {
      setError(extractApiError(err) || 'Failed to load conversations')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => { loadConversations() }, [])

  const filtered = conversations.filter(conversation =>
    !search || conversation.subject?.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <AppLayout>
      <div className="max-w-2xl mx-auto space-y-6">
        <PageHeader
          title="Messages"
          subtitle={`${conversations.length} conversation${conversations.length !== 1 ? 's' : ''}`}
          action={
            <Button as="Link" to="/agent/leads" variant="outline">
              View leads
            </Button>
          }
        />

        <Input
          id="search-agent-conversations"
          type="text"
          placeholder="Search conversations..."
          value={search}
          onChange={setSearch}
          label=""
          className="w-full"
        />

        {isLoading ? (
          <LoadingState />
        ) : error ? (
          <ErrorState message={error} onRetry={loadConversations} />
        ) : filtered.length === 0 ? (
          <EmptyState
            title={search ? 'No results' : 'No messages yet'}
            description={
              search
                ? 'Try a different search term.'
                : 'Open a lead and start a conversation with the client.'
            }
            action={
              !search ? (
                <Button as="Link" to="/agent/leads" size="sm">
                  View Leads
                </Button>
              ) : undefined
            }
          />
        ) : (
          <div className="space-y-3">
            {filtered.map(conversation => (
              <ConversationListItem
                key={conversation.id}
                conversation={conversation}
                basePath="/agent/conversations"
              />
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  )
}
