interface ErrorAlertProps {
  message: string
  onDismiss?: () => void
  className?: string
}

export default function ErrorAlert({ message, onDismiss, className = '' }: ErrorAlertProps) {
  return (
    <div
      className={`bg-accent-50 border border-accent-200 rounded-xl p-4 flex items-start gap-3 ${className}`}
      role="alert"
      aria-live="polite"
    >
      <svg className="w-5 h-5 text-accent-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
      <span className="text-sm text-accent-800 flex-1">{message}</span>
      {onDismiss && (
        <button
          onClick={onDismiss}
          className="text-accent-700 hover:text-accent-900 p-1 rounded-lg hover:bg-accent-100 transition-colors"
          aria-label="Dismiss error"
          type="button"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      )}
    </div>
  )
}
