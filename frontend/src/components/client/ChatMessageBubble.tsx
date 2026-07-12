import { MessageResponse } from '../../types/conversation'

interface ChatMessageBubbleProps {
  message: MessageResponse
  isMine: boolean
  showTime: boolean
  formatTime: (iso: string) => string
}

export default function ChatMessageBubble({ message, isMine, showTime, formatTime }: ChatMessageBubbleProps) {
  const isOptimistic = message.id.startsWith('optimistic-')

  return (
    <div>
      {showTime && (
        <div className="flex justify-center my-3">
          <span className="text-xs text-gray-500 bg-gray-100 px-3 py-1 rounded-full">{formatTime(message.created_at)}</span>
        </div>
      )}
      <div className={`flex items-end gap-2 mb-1 ${isMine ? 'flex-row-reverse' : 'flex-row'}`}>
        {!isMine && (
          <div className="w-7 h-7 rounded-full bg-primary-500 flex items-center justify-center text-white text-xs font-bold flex-shrink-0 mb-1" aria-hidden="true">
            A
          </div>
        )}
        <div
          className={`max-w-[80%] sm:max-w-[70%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${
            isMine
              ? 'bg-primary-500 text-white rounded-br-sm'
              : 'bg-white text-gray-900 shadow-sm border border-gray-100 rounded-bl-sm'
          } ${isOptimistic ? 'opacity-70' : ''}`}
        >
          {message.is_deleted ? (
            <p className="italic text-gray-400">This message was deleted</p>
          ) : (
            <p className="whitespace-pre-wrap break-words">{message.content}</p>
          )}
        </div>
      </div>
    </div>
  )
}
