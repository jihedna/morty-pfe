import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import AppLayout from '../../components/layout/AppLayout'
import { clientSearchRequestsApi, AgentMatchResponse } from '../../lib/clientSearchRequestsApi'
import { conversationsApi } from '../../lib/conversationsApi'
import { PageHeader, LoadingState, ErrorState, EmptyState } from '../../components/ui/shared'
import Button from '../../components/ui/Button'
import MatchScoreCard from '../../components/client/MatchScoreCard'
import { extractApiError } from '../../utils/format'

export default function ClientMatches() {
  const navigate = useNavigate()
  const [matches, setMatches] = useState<AgentMatchResponse[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [contactingId, setContactingId] = useState<string | null>(null)

  const loadMatches = async () => {
    try {
      setIsLoading(true)
      setError(null)
      const requests = await clientSearchRequestsApi.getMyRequests(true)
      if (requests.length > 0) {
        const allMatches = await clientSearchRequestsApi.getAgentMatches(requests[0].id)
        setMatches(allMatches)
      } else {
        setMatches([])
      }
    } catch (err) {
      setError(extractApiError(err) || 'Failed to load agent matches')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadMatches()
  }, [])

  const handleContact = async (match: AgentMatchResponse) => {
    setContactingId(match.agent_id)
    try {
      const conv = await conversationsApi.createConversation({
        subject: `Inquiry — ${match.full_name}`,
        agent_id: match.agent_id,
      })
      navigate(`/client/conversations/${conv.id}`)
    } catch (err) {
      setError(extractApiError(err) || 'Failed to start conversation. Please try again.')
      setContactingId(null)
    }
  }

  return (
    <AppLayout>
      <div className="space-y-6">
        <PageHeader
          title="Agent Matches"
          subtitle="Agents matched to your active search requests."
          action={
            <Button as="Link" to="/client/search-requests/new" variant="outline">
              New Search Request
            </Button>
          }
        />

        {isLoading ? (
          <LoadingState />
        ) : error ? (
          <ErrorState message={error} onRetry={loadMatches} />
        ) : matches.length === 0 ? (
          <EmptyState
            title="No Matches Found"
            description="Create a search request to find matching agents."
            action={
              <Button as="Link" to="/client/search-requests" size="sm">
                View Search Requests
              </Button>
            }
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {matches.map((match) => (
              <MatchScoreCard
                key={match.agent_id}
                match={match}
                contactingId={contactingId}
                onContact={handleContact}
                showUnmatched
              />
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  )
}
