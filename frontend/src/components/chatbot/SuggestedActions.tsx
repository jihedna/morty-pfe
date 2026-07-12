import { useNavigate } from 'react-router-dom'
import { SuggestedAction } from '../../lib/aiChatApi'

interface SuggestedActionsProps {
  actions: SuggestedAction[]
  onAction?: () => void
}

export default function SuggestedActions({ actions, onAction }: SuggestedActionsProps) {
  const navigate = useNavigate()
  if (!actions || actions.length === 0) return null
  return (
    <div className="flex flex-wrap gap-2 mt-2">
      {actions.map((action, i) => (
        <button
          key={i}
          type="button"
          onClick={() => {
            navigate(action.route)
            onAction?.()
          }}
          className="px-3 py-1.5 text-xs font-medium rounded-full bg-primary-50 text-primary-700 border border-primary-200 hover:bg-primary-100 transition-colors truncate max-w-[200px]"
          title={action.label}
        >
          {action.label}
        </button>
      ))}
    </div>
  )
}
