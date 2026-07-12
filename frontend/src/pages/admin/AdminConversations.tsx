import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import AppLayout from '../../components/layout/AppLayout'
import { adminConversationsApi, ConversationResponse } from '../../lib/adminConversationsApi'
import { extractApiError } from '../../utils/format'
import { DataTable, FilterPanel, PageHeader, LoadingState, ErrorState } from '../../components/ui/shared'
import Select from '../../components/ui/Select'
import Button from '../../components/ui/Button'

const statusOptions = [
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

export default function AdminConversations() {
  const navigate = useNavigate()
  const [conversations, setConversations] = useState<ConversationResponse[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filterActive, setFilterActive] = useState<boolean | undefined>(undefined)

  const loadConversations = useCallback(async () => {
    setIsLoading(true)
    setError(null)

    try {
      const data = await adminConversationsApi.getAllConversations({
        is_active: filterActive,
      })
      setConversations(data)
    } catch (err) {
      const errorMessage = extractApiError(err)
      setError(errorMessage || 'Failed to load conversations')
    } finally {
      setIsLoading(false)
    }
  }, [filterActive])

  useEffect(() => {
    loadConversations()
  }, [loadConversations])

  const handleFilterChange = (value: string) => {
    if (value === 'all') {
      setFilterActive(undefined)
    } else {
      setFilterActive(value === 'active')
    }
  }

  const filterValue = filterActive === undefined ? 'all' : filterActive ? 'active' : 'inactive'

  const tableColumns = [
    { key: 'subject', header: 'Subject', render: (conversation: ConversationResponse) => <span className="text-sm font-medium text-gray-900">{conversation.subject || '(No subject)'}</span> },
    { key: 'client', header: 'Client', render: (conversation: ConversationResponse) => <span className="text-sm text-gray-900">{conversation.client_id}</span> },
    { key: 'agent', header: 'Agent', render: (conversation: ConversationResponse) => <span className="text-sm text-gray-900">{conversation.agent_id}</span> },
    { key: 'status', header: 'Status', render: (conversation: ConversationResponse) => activeBadge(conversation.is_active) },
    { key: 'created', header: 'Created', render: (conversation: ConversationResponse) => <span className="text-sm text-gray-900">{new Date(conversation.created_at).toLocaleString()}</span> },
    {
      key: 'actions',
      header: 'Actions',
      render: (conversation: ConversationResponse) => (
        <Button type="button" variant="ghost" size="sm" onClick={() => navigate(`/admin/conversations/${conversation.id}`)}>
          View
        </Button>
      ),
    },
  ]

  if (isLoading && conversations.length === 0) {
    return (
      <AppLayout>
        <LoadingState message='Loading conversations…' />
      </AppLayout>
    )
  }

  return (
    <AppLayout>
      <div className="space-y-6">
        <PageHeader
          title='Conversation Administration'
          subtitle={`${conversations.length} conversations`}
          action={
            <Button type='button' onClick={() => loadConversations()} size='sm'>
              Refresh
            </Button>
          }
        />

        {error && (
          <ErrorState message={error} onRetry={loadConversations} />
        )}

        <FilterPanel
          title="Filters"
          hasFilters={filterActive !== undefined}
          onClear={() => handleFilterChange('all')}
        >
          <div className="flex flex-wrap gap-4 items-end">
            <Select
              id="active-filter"
              value={filterValue}
              onChange={handleFilterChange}
              label="Status"
              options={statusOptions}
              className="w-40"
            />
          </div>
        </FilterPanel>

        <DataTable
          columns={tableColumns}
          rows={conversations}
          keyExtractor={(conversation) => conversation.id}
          isLoading={isLoading}
          emptyTitle="No conversations found"
          emptyDescription="No conversations found matching the current filters"
        />
      </div>
    </AppLayout>
  )
}
