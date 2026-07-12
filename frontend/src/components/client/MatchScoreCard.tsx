import { AgentMatchResponse } from '../../lib/clientSearchRequestsApi'
import Button from '../ui/Button'

interface MatchScoreCardProps {
  match: AgentMatchResponse
  contactingId: string | null
  onContact: (match: AgentMatchResponse) => void
  showUnmatched?: boolean
}

export default function MatchScoreCard({ match, contactingId, onContact, showUnmatched = false }: MatchScoreCardProps) {
  const initials = match.full_name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
  const scoreColor =
    match.match_score >= 75 ? 'bg-success-100 text-success-700 border-success-200' :
    match.match_score >= 50 ? 'bg-warning-100 text-warning-700 border-warning-200' :
    'bg-gray-100 text-gray-700 border-gray-200'

  const criteria = [
    { key: 'property_type', label: 'Property Type' },
    { key: 'territory', label: 'Territory' },
    { key: 'budget', label: 'Budget' },
    { key: 'availability', label: 'Available' },
  ] as const

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-card p-5 flex flex-col gap-4 h-full">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-12 h-12 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 font-semibold text-sm flex-shrink-0" aria-hidden="true">
            {initials}
          </div>
          <div className="min-w-0">
            <p className="font-semibold text-gray-900 text-sm truncate">{match.full_name}</p>
            <p className="text-xs text-gray-500 truncate">{match.office}</p>
          </div>
        </div>
        <span className={`text-xs font-bold px-2.5 py-1 rounded-full border ${scoreColor}`}>
          {match.match_score}%
        </span>
      </div>

      <div className="text-sm text-gray-600 space-y-1">
        <p>{match.phone}</p>
        <p>{match.years_experience} years experience</p>
      </div>

      <div className="space-y-2">
        <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Matched Criteria</p>
        <div className="flex flex-wrap gap-1.5">
          {criteria.map(({ key, label }) =>
            match.matched_criteria[key as keyof typeof match.matched_criteria] ? (
              <span key={key} className="px-2 py-0.5 bg-success-50 text-success-700 text-xs rounded-full border border-success-100">
                {label}
              </span>
            ) : null
          )}
          {criteria.every(c => !match.matched_criteria[c.key as keyof typeof match.matched_criteria]) && (
            <span className="text-xs text-gray-400">No direct matches</span>
          )}
        </div>
      </div>

      {showUnmatched && (
        <div className="space-y-2">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Unmatched Criteria</p>
          <div className="flex flex-wrap gap-1.5">
            {criteria.map(({ key, label }) =>
              match.unmatched_criteria[key as keyof typeof match.unmatched_criteria] ? (
                <span key={key} className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded-full border border-gray-200">
                  {label}
                </span>
              ) : null
            )}
            {criteria.every(c => !match.unmatched_criteria[c.key as keyof typeof match.unmatched_criteria]) && (
              <span className="text-xs text-gray-400">All criteria matched</span>
            )}
          </div>
        </div>
      )}

      <Button
        type="button"
        onClick={() => onContact(match)}
        disabled={contactingId === match.agent_id}
        isLoading={contactingId === match.agent_id}
        className="mt-auto w-full"
      >
        Contact Agent
      </Button>
    </div>
  )
}
