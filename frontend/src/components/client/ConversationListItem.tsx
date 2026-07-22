import { Link } from 'react-router-dom'
import { ConversationResponse } from '../../types/conversation'

interface ConversationListItemProps {
  conversation: ConversationResponse
  basePath?: string
  onDelete?: (conversation: ConversationResponse) => void
  isDeleting?: boolean
}

function relativeTime(iso: string) {
  const diff = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'Just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  const days = Math.floor(hrs / 24)
  if (days < 7) return `${days}d ago`
  return new Date(iso).toLocaleDateString([], { month: 'short', day: 'numeric' })
}

export default function ConversationListItem({ conversation, basePath = '/client/conversations', onDelete, isDeleting = false }: ConversationListItemProps) {
  const initials = (conversation.subject || 'C').charAt(0).toUpperCase()

  return (
    <div className="relative rounded-xl border border-gray-100 bg-white shadow-sm hover:shadow-card hover:border-primary-100 transition-all group">
      <Link
        to={`${basePath}/${conversation.id}`}
        className={`flex items-start gap-4 p-4 ${onDelete ? 'pr-14' : ''} focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2 rounded-xl`}
      >
        <div className="w-12 h-12 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 font-bold text-lg flex-shrink-0">
          {initials}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <h3 className="text-sm font-semibold text-gray-900 truncate">
              {conversation.subject || 'Conversation'}
            </h3>
            <span className="text-xs text-gray-400 flex-shrink-0">{relativeTime(conversation.updated_at)}</span>
          </div>
          <p className="text-sm text-gray-500 mt-1 truncate">
            {conversation.property_id
              ? 'Linked to a property'
              : conversation.search_request_id
                ? 'Linked to a search request'
                : 'General inquiry'}
          </p>
        </div>
      </Link>
      {onDelete && (
        <button
          type="button"
          onClick={() => onDelete(conversation)}
          disabled={isDeleting}
          aria-label={`Delete conversation ${conversation.subject || 'Conversation'}`}
          className="absolute right-3 top-1/2 -translate-y-1/2 p-2 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 disabled:opacity-50 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        </button>
      )}
    </div>
  )
}
