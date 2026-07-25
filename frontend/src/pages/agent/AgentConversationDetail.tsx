import { useState, useEffect, useRef, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import AppLayout from '../../components/layout/AppLayout'
import { agentConversationsApi, ConversationWithMessages, MessageResponse } from '../../lib/agentConversationsApi'
import { extractApiError } from '../../utils/format'
import { useAuth } from '../../contexts/AuthContext'
import { LoadingState } from '../../components/ui/shared'
import Button from '../../components/ui/Button'
import Textarea from '../../components/ui/Textarea'

function formatTime(iso: string) {
  const d = new Date(iso)
  const now = new Date()
  const isToday = d.toDateString() === now.toDateString()
  if (isToday) return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  return d.toLocaleDateString([], { month: 'short', day: 'numeric' }) + ' ' + d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

export default function AgentConversationDetail() {
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
      const data = await agentConversationsApi.getConversation(conversationId)
      setConversation(data)
      setMessages((data.messages || []).filter(m => !m.is_deleted))
      agentConversationsApi.markConversationRead(conversationId).catch(() => {})
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

  useEffect(() => {
    if (messages.length > 0) {
      scrollToBottom(isFirstLoad.current ? 'instant' : 'smooth')
      isFirstLoad.current = false
    }
  }, [messages])

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

    try {
      const saved = await agentConversationsApi.createMessage(conversationId, { content })
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
          <LoadingState message="Loading conversation…" />
        </div>
      </AppLayout>
    )
  }

  if (error && !conversation) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-[calc(100vh-8rem)]">
          <div className="bg-white rounded-2xl shadow p-8 text-center max-w-sm">
            <div className="text-4xl mb-3">💬</div>
            <h2 className="text-lg font-semibold text-gray-900 mb-2">Conversation not found</h2>
            <p className="text-gray-500 text-sm mb-4">{error}</p>
            <Button
              type="button"
              onClick={() => navigate('/agent/conversations')}
              variant="primary"
              size="sm"
            >
              ← Back to conversations
            </Button>
          </div>
        </div>
      </AppLayout>
    )
  }

  const myId = user?.id

  return (
    <AppLayout>
      <div className="mx-auto flex h-[calc(100vh-8rem)] w-full max-w-5xl flex-col overflow-hidden rounded-3xl border border-slate-200/80 bg-white shadow-card-hover">

        {/* Header */}
        <div className="flex flex-shrink-0 items-center gap-3 border-b border-slate-200 bg-white/95 px-5 py-4 backdrop-blur">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            ariaLabel="Back to conversations"
            className="rounded-full !p-2"
            onClick={() => navigate('/agent/conversations')}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            <span className="hidden sm:inline text-sm font-medium">Back to conversations</span>
          </Button>
          <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-primary-500 to-primary-700 text-sm font-bold text-white shadow-sm">
            C
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-gray-900 truncate">{conversation?.subject || 'Conversation'}</p>
            <p className="text-xs text-green-500 font-medium">
              {conversation?.is_active ? 'Active' : 'Inactive'}
            </p>
          </div>
          {conversation?.property_id && (
            <span className="text-xs text-gray-400 bg-gray-100 px-2 py-1 rounded-lg hidden sm:block">
              🏠 Property linked
            </span>
          )}
        </div>

        {/* Messages area */}
        <div className="flex-1 space-y-1 overflow-y-auto bg-gradient-to-b from-slate-50 to-white px-4 py-5 sm:px-6">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <div className="mb-3 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary-100">
                <svg className="w-8 h-8 text-primary-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              </div>
              <p className="text-gray-500 font-medium">No messages yet</p>
              <p className="text-gray-400 text-sm mt-1">Reply to start the conversation</p>
            </div>
          ) : (
            messages.map((msg, i) => {
              const isMine = msg.sender_user_id === myId
              const isOptimistic = msg.id.startsWith('optimistic-')
              const prevMsg = messages[i - 1]
              const showTime = !prevMsg || new Date(msg.created_at).getTime() - new Date(prevMsg.created_at).getTime() > 5 * 60 * 1000
              return (
                <div key={msg.id}>
                  {showTime && (
                    <div className="flex justify-center my-3">
                      <span className="text-xs text-gray-400 bg-gray-200 px-3 py-1 rounded-full">{formatTime(msg.created_at)}</span>
                    </div>
                  )}
                  <div className={`flex items-end gap-2 mb-1 ${isMine ? 'flex-row-reverse' : 'flex-row'}`}>
                    {!isMine && (
                      <div className="mb-1 flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-primary-500 to-primary-700 text-xs font-bold text-white">
                        C
                      </div>
                    )}
                    <div className={`max-w-[70%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${
                      isMine
                        ? 'bg-primary-600 text-white shadow-sm rounded-br-sm'
                        : 'bg-white text-gray-900 shadow-sm border border-gray-100 rounded-bl-sm'
                    } ${isOptimistic ? 'opacity-70' : ''}`}>
                      <p className="whitespace-pre-wrap break-words">{msg.content}</p>
                    </div>
                  </div>
                </div>
              )
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Error banner */}
        {error && (
          <div className="px-4 py-2 bg-red-50 border-t border-red-100 flex items-center justify-between flex-shrink-0">
            <p className="text-xs text-red-600">{error}</p>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              ariaLabel="Dismiss error"
              className="!p-0 text-red-400 hover:text-red-600"
              onClick={() => setError(null)}
            >
              ✕
            </Button>
          </div>
        )}

        {/* Input area */}
        <div className="flex items-end gap-3 px-4 py-3 bg-white border-t border-gray-200 flex-shrink-0">
          <Textarea
            ref={textareaRef}
            rows={1}
            placeholder="Type your message..."
            value={newMessage}
            onChange={setNewMessage}
            onKeyDown={handleKeyDown}
            disabled={isSending}
            className="flex-1"
            autoResize
            maxHeight={120}
          />
          <Button
            type="button"
            onClick={handleSendMessage}
            isLoading={isSending}
            disabled={isSending || !newMessage.trim()}
            ariaLabel="Send"
            className="rounded-full w-10 h-10 !p-0 flex-shrink-0"
          >
            <svg className="w-5 h-5 translate-x-0.5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
            </svg>
          </Button>
        </div>
      </div>
    </AppLayout>
  )
}
