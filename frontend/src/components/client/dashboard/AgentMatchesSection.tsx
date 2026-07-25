import { Link } from 'react-router-dom'
import { AgentMatchResponse } from '../../../lib/clientSearchRequestsApi'
import { EmptyState } from '../../ui/shared'
import Button from '../../ui/Button'
import { AgentMatchCard } from './AgentMatchCard'

interface AgentMatchesSectionProps {
  matches: AgentMatchResponse[]
  contactingId: string | null
  onMessage: (match: AgentMatchResponse) => Promise<void>
}

export function AgentMatchesSection({ matches, contactingId, onMessage }: AgentMatchesSectionProps) {
  return (
    <section className="bg-gradient-to-br from-navy-50 to-white rounded-2xl p-6 shadow-card border border-navy-100" aria-labelledby="agent-matches-heading">
      <h2 id="agent-matches-heading" className="text-lg font-semibold text-navy-900 mb-4">Agent Matches</h2>
      {matches.length === 0 ? (
        <EmptyState title="No agent matches yet" description="Create an active search request to find suitable agents." action={<Button as="Link" to="/client/search-requests/new" size="sm">Create Request</Button>} />
      ) : (
        <>
          <div className="space-y-3">
            {matches.slice(0, 3).map((match) => <AgentMatchCard key={match.agent_id} match={match} onMessage={onMessage} isLoading={contactingId === match.agent_id} />)}
          </div>
          <Link to="/client/matches" className="block w-full mt-4 py-2 text-center border border-primary-600 text-primary-600 text-sm font-semibold rounded-lg hover:bg-primary-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2">View More Matches</Link>
        </>
      )}
    </section>
  )
}
