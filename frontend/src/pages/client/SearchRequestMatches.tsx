import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import AppLayout from '../../components/layout/AppLayout'
import { clientSearchRequestsApi, AgentMatchResponse, ClientSearchRequestResponse, LeadScoreResponse } from '../../lib/clientSearchRequestsApi'
import { conversationsApi } from '../../lib/conversationsApi'
import { PageHeader, LoadingState, EmptyState } from '../../components/ui/shared'
import Button from '../../components/ui/Button'
import MatchScoreCard from '../../components/client/MatchScoreCard'
import { extractApiError } from '../../utils/format'

export default function SearchRequestMatches() {
  const { requestId } = useParams<{ requestId: string }>()
  const navigate = useNavigate()

  const [request, setRequest] = useState<ClientSearchRequestResponse | null>(null)
  const [matches, setMatches] = useState<AgentMatchResponse[]>([])
  const [leadScore, setLeadScore] = useState<LeadScoreResponse | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [contactingId, setContactingId] = useState<string | null>(null)

  useEffect(() => {
    if (!requestId) return
    const load = async () => {
      setIsLoading(true)
      setError(null)
      try {
        const [req, agentMatches] = await Promise.all([
          clientSearchRequestsApi.getRequest(requestId),
          clientSearchRequestsApi.getAgentMatches(requestId),
        ])
        setRequest(req)
        setMatches(agentMatches)
        // Load lead score separately — non-critical
        clientSearchRequestsApi.getLeadScore(requestId)
          .then(setLeadScore)
          .catch(() => {})
      } catch {
        setError('Failed to load matches.')
      } finally {
        setIsLoading(false)
      }
    }
    load()
  }, [requestId])

  const handleContact = async (match: AgentMatchResponse) => {
    setContactingId(match.agent_id)
    try {
      const conv = await conversationsApi.createConversation({
        subject: `Agent inquiry — ${match.full_name}`,
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
        <div className="flex items-center gap-3">
          <Link to="/client/search-requests" className="p-2 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </Link>
          <div className="flex-1 min-w-0">
            <PageHeader
              title="Agent Matches"
              subtitle={
                request
                  ? `${request.property_type} · ${request.listing_type === 'sale' ? 'For Sale' : 'For Rent'}${request.preferred_city ? ` · ${request.preferred_city}` : ''}`
                  : 'Agents matching your search request'
              }
            />
            {leadScore && leadScore.lead_score_reasons.length > 0 && (
              <p className="text-xs text-gray-500 ml-1">{leadScore.lead_score_reasons[0]}</p>
            )}
          </div>
          {leadScore && (
            <span className={`hidden sm:inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold border ${
              leadScore.lead_score >= 70
                ? 'bg-success-100 text-success-700 border-success-200'
                : leadScore.lead_score >= 45
                ? 'bg-warning-100 text-warning-700 border-warning-200'
                : 'bg-accent-100 text-accent-700 border-accent-200'
            }`}>
              Lead {leadScore.lead_score} · {leadScore.qualification_level}
            </span>
          )}
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm" role="alert">{error}</div>
        )}

        {isLoading ? (
          <LoadingState />
        ) : matches.length === 0 ? (
          <EmptyState
            title="No Matches Found"
            description="No agents currently match this search request."
            action={
              <Button as="Link" to="/client/search-requests" size="sm">
                Back to Requests
              </Button>
            }
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {matches.map(match => (
              <MatchScoreCard
                key={match.agent_id}
                match={match}
                contactingId={contactingId}
                onContact={handleContact}
              />
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  )
}

