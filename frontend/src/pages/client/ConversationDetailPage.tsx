import { useState, useEffect, useRef, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { conversationsApi } from '../../lib/conversationsApi'
import { extractApiError } from '../../utils/format'
import { ConversationWithMessages, MessageResponse } from '../../types/conversation'
import { useAuth } from '../../contexts/AuthContext'
import AppLayout from '../../components/layout/AppLayout'
import { LoadingState, ErrorState, EmptyState } from '../../components/ui/shared'
import Button from '../../components/ui/Button'
import Textarea from '../../components/ui/Textarea'
import ChatMessageBubble from '../../components/client/ChatMessageBubble'

function formatTime(iso: string) {
  const d = new Date(iso)
  const now = new Date()
  const isToday = d.toDateString() === now.toDateString()
  if (isToday) return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  return d.toLocaleDateString([], { month: 'short', day: 'numeric' }) + ' ' + d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

export default function ConversationDetailPage() {
  const { conversationId } = useParams<{ conversationId: string }>()
  const navigate = useNavigate()
  const { user } = useAuth()
  const [conversation, setConversation] = useState<ConversationWithMessages | null>(null)
  const [messages, setMessages] = useState<MessageResponse[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [isSending, setIsSending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const isFirstLoad = useRef(true)

  const scrollToBottom = (behavior: ScrollBehavior = 'smooth') => {
    messagesEndRef.current?.scrollIntoView?.({ behavior })
  }

  const loadMessages = useCallback(async (silent = false) => {
    if (!conversationId) return
    if (!silent) setIsLoading(true)
    try {
      const data = await conversationsApi.getConversation(conversationId)
      setConversation(data)
      setMessages(prev => {
        const newMsgs = (data.messages || []).filter(m => !m.is_deleted)
        if (prev.length !== newMsgs.length) {
          setTimeout(() => scrollToBottom(isFirstLoad.current ? 'instant' : 'smooth'), 50)
          isFirstLoad.current = false
        }
        return newMsgs
      })
      conversationsApi.markConversationRead(conversationId).catch(() => {})
    } catch (err) {
      if (!silent) setError(extractApiError(err) || 'Failed to load conversation')
    } finally {
      if (!silent) setIsLoading(false)
    }
  }, [conversationId])

  useEffect(() => {
    loadMessages()
  }, [loadMessages])

  useEffect(() => {
    const interval = setInterval(() => loadMessages(true), 5000)
    return () => clearInterval(interval)
  }, [loadMessages])

  const handleSendMessage = async () => {
    if (!conversationId || !newMessage.trim() || isSending) return
    const content = newMessage.trim()
    setNewMessage('')
    setIsSending(true)

    const optimistic: MessageResponse = {
      id: `optimistic-${Date.now()}`,
      conversation_id: conversationId,
      sender_user_id: user?.id ?? '',
      content,
      is_deleted: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }
    setMessages(prev => [...prev, optimistic])
    setTimeout(() => scrollToBottom(), 50)

    try {
      const saved = await conversationsApi.createMessage(conversationId, { content })
      setMessages(prev => prev.map(m => m.id === optimistic.id ? saved : m))
    } catch (err) {
      setMessages(prev => prev.filter(m => m.id !== optimistic.id))
      setNewMessage(content)
      setError(extractApiError(err) || 'Failed to send message')
    } finally {
      setIsSending(false)
      textareaRef.current?.focus()
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  if (isLoading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-[calc(100vh-8rem)]">
          <LoadingState />
        </div>
      </AppLayout>
    )
  }

  if (error && !conversation) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-[calc(100vh-8rem)]">
          <ErrorState
            message={error || 'Conversation not found.'}
            onRetry={() => navigate('/client/conversations')}
          />
        </div>
      </AppLayout>
    )
  }

  const myId = user?.id ?? conversation?.client_id

  return (
    <AppLayout>
      <div className="flex flex-col h-[calc(100vh-4rem)] max-w-3xl mx-auto">

        {/* Header */}
        <div className="flex items-center gap-3 px-4 py-3 bg-white border-b border-gray-200 shadow-sm flex-shrink-0">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => navigate('/client/conversations')}
            className="!p-2 rounded-full"
            ariaLabel="Back to messages"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </Button>
          <div className="w-10 h-10 rounded-full bg-primary-500 flex items-center justify-center text-white font-bold text-sm flex-shrink-0" aria-hidden="true">
            A
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-gray-900 truncate">{conversation?.subject || 'Conversation'}</p>
            <p className="text-xs text-success-600 font-medium">
              {conversation?.is_active ? 'Active' : 'Inactive'}
            </p>
          </div>
          {conversation?.property_id && (
            <Button as="Link" to={`/properties/${conversation.property_id}`} variant="outline" size="sm">
              View Property
            </Button>
          )}
        </div>

        {/* Messages area */}
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-1 bg-gray-50">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <EmptyState
                title="No messages yet"
                description="Send a message to start the conversation."
                icon={
                  <svg className="w-10 h-10 text-primary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                }
              />
            </div>
          ) : (
            messages.map((msg, i) => {
              const isMine = msg.sender_user_id === myId
              const prevMsg = messages[i - 1]
              const showTime = !prevMsg || new Date(msg.created_at).getTime() - new Date(prevMsg.created_at).getTime() > 5 * 60 * 1000
              return (
                <ChatMessageBubble
                  key={msg.id}
                  message={msg}
                  isMine={isMine}
                  showTime={showTime}
                  formatTime={formatTime}
                />
              )
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Error banner */}
        {error && (
          <div className="px-4 py-2 bg-red-50 border-t border-red-100 flex items-center justify-between flex-shrink-0">
            <p className="text-xs text-red-600">{error}</p>
            <button onClick={() => setError(null)} className="text-red-400 hover:text-red-600 ml-2">✕</button>
          </div>
        )}

        {/* Input area */}
        <div className="flex items-end gap-3 px-4 py-3 bg-white border-t border-gray-200 flex-shrink-0">
          <Textarea
            id="message-input"
            ref={textareaRef}
            rows={1}
            placeholder="Type your message..."
            value={newMessage}
            onChange={v => setNewMessage(v)}
            onKeyDown={handleKeyDown}
            disabled={isSending}
            className="flex-1 resize-none max-h-[120px]"
            label=""
          />
          <Button
            type="button"
            onClick={handleSendMessage}
            disabled={!newMessage.trim() || isSending}
            isLoading={isSending}
            ariaLabel="Send"
            className="!p-2.5 rounded-full"
          >
            {!isSending && (
              <svg className="w-5 h-5 translate-x-0.5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
              </svg>
            )}
          </Button>
        </div>
      </div>
    </AppLayout>
  )
}
