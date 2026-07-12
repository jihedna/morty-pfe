import { useState, useEffect, useRef, KeyboardEvent } from 'react'
import { useLocation } from 'react-router-dom'
import { UserRole } from './chatbotRules'
import { aiChatApi, SuggestedAction } from '../../lib/aiChatApi'
import ChatMessage, { ChatMessageData } from './ChatMessage'

interface ChatbotPanelProps {
  role: UserRole
  onClose: () => void
}

let _msgCounter = 0
function newId() {
  return `msg-${Date.now()}-${++_msgCounter}`
}

function buildWelcome(role: UserRole): ChatMessageData {
  const text =
    role === 'client'
      ? "Hi! I'm your RE/MAX Smile assistant. I can help you browse properties, contact agents, schedule viewings, check market prices, and more. What would you like to know?"
      : role === 'agent'
      ? "Hi! I'm your RE/MAX Smile assistant. I can guide you through managing listings, appointments, and client conversations. How can I help?"
      : role === 'manager'
      ? "Hi! I'm your RE/MAX Smile assistant. I can help you navigate analytics, manage users, agents, and oversee the platform. What do you need?"
      : "Hi! I'm the RE/MAX Smile AI assistant. I can help you browse properties, understand the buying process, and learn about our services."
  const actions: SuggestedAction[] =
    role === 'client'
      ? [
          { label: 'Browse Properties', route: '/properties' },
          { label: 'My Matches', route: '/client/matches' },
          { label: 'Market prices', route: '/market-map' },
        ]
      : role === 'agent'
      ? [
          { label: 'My Properties', route: '/agent/properties' },
          { label: 'Appointments', route: '/agent/appointments' },
        ]
      : role === 'manager'
      ? [
          { label: 'Analytics', route: '/admin/analytics' },
          { label: 'Manage Agents', route: '/admin/agents' },
        ]
      : [
          { label: 'Browse Properties', route: '/properties' },
          { label: 'Login', route: '/login' },
        ]
  return { id: newId(), role: 'assistant', text, timestamp: new Date(), suggested_actions: actions }
}

const STARTER_PROMPTS: Record<string, string[]> = {
  client: [
    'Which areas fit a budget of 300,000 TND?',
    'What is the average price per m² in La Marsa?',
    'How do I contact an agent?',
    'How do I request a viewing?',
  ],
  agent: [
    'How do I add a property?',
    'How do I update a property status?',
    'How do I confirm an appointment?',
    'How do I reply to clients?',
  ],
  manager: [
    'How do I read the analytics dashboard?',
    'How can I compare agent performance?',
    'What does the heat map show?',
    'How do I manage users on the platform?',
  ],
  public: [
    'How do I find a property?',
    'What documents are needed to buy in Tunisia?',
    'How does agent matching work?',
    'What are the taxes when buying property?',
  ],
}

export default function ChatbotPanel({ role, onClose }: ChatbotPanelProps) {
  const location = useLocation()
  const [messages, setMessages] = useState<ChatMessageData[]>(() => [buildWelcome(role)])
  const [input, setInput] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isTyping])

  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  useEffect(() => {
    const handleKeyDown = (e: globalThis.KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [onClose])

  const sendText = async (text: string) => {
    if (!text.trim() || isTyping) return
    setError(null)
    const userMsg: ChatMessageData = { id: newId(), role: 'user', text: text.trim(), timestamp: new Date() }
    setMessages(prev => [...prev, userMsg])
    setInput('')
    setIsTyping(true)
    try {
      const res = await aiChatApi.sendMessage(text.trim(), {
        current_route: location.pathname,
        role: role ?? undefined,
      })
      const assistantMsg: ChatMessageData = {
        id: newId(),
        role: 'assistant',
        text: res.reply,
        timestamp: new Date(),
        suggested_actions: res.suggested_actions,
        confidence: res.confidence,
      }
      setMessages(prev => [...prev, assistantMsg])
    } catch {
      setError('Could not reach the assistant. Please check your connection.')
    } finally {
      setIsTyping(false)
    }
  }

  const send = () => sendText(input)

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      send()
    }
  }

  const prompts = STARTER_PROMPTS[role ?? 'public'] ?? STARTER_PROMPTS.public
  const showStarters = messages.length === 1

  return (
    <div
      className="flex flex-col bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden w-[calc(100vw-2.5rem)] max-w-[380px] h-[70vh] max-h-[560px]"
      style={{ position: 'relative', zIndex: 1 }}
      role="dialog"
      aria-modal="true"
      aria-label="RE/MAX AI Assistant"
    >
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 bg-primary-500 text-white flex-shrink-0">
        <div className="w-8 h-8 rounded-full bg-accent-500 flex items-center justify-center flex-shrink-0">
          <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 14.5v-9l6 4.5-6 4.5z" />
          </svg>
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold leading-tight">RE/MAX Assistant</p>
          <p className="text-xs text-primary-200 capitalize">{role ?? 'Guest'} · AI powered</p>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close assistant"
          className="p-1 rounded-lg hover:bg-primary-700 transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-3 py-3 bg-gray-50" aria-live="polite" aria-atomic="false">
        {messages.map(msg => (
          <ChatMessage key={msg.id} message={msg} onActionClick={onClose} />
        ))}
        {isTyping && (
          <div className="flex justify-start mb-3">
            <div className="w-7 h-7 rounded-full bg-primary-500 flex items-center justify-center flex-shrink-0 mt-0.5 mr-2">
              <span className="text-white text-xs font-bold">R</span>
            </div>
            <div className="bg-white border border-gray-100 shadow-sm rounded-2xl rounded-bl-sm px-3 py-2.5">
              <div className="flex gap-1 items-center h-4">
                <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          </div>
        )}
        {error && (
          <div className="mx-1 mb-3 px-3 py-2 bg-accent-50 border border-accent-200 rounded-xl text-xs text-accent-700" role="alert">
            {error}
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Starter prompts */}
      {showStarters && (
        <div className="px-3 pb-2 flex flex-wrap gap-1.5 flex-shrink-0 bg-gray-50 border-t border-gray-100 pt-2">
          {prompts.map(p => (
            <button
              key={p}
              onClick={() => sendText(p)}
              className="text-xs px-2.5 py-1 bg-white border border-gray-200 rounded-full text-gray-700 hover:bg-primary-50 hover:border-primary-300 hover:text-primary-700 transition-colors"
            >
              {p}
            </button>
          ))}
        </div>
      )}

      {/* Input */}
      <div className="flex-shrink-0 border-t border-gray-100 px-3 py-2 bg-white flex items-end gap-2">
        <textarea
          ref={inputRef}
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ask me anything… (Shift+Enter for new line)"
          maxLength={1000}
          rows={1}
          aria-label="Message to assistant"
          className="flex-1 text-sm px-3 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none max-h-24 overflow-y-auto"
          style={{ lineHeight: '1.4' }}
        />
        <button
          type="button"
          onClick={send}
          disabled={!input.trim() || isTyping}
          aria-label="Send message"
          className="w-9 h-9 flex items-center justify-center bg-primary-500 text-white rounded-xl hover:bg-primary-600 transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex-shrink-0 mb-0.5"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
          </svg>
        </button>
      </div>

      <p className="text-center text-[10px] text-gray-400 pb-1.5 bg-white flex-shrink-0">
        Press <kbd className="font-mono">Esc</kbd> to close · <kbd className="font-mono">Shift+Enter</kbd> for new line
      </p>
    </div>
  )
}
