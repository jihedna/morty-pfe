interface EmptyStateProps {
  title: string
  description?: string
  action?: React.ReactNode
}

export default function EmptyState({ title, description, action }: EmptyStateProps) {
  return (
    <div
      className="flex flex-col items-center justify-center p-16 text-center"
      role="status"
      aria-live="polite"
    >
      <div className="text-6xl mb-4 opacity-50" aria-hidden="true">
        📭
      </div>
      <h2 className="text-2xl font-semibold text-gray-900 mb-2">{title}</h2>
      {description && (
        <p className="text-gray-600 mb-6">{description}</p>
      )}
      {action}
    </div>
  )
}
