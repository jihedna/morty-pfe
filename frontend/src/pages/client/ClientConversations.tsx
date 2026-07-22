import { useState, useEffect } from 'react'
import AppLayout from '../../components/layout/AppLayout'
import { conversationsApi } from '../../lib/conversationsApi'
import { ConversationResponse } from '../../types/conversation'
import { PageHeader, LoadingState, ErrorState, EmptyState } from '../../components/ui/shared'
import Input from '../../components/ui/Input'
import Button from '../../components/ui/Button'
import ConversationListItem from '../../components/client/ConversationListItem'
import ConfirmDialog from '../../components/common/ConfirmDialog'

export default function ClientConversations() {
  const [conversations, setConversations] = useState<ConversationResponse[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [conversationToDelete, setConversationToDelete] = useState<ConversationResponse | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const loadConversations = async () => {
    try {
      setIsLoading(true)
      setError(null)
      const data = await conversationsApi.getMyConversations(true)
      setConversations(data.sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()))
    } catch {
      setError('Failed to load conversations')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => { loadConversations() }, [])

  const handleDelete = async () => {
    if (!conversationToDelete || deletingId) return
    const conversationId = conversationToDelete.id
    try {
      setDeletingId(conversationId)
      setError(null)
      await conversationsApi.deleteConversation(conversationId)
      setConversations(current => current.filter(conversation => conversation.id !== conversationId))
      setConversationToDelete(null)
    } catch {
      setError('Failed to delete conversation')
    } finally {
      setDeletingId(null)
    }
  }

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
              <ConversationListItem
                key={conv.id}
                conversation={conv}
                onDelete={setConversationToDelete}
                isDeleting={deletingId === conv.id}
              />
            ))}
          </div>
        )}
      </div>

      <ConfirmDialog
        isOpen={!!conversationToDelete}
        title="Delete Conversation"
        message="Are you sure you want to delete this conversation? It will be removed from your messages and you will no longer be able to send messages in it."
        confirmLabel="Delete"
        cancelLabel="Cancel"
        onConfirm={handleDelete}
        onCancel={() => setConversationToDelete(null)}
        isDestructive
      />
    </AppLayout>
  )
}
