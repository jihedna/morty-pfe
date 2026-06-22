interface ErrorAlertProps {
  message: string
  onDismiss?: () => void
}

export default function ErrorAlert({ message, onDismiss }: ErrorAlertProps) {
  return (
    <div
      className="bg-red-50 border border-red-200 rounded-md p-4 mb-4 flex justify-between items-center"
      role="alert"
      aria-live="polite"
    >
      <span className="text-red-800">{message}</span>
      {onDismiss && (
        <button
          onClick={onDismiss}
          className="bg-none border-none text-red-800 text-2xl cursor-pointer ml-4 hover:text-red-900"
          aria-label="Dismiss error"
          type="button"
        >
          ×
        </button>
      )}
    </div>
  )
}
