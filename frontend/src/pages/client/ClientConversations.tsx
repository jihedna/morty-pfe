import { useState, useEffect } from 'react'
import AppLayout from '../../components/layout/AppLayout'
import { conversationsApi } from '../../lib/conversationsApi'
import { ConversationResponse } from '../../types/conversation'
import { PageHeader, LoadingState, ErrorState, EmptyState } from '../../components/ui/shared'
import Input from '../../components/ui/Input'
import Button from '../../components/ui/Button'
import ConversationListItem from '../../components/client/ConversationListItem'

export default function ClientConversations() {
  const [conversations, setConversations] = useState<ConversationResponse[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState('')

  const loadConversations = async () => {
    try {
      setIsLoading(true)
      setError(null)
      const data = await conversationsApi.getMyConversations()
      setConversations(data.sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()))
    } catch {
      setError('Failed to load conversations')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => { loadConversations() }, [])

  const filtered = conversations.filter(c =>
    !search || c.subject?.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <AppLayout>
      <div className="max-w-2xl mx-auto space-y-6">
        <PageHeader
          title="Messages"
          subtitle={`${conversations.length} conversation${conversations.length !== 1 ? 's' : ''}`}
          action={
            <Button as="Link" to="/properties" variant="outline">
              New chat
            </Button>
          }
        />

        <Input
          id="search-conversations"
          type="text"
          placeholder="Search conversations..."
          value={search}
          onChange={v => setSearch(v)}
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
            description={search ? 'Try a different search term.' : 'Browse properties and contact an agent to get started.'}
            action={
              !search ? (
                <Button as="Link" to="/properties" size="sm">
                  Browse Properties
                </Button>
              ) : undefined
            }
          />
        ) : (
          <div className="space-y-3">
            {filtered.map((conv) => (
              <ConversationListItem key={conv.id} conversation={conv} />
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  )
}
