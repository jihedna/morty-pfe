interface LoadingStateProps {
  message?: string
  className?: string
}

export default function LoadingState({ message = 'Loading…', className = '' }: LoadingStateProps) {
  return (
    <div
      className={`flex flex-col items-center justify-center py-16 gap-3 ${className}`}
      aria-live="polite"
      aria-busy="true"
    >
      <div
        className="w-10 h-10 border-4 border-gray-200 border-t-primary-500 rounded-full animate-spin"
        aria-hidden="true"
      />
      {message && <p className="text-sm text-gray-500">{message}</p>}
    </div>
  )
}
