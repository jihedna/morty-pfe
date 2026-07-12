import { Link } from 'react-router-dom'
import AppLayout from '../../components/layout/AppLayout'
import { useClientDashboard } from '../../hooks/useClientDashboard'
import { useAuth } from '../../contexts/AuthContext'
import { PageHeader, MetricCard, Card, SectionHeader, LoadingState, ErrorState, EmptyState } from '../../components/ui/shared'
import Button from '../../components/ui/Button'
import { StatusBadge } from '../../components/StatusBadge'

function relativeTime(iso: string) {
  const diff = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'Just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  const days = Math.floor(hrs / 24)
  if (days < 7) return `${days}d ago`
  return new Date(iso).toLocaleDateString([], { month: 'short', day: 'numeric' })
}

export default function ClientDashboard() {
  const { user } = useAuth()
  const { data, isLoading, error, refetch } = useClientDashboard()

  if (!user || user.role !== 'client') {
    return (
      <AppLayout>
        <EmptyState
          title="Access Denied"
          description="You must be logged in as a client to view this page."
          action={<Button as="Link" to="/login">Sign In</Button>}
        />
      </AppLayout>
    )
  }

  return (
    <AppLayout>
      <div className="space-y-6">
        <PageHeader
          title={`Welcome back, ${user.first_name || 'Client'}!`}
          subtitle="Here's an overview of your property search activity."
          action={
            <Button as="Link" to="/properties" variant="outline">
              Browse Properties
            </Button>
          }
        />

        {isLoading ? (
          <LoadingState />
        ) : error ? (
          <ErrorState message={error} onRetry={refetch} />
        ) : data ? (
          <>
            {/* Metric Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              <MetricCard
                title="Active Search Requests"
                value={data.activeSearchRequests}
                href="/client/search-requests"
                icon={<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>}
                iconBg="bg-blue-50"
                iconColor="text-blue-600"
              />
              <MetricCard
                title="Agent Matches"
                value={data.agentMatches}
                href="/client/matches"
                icon={<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" /></svg>}
                iconBg="bg-cyan-50"
                iconColor="text-cyan-600"
              />
              <MetricCard
                title="Favorites"
                value={data.favoriteCount}
                href="/client/favorites"
                icon={<svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" /></svg>}
                iconBg="bg-red-50"
                iconColor="text-red-600"
              />
              <MetricCard
                title="Saved Searches"
                value={data.savedSearchCount}
                href="/client/saved-searches"
                icon={<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" /></svg>}
                iconBg="bg-indigo-50"
                iconColor="text-indigo-600"
              />
              <MetricCard
                title="Upcoming Appointments"
                value={data.upcomingAppointments}
                href="/client/appointments"
                icon={<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>}
                iconBg="bg-green-50"
                iconColor="text-green-600"
              />
              <MetricCard
                title="Unread Notifications"
                value={data.unreadNotificationCount}
                href="/client/notifications"
                icon={<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>}
                iconBg="bg-amber-50"
                iconColor="text-amber-600"
              />
              <MetricCard
                title="Active Conversations"
                value={data.activeConversationCount}
                href="/client/conversations"
                icon={<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>}
                iconBg="bg-purple-50"
                iconColor="text-purple-600"
              />
            </div>

            {/* Quick Actions */}
            <Card>
              <SectionHeader title="Quick Actions" />
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <Button as="Link" to="/properties" variant="outline" className="justify-start">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  Browse Properties
                </Button>
                <Button as="Link" to="/client/search-requests/new" variant="outline" className="justify-start">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Create Search Request
                </Button>
                <Button as="Link" to="/client/matches" variant="outline" className="justify-start">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  Find Agents
                </Button>
              </div>
            </Card>

            {/* Recent Activity */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Recent Conversations */}
              <Card>
                <SectionHeader
                  title="Recent Conversations"
                  action={
                    <Link to="/client/conversations" className="text-sm font-medium text-primary-600 hover:text-primary-700">
                      View all
                    </Link>
                  }
                />
                {(data.recentConversations ?? []).length === 0 ? (
                  <EmptyState
                    title="No messages yet"
                    description="Browse properties and contact an agent to start a conversation."
                    action={
                      <Button as="Link" to="/properties" size="sm">
                        Browse Properties
                      </Button>
                    }
                  />
                ) : (
                  <div className="space-y-3">
                    {data.recentConversations.map((conv) => (
                      <Link
                        key={conv.id}
                        to={`/client/conversations/${conv.id}`}
                        className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 transition-colors group"
                      >
                        <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center text-primary-600 font-semibold text-sm flex-shrink-0">
                          {(conv.subject || 'A').charAt(0).toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">{conv.subject || 'Conversation'}</p>
                          <p className="text-xs text-gray-500 truncate">{conv.property_id ? 'Linked to a property' : 'General inquiry'}</p>
                        </div>
                        <span className="text-xs text-gray-400 flex-shrink-0">{relativeTime(conv.updated_at)}</span>
                      </Link>
                    ))}
                  </div>
                )}
              </Card>

              {/* Upcoming Appointments */}
              <Card>
                <SectionHeader
                  title="Upcoming Appointments"
                  action={
                    <Link to="/client/appointments" className="text-sm font-medium text-primary-600 hover:text-primary-700">
                      View all
                    </Link>
                  }
                />
                {(data.recentAppointments ?? []).length === 0 ? (
                  <EmptyState
                    title="No upcoming appointments"
                    description="Schedule a property viewing with an agent."
                    action={
                      <Button as="Link" to="/properties" size="sm">
                        Browse Properties
                      </Button>
                    }
                  />
                ) : (
                  <div className="space-y-3">
                    {data.recentAppointments.map((appt) => (
                      <Link
                        key={appt.id}
                        to={appt.property ? `/properties/${appt.property.id}` : '/client/appointments'}
                        className="flex items-center justify-between p-3 rounded-xl hover:bg-gray-50 transition-colors group"
                      >
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">
                            {appt.property ? appt.property.title : 'Viewing appointment'}
                          </p>
                          <p className="text-xs text-gray-500">
                            {new Date(appt.scheduled_start).toLocaleString([], {
                              weekday: 'short',
                              month: 'short',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </p>
                        </div>
                        <StatusBadge status={appt.status} type="appointment" />
                      </Link>
                    ))}
                  </div>
                )}
              </Card>
            </div>
          </>
        ) : null}
      </div>
    </AppLayout>
  )
}
