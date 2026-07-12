import { SuggestedAction } from '../../lib/aiChatApi'
import SuggestedActions from './SuggestedActions'

export interface ChatMessageData {
  id: string
  role: 'user' | 'assistant'
  text: string
  timestamp: Date
  suggested_actions?: SuggestedAction[]
  confidence?: 'high' | 'medium' | 'low'
}

interface ChatMessageProps {
  message: ChatMessageData
  onActionClick?: () => void
}

function renderMarkdown(text: string) {
  const parts = text.split(/(\*\*[^*]+\*\*|\*[^*]+\*|\n)/g)
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**'))
      return <strong key={i}>{part.slice(2, -2)}</strong>
    if (part.startsWith('*') && part.endsWith('*'))
      return <em key={i}>{part.slice(1, -1)}</em>
    if (part === '\n') return <br key={i} />
    return <span key={i}>{part}</span>
  })
}

export default function ChatMessage({ message, onActionClick }: ChatMessageProps) {
  const isUser = message.role === 'user'
  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-3`}>
      {!isUser && (
        <div className="w-7 h-7 rounded-full bg-primary-500 flex items-center justify-center text-white text-xs font-bold mr-2 flex-shrink-0 mt-0.5" aria-hidden="true">
          R
        </div>
      )}
      <div className={`max-w-[85%] ${isUser ? 'items-end' : 'items-start'} flex flex-col`}>
        <div
          className={`px-3 py-2 rounded-2xl text-sm leading-relaxed ${
            isUser
              ? 'bg-primary-500 text-white rounded-br-sm'
              : 'bg-gray-100 text-gray-800 rounded-bl-sm'
          }`}
        >
          {renderMarkdown(message.text)}
        </div>
        {!isUser && message.suggested_actions && message.suggested_actions.length > 0 && (
          <SuggestedActions actions={message.suggested_actions} onAction={onActionClick} />
        )}
        <span className="text-[10px] text-gray-400 mt-1 px-1">
          {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </span>
      </div>
    </div>
  )
}
