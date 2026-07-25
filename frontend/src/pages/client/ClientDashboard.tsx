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
    if (typeof target.contract_id === 'string') navigate('/client/deals')
    else if (typeof target.conversation_id === 'string') navigate(`/client/conversations/${target.conversation_id}`)
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
            <div className="mb-6 grid gap-4 sm:grid-cols-2">
              <div className="relative overflow-hidden rounded-2xl border border-success-200 bg-gradient-to-br from-success-50 to-white p-5 shadow-card">
                <div className="absolute -right-8 -top-8 h-24 w-24 rounded-full bg-success-100" aria-hidden="true" />
                <div className="relative flex items-center justify-between gap-4">
                  <div><p className="text-xs font-semibold uppercase tracking-[0.16em] text-success-700">Approved deals</p><p className="mt-2 text-3xl font-semibold text-navy-900">{data.approvedDealCount}</p><p className="mt-1 text-sm text-slate-500">Manager-approved property agreements</p></div>
                  <Button as="Link" to="/client/deals" variant="outline" size="sm">View My Deals</Button>
                </div>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-card">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">Deal tracking</p>
                <p className="mt-2 font-semibold text-navy-900">Approval status stays available here</p>
                <p className="mt-1 text-sm text-slate-500">You no longer need to rely only on a notification to confirm a deal.</p>
              </div>
            </div>
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
