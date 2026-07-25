import { AgentMatchResponse } from '../../../lib/clientSearchRequestsApi'
import Button from '../../ui/Button'

interface AgentMatchCardProps {
  match: AgentMatchResponse
  onMessage: (match: AgentMatchResponse) => Promise<void> | void
  isLoading: boolean
}

export function AgentMatchCard({ match, onMessage, isLoading }: AgentMatchCardProps) {
  const initials = match.full_name.split(' ').map((name) => name.charAt(0)).join('').slice(0, 2).toUpperCase()

  return (
    <div className="flex items-center justify-between gap-3 p-3.5 bg-white rounded-xl border border-slate-200 shadow-sm transition hover:border-primary-200 hover:shadow-card">
      <div className="flex items-center gap-3 min-w-0">
        <div className="w-12 h-12 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 font-semibold text-sm flex-shrink-0" aria-hidden="true">
          {initials}
        </div>
        <div className="min-w-0">
          <p className="text-sm font-bold text-navy-900 truncate">{match.full_name}</p>
          <p className="text-xs text-navy-500 truncate">{match.office}</p>
        </div>
      </div>
      <div className="flex items-center gap-1 flex-shrink-0">
        <Button type="button" variant="ghost" size="sm" ariaLabel={`Message ${match.full_name}`} isLoading={isLoading} disabled={isLoading} onClick={() => onMessage(match)} className="rounded-full !p-2">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" /></svg>
        </Button>
      </div>
    </div>
  )
}
