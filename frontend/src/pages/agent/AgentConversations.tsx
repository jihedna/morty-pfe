import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import AppLayout from '../../components/layout/AppLayout'
import { agentConversationsApi, ConversationResponse } from '../../lib/agentConversationsApi'
import { extractApiError } from '../../utils/format'
import { DataTable, FilterPanel, ErrorState, PageHeader } from '../../components/ui/shared'
import Select from '../../components/ui/Select'
import Button from '../../components/ui/Button'

const statusFilterOptions = [
  { value: 'all', label: 'All' },
  { value: 'active', label: 'Active' },
  { value: 'inactive', label: 'Inactive' },
]

function activeBadge(isActive: boolean) {
  const classes = isActive ? 'bg-success-100 text-success-700 border-success-200' : 'bg-gray-100 text-gray-700 border-gray-200'
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${classes}`}>
      {isActive ? 'Active' : 'Inactive'}
    </span>
  )
}

export default function AgentConversations() {
  const [conversations, setConversations] = useState<ConversationResponse[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all')
  const navigate = useNavigate()

  const isActiveParam = statusFilter === 'all' ? undefined : statusFilter === 'active'

  const loadConversations = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      const data = await agentConversationsApi.getMyConversations(isActiveParam)
      setConversations(data.sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()))
    } catch (err) {
      setError(extractApiError(err) || 'Failed to load conversations')
    } finally {
      setIsLoading(false)
    }
  }, [isActiveParam])

  useEffect(() => { loadConversations() }, [loadConversations])

  const handleMarkAsRead = async (conversationId: string) => {
    try {
      await agentConversationsApi.markConversationRead(conversationId)
      await loadConversations()
    } catch (err) {
      setError(extractApiError(err) || 'Failed to mark conversation as read')
    }
  }

  const tableColumns = [
    { key: 'subject', header: 'Subject', render: (conv: ConversationResponse) => <span className="text-sm font-medium text-gray-900">{conv.subject || 'Conversation'}</span> },
    { key: 'propertyId', header: 'Property ID', render: (conv: ConversationResponse) => <span className="text-sm text-gray-900">{conv.property_id ? `Property ID: ${conv.property_id}` : 'Property ID: N/A'}</span> },
    { key: 'status', header: 'Status', render: (conv: ConversationResponse) => activeBadge(conv.is_active) },
    {
      key: 'actions',
      header: 'Actions',
      className: 'text-right',
      render: (conv: ConversationResponse) => (
        <div className="flex justify-end gap-2">
          {conv.agent_last_read_at === null && (
            <Button type="button" variant="primary" size="sm" ariaLabel="Mark read" onClick={() => handleMarkAsRead(conv.id)}>
              Mark as read
            </Button>
          )}
          <Button type="button" variant="ghost" size="sm" onClick={() => navigate(`/agent/conversations/${conv.id}`)}>
            View
          </Button>
        </div>
      ),
    },
  ]

  return (
    <AppLayout>
      <div className="space-y-6">
        <PageHeader title="Conversations" subtitle="View and manage your client conversations" />

        {error && (
          <ErrorState message={error} onRetry={loadConversations} />
        )}

        <FilterPanel
          title="Filters"
          hasFilters={statusFilter !== 'all'}
          onClear={() => setStatusFilter('all')}
        >
          <div className="flex flex-wrap gap-4 items-end">
            <Select
              id="status-filter"
              value={statusFilter}
              onChange={(v) => setStatusFilter(v as 'all' | 'active' | 'inactive')}
              label="Status"
              options={statusFilterOptions}
              className="w-40"
            />
          </div>
        </FilterPanel>

        <DataTable
          columns={tableColumns}
          rows={conversations}
          keyExtractor={(conv) => conv.id}
          isLoading={isLoading}
          loadingMessage="Loading conversations…"
          emptyTitle="No conversations found"
          emptyDescription="No conversations match the current filters."
        />
      </div>
    </AppLayout>
  )
}
