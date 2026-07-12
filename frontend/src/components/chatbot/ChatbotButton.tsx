import { useState, useEffect, useRef } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import ChatbotPanel from './ChatbotPanel'
import type { UserRole } from './chatbotRules'

export default function ChatbotButton() {
  const { isAuthenticated, user } = useAuth()
  const [open, setOpen] = useState(false)
  const [pulseDot, setPulseDot] = useState(true)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const onOpenChatbot = () => { setOpen(true); setPulseDot(false) }
    window.addEventListener('open-chatbot', onOpenChatbot)
    return () => window.removeEventListener('open-chatbot', onOpenChatbot)
  }, [])

  useEffect(() => {
    if (!open) return
    const onMouseDown = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', onMouseDown)
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('mousedown', onMouseDown)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [open])

  if (!isAuthenticated) return null

  const role = (user?.role ?? null) as UserRole

  const toggle = () => {
    if (!open) setPulseDot(false)
    setOpen(prev => !prev)
  }

  return (
    <div ref={containerRef} className="fixed bottom-6 right-6 flex flex-col items-end gap-3" style={{ zIndex: 40 }} aria-label="AI assistant">
      {open && <ChatbotPanel role={role} onClose={() => setOpen(false)} />}

      <button
        type="button"
        onClick={toggle}
        aria-label={open ? 'Close AI assistant' : 'Open AI assistant'}
        aria-expanded={open}
        className="relative w-14 h-14 rounded-full bg-primary-500 text-white shadow-xl hover:bg-primary-600 active:scale-95 transition-all focus:outline-none focus:ring-4 focus:ring-primary-300 focus:ring-offset-2 flex items-center justify-center"
      >
        {pulseDot && !open && (
          <span className="absolute top-1 right-1 flex h-3 w-3" aria-hidden="true">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-3 w-3 bg-accent-500 border-2 border-white" />
          </span>
        )}

        {open ? (
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        ) : (
          <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
              d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
              d="M18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456z" />
          </svg>
        )}
      </button>
    </div>
  )
}
