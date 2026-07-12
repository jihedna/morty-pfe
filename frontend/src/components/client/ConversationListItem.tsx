import { Link } from 'react-router-dom'
import { ConversationResponse } from '../../types/conversation'

interface ConversationListItemProps {
  conversation: ConversationResponse
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

export default function ConversationListItem({ conversation }: ConversationListItemProps) {
  const initials = (conversation.subject || 'C').charAt(0).toUpperCase()

  return (
    <Link
      to={`/client/conversations/${conversation.id}`}
      className="flex items-start gap-4 p-4 rounded-xl border border-gray-100 bg-white shadow-sm hover:shadow-card hover:border-primary-100 transition-all group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2"
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
          {conversation.property_id ? 'Linked to a property' : 'General inquiry'}
        </p>
      </div>
    </Link>
  )
}
