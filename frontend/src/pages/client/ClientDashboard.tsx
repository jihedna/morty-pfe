import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import AppLayout from '../../components/layout/AppLayout'
import { useAuth } from '../../contexts/AuthContext'
import { useClientDashboard } from '../../hooks/useClientDashboard'
import { AgentMatchResponse } from '../../lib/clientSearchRequestsApi'
import { conversationsApi } from '../../lib/conversationsApi'
import { notificationsApi, NotificationResponse } from '../../lib/notificationsApi'
import { extractApiError } from '../../utils/format'
import { LoadingState, ErrorState, EmptyState } from '../../components/ui/shared'
import Button from '../../components/ui/Button'
import { ClientDashboardHeader } from '../../components/client/dashboard/ClientDashboardHeader'
import { ActiveSearchRequestsSection } from '../../components/client/dashboard/ActiveSearchRequestsSection'
import { RecentFavoritesSection } from '../../components/client/dashboard/RecentFavoritesSection'
import { AgentMatchesSection } from '../../components/client/dashboard/AgentMatchesSection'
import { ClientNotificationsSection } from '../../components/client/dashboard/ClientNotificationsSection'
import { ClientInsightBanner } from '../../components/client/dashboard/ClientInsightBanner'

export default function ClientDashboard() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const { data, isLoading, error, refetch } = useClientDashboard()
  const [contactingId, setContactingId] = useState<string | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)

  const handleMessage = async (match: AgentMatchResponse) => {
    setContactingId(match.agent_id)
    setActionError(null)
    try {
      const conversation = await conversationsApi.createConversation({ subject: `Inquiry — ${match.full_name}`, agent_id: match.agent_id })
      navigate(`/client/conversations/${conversation.id}`)
    } catch (err) {
      setActionError(extractApiError(err) || 'Failed to start conversation.')
      setContactingId(null)
    }
  }

  const handleNotificationClick = async (notification: NotificationResponse) => {
    if (!notification.is_read) {
      try {
        await notificationsApi.markNotificationAsRead(notification.id)
        await refetch()
      } catch {
        setActionError('Failed to mark notification as read.')
      }
    }
    const target = notification.data || {}
    if (typeof target.conversation_id === 'string') navigate(`/client/conversations/${target.conversation_id}`)
    else if (target.appointment_id) navigate('/client/appointments')
    else if (typeof target.property_id === 'string') navigate(`/properties/${target.property_id}`)
    else if (target.match_id) navigate('/client/matches')
  }

  if (!user || user.role !== 'client') {
    return <AppLayout><EmptyState title="Access Denied" description="You must be logged in as a client to view this page." action={<Button as="Link" to="/login">Sign In</Button>} /></AppLayout>
  }

  return (
    <AppLayout>
      <div className="max-w-7xl mx-auto">
        <ClientDashboardHeader user={user} activeSearchRequests={data?.activeSearchRequests || 0} isLoading={isLoading} />
        {actionError && <div className="mb-4" role="alert" aria-live="polite"><ErrorState message={actionError} /></div>}
        {isLoading ? <LoadingState message="Loading your dashboard..." /> : error ? <ErrorState message={error} onRetry={refetch} /> : data ? (
          <>
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              <div className="lg:col-span-8 space-y-6">
                <ActiveSearchRequestsSection searchRequests={data.searchRequests || []} />
                <RecentFavoritesSection favorites={data.favoriteProperties || []} onFavoriteToggle={() => { void refetch() }} />
              </div>
              <div className="lg:col-span-4 space-y-6">
                <AgentMatchesSection matches={data.agentMatches || []} contactingId={contactingId} onMessage={handleMessage} />
                <ClientNotificationsSection notifications={data.notifications || []} onNotificationClick={handleNotificationClick} />
              </div>
            </div>
            <div className="mt-6"><ClientInsightBanner /></div>
          </>
        ) : null}
      </div>
    </AppLayout>
  )
}
