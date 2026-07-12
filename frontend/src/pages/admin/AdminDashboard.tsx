import { useState, useEffect, useCallback } from 'react'
import AppLayout from '../../components/layout/AppLayout'
import {
  adminAnalyticsApi,
  DashboardOverviewResponse,
  AgentAnalyticsItem,
} from '../../lib/adminAnalyticsApi'
import { adminAppointmentsApi, AppointmentResponse } from '../../lib/adminAppointmentsApi'
import { extractApiError } from '../../utils/format'
import {
  PageHeader,
  MetricCard,
  LoadingState,
  ErrorState,
  Card,
  SectionHeader,
  DataTable,
} from '../../components/ui/shared'
import Button from '../../components/ui/Button'

export default function AdminDashboard() {
  const [overview, setOverview] = useState<DashboardOverviewResponse | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [retryCount, setRetryCount] = useState(0)

  const [appointments, setAppointments] = useState<AppointmentResponse[]>([])
  const [agents, setAgents] = useState<AgentAnalyticsItem[]>([])
  const [isLoadingSections, setIsLoadingSections] = useState(false)
  const [sectionError, setSectionError] = useState<string | null>(null)

  const loadDashboard = useCallback(async () => {
    setIsLoading(true)
    setIsLoadingSections(true)
    setError(null)
    setSectionError(null)

    try {
      const overviewData = await adminAnalyticsApi.getOverview()
      setOverview(overviewData)

      const [appointmentsResult, agentsResult] = await Promise.allSettled([
        adminAppointmentsApi.getAllAppointments({ limit: 5 }),
        adminAnalyticsApi.getAgentAnalytics({ limit: 5, order_by: 'total_listings' }),
      ])

      if (appointmentsResult.status === 'fulfilled') {
        setAppointments(appointmentsResult.value)
      } else {
        setSectionError(extractApiError(appointmentsResult.reason) || 'Failed to load recent appointments')
      }

      if (agentsResult.status === 'fulfilled') {
        setAgents(agentsResult.value.agents)
      } else {
        setSectionError(extractApiError(agentsResult.reason) || 'Failed to load top agents')
      }
    } catch (err) {
      setError(extractApiError(err) || 'Failed to load dashboard overview')
    } finally {
      setIsLoading(false)
      setIsLoadingSections(false)
    }
  }, [])

  useEffect(() => {
    loadDashboard()
  }, [loadDashboard, retryCount])

  const handleRetry = () => {
    setRetryCount((prev) => prev + 1)
  }

  if (isLoading) {
    return (
      <AppLayout>
        <LoadingState message='Loading dashboard…' />
      </AppLayout>
    )
  }

  if (error) {
    return (
      <AppLayout>
        <ErrorState message={error} onRetry={handleRetry} />
      </AppLayout>
    )
  }

  return (
    <AppLayout>
      <div className='space-y-6'>
        <PageHeader
          title='Manager Dashboard'
          subtitle='Real-time overview of platform performance and lead activity'
          action={
            <Button type='button' onClick={handleRetry} variant='secondary'>
              Refresh
            </Button>
          }
        />

        {sectionError && (
          <div
            className='bg-accent-50 border border-accent-200 text-accent-700 px-4 py-3 rounded-xl text-sm'
            role='alert'
            aria-live='polite'
          >
            {sectionError}
          </div>
        )}

        {overview && (
          <>
            <Section title='Users'>
              <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
                <MetricCard title='Total Users' value={overview.total_users} href='/admin/users' />
                <MetricCard title='Total Clients' value={overview.total_clients} href='/admin/users' />
                <MetricCard title='Total Agents' value={overview.total_agents} href='/admin/agents' />
              </div>
            </Section>

            <Section title='Agents'>
              <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                <MetricCard title='Active Agents' value={overview.active_agents} href='/admin/agents' />
                <MetricCard title='Clients with Search Requests' value={overview.total_client_search_requests} />
              </div>
            </Section>

            <Section title='Properties'>
              <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
                <MetricCard title='Total Properties' value={overview.total_properties} href='/admin/properties' />
                <MetricCard title='Available' value={overview.available_properties} href='/admin/properties' />
                <MetricCard title='Reserved' value={overview.reserved_properties} href='/admin/properties' />
              </div>
              <div className='grid grid-cols-1 md:grid-cols-3 gap-4 mt-4'>
                <MetricCard title='Sold' value={overview.sold_properties} href='/admin/properties' />
                <MetricCard title='Rented' value={overview.rented_properties} href='/admin/properties' />
                <MetricCard title='Archived' value={overview.archived_properties} href='/admin/properties' />
              </div>
            </Section>

            <div className='grid grid-cols-1 lg:grid-cols-2 gap-6'>
              <Card>
                <SectionHeader title='Property Status Distribution' />
                <PropertyStatusDistribution overview={overview} />
              </Card>

              <Card>
                <SectionHeader title='Lead Qualification Summary' />
                <LeadQualificationSummary overview={overview} />
              </Card>
            </div>

            <Section title='Appointments'>
              <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
                <MetricCard title='Total Appointments' value={overview.total_appointments} href='/admin/appointments' />
                <MetricCard title='Upcoming' value={overview.upcoming_appointments} href='/admin/appointments' />
                <MetricCard title='Completed' value={overview.completed_appointments} href='/admin/appointments' />
              </div>
            </Section>

            <Section title='Engagement'>
              <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
                <MetricCard title='Active Conversations' value={overview.active_conversations} href='/admin/conversations' />
                <MetricCard title='Total Favorites' value={overview.total_favorites} />
                <MetricCard title='Active Saved Searches' value={overview.active_saved_searches} />
              </div>
            </Section>

            <Section title='Leads'>
              <div className='grid grid-cols-1 md:grid-cols-4 gap-4'>
                <MetricCard title='Hot Leads' value={overview.total_hot_leads} href='/admin/analytics' />
                <MetricCard title='Warm Leads' value={overview.total_warm_leads} href='/admin/analytics' />
                <MetricCard title='Cold Leads' value={overview.total_cold_leads} href='/admin/analytics' />
                <MetricCard title='Avg Lead Score' value={overview.average_lead_score ?? 0} href='/admin/analytics' />
              </div>
            </Section>

            <div className='grid grid-cols-1 lg:grid-cols-2 gap-6'>
              <Card>
                <SectionHeader title='Recent Appointments' />
                <RecentAppointmentsTable appointments={appointments} isLoading={isLoadingSections} />
              </Card>

              <Card>
                <SectionHeader title='Top Performing Agents' />
                <TopAgentsTable agents={agents} isLoading={isLoadingSections} />
              </Card>
            </div>

            <Card>
              <SectionHeader title='Quick Links' />
              <div className='grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3'>
                <QuickLink label='Manage Users' href='/admin/users' />
                <QuickLink label='Manage Agents' href='/admin/agents' />
                <QuickLink label='Manage Properties' href='/admin/properties' />
                <QuickLink label='View Analytics' href='/admin/analytics' />
                <QuickLink label='Heat Map' href='/admin/analytics/heat-map' />
                <QuickLink label='Appointments' href='/admin/appointments' />
                <QuickLink label='Conversations' href='/admin/conversations' />
                <QuickLink label='Knowledge Base' href='/admin/knowledge-base' />
              </div>
            </Card>
          </>
        )}
      </div>
    </AppLayout>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className='space-y-3'>
      <h2 className='text-base font-semibold text-gray-900'>{title}</h2>
      {children}
    </div>
  )
}

function QuickLink({ label, href }: { label: string; href: string }) {
  return (
    <a
      href={href}
      className='block px-4 py-3 bg-primary-50 text-primary-700 rounded-xl hover:bg-primary-100 transition-colors text-sm font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2'
    >
      {label}
    </a>
  )
}

function PropertyStatusDistribution({ overview }: { overview: DashboardOverviewResponse }) {
  const statuses = [
    { key: 'available', label: 'Available', value: overview.available_properties, color: 'bg-success-500' },
    { key: 'reserved', label: 'Reserved', value: overview.reserved_properties, color: 'bg-warning-500' },
    { key: 'sold', label: 'Sold', value: overview.sold_properties, color: 'bg-primary-500' },
    { key: 'rented', label: 'Rented', value: overview.rented_properties, color: 'bg-info-500' },
    { key: 'archived', label: 'Archived', value: overview.archived_properties, color: 'bg-gray-400' },
  ]
  const total = statuses.reduce((sum, s) => sum + s.value, 0)

  return (
    <div className='space-y-4'>
      {total === 0 ? (
        <p className='text-sm text-gray-500'>No properties recorded yet.</p>
      ) : (
        <>
          <div className='h-4 w-full rounded-full overflow-hidden bg-gray-100 flex' aria-label='Property status distribution'>
            {statuses.map((s) => {
              const pct = total ? (s.value / total) * 100 : 0
              return (
                <div
                  key={s.key}
                  className={`h-full ${s.color}`}
                  style={{ width: `${pct}%` }}
                  title={`${s.label}: ${s.value}`}
                />
              )
            })}
          </div>
          <div className='grid grid-cols-2 gap-3'>
            {statuses.map((s) => (
              <div key={s.key} className='flex items-center justify-between text-sm'>
                <div className='flex items-center gap-2'>
                  <div className={`w-3 h-3 rounded-full ${s.color}`} />
                  <span className='text-gray-600'>{s.label}</span>
                </div>
                <span className='font-semibold text-gray-900'>{s.value}</span>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  )
}

function LeadQualificationSummary({ overview }: { overview: DashboardOverviewResponse }) {
  const levels = [
    { key: 'hot', label: 'Hot', value: overview.total_hot_leads, color: 'bg-accent-500' },
    { key: 'warm', label: 'Warm', value: overview.total_warm_leads, color: 'bg-warning-500' },
    { key: 'cold', label: 'Cold', value: overview.total_cold_leads, color: 'bg-primary-500' },
  ]
  const total = levels.reduce((sum, l) => sum + l.value, 0)

  return (
    <div className='space-y-4'>
      {total === 0 ? (
        <p className='text-sm text-gray-500'>No leads scored yet.</p>
      ) : (
        <>
          <div className='h-4 w-full rounded-full overflow-hidden bg-gray-100 flex' aria-label='Lead qualification distribution'>
            {levels.map((l) => {
              const pct = total ? (l.value / total) * 100 : 0
              return (
                <div
                  key={l.key}
                  className={`h-full ${l.color}`}
                  style={{ width: `${pct}%` }}
                  title={`${l.label}: ${l.value}`}
                />
              )
            })}
          </div>
          <div className='grid grid-cols-3 gap-3'>
            {levels.map((l) => (
              <div key={l.key} className='text-center p-3 rounded-xl bg-gray-50'>
                <p className={`text-2xl font-bold ${l.color.replace('bg-', 'text-')}`}>{l.value}</p>
                <p className='text-xs text-gray-500'>{l.label}</p>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  )
}

function RecentAppointmentsTable({
  appointments,
  isLoading,
}: {
  appointments: AppointmentResponse[]
  isLoading: boolean
}) {
  const columns = [
    {
      key: 'client',
      header: 'Client',
      render: (a: AppointmentResponse) => `${a.client.first_name} ${a.client.last_name}`,
    },
    {
      key: 'agent',
      header: 'Agent',
      render: (a: AppointmentResponse) => a.agent?.user ? `${a.agent.user.first_name} ${a.agent.user.last_name}` : '—',
    },
    {
      key: 'property',
      header: 'Property',
      render: (a: AppointmentResponse) => a.property?.title || '—',
    },
    {
      key: 'start',
      header: 'Start',
      render: (a: AppointmentResponse) => new Date(a.scheduled_start).toLocaleString(),
    },
    {
      key: 'status',
      header: 'Status',
      render: (a: AppointmentResponse) => (
        <span className='px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-700 capitalize'>
          {a.status}
        </span>
      ),
    },
  ]

  return (
    <DataTable
      columns={columns}
      rows={appointments}
      keyExtractor={(a) => a.id}
      isLoading={isLoading}
      loadingMessage='Loading appointments…'
      emptyTitle='No recent appointments'
      emptyDescription='Appointments will appear here once scheduled.'
    />
  )
}

function TopAgentsTable({
  agents,
  isLoading,
}: {
  agents: AgentAnalyticsItem[]
  isLoading: boolean
}) {
  const columns = [
    {
      key: 'name',
      header: 'Agent',
      render: (a: AgentAnalyticsItem) => `${a.first_name} ${a.last_name}`,
    },
    { key: 'listings', header: 'Listings', render: (a: AgentAnalyticsItem) => a.total_listings },
    { key: 'sold', header: 'Sold', render: (a: AgentAnalyticsItem) => a.sold_listings },
    { key: 'rented', header: 'Rented', render: (a: AgentAnalyticsItem) => a.rented_listings },
    { key: 'appointments', header: 'Appointments', render: (a: AgentAnalyticsItem) => a.appointment_count },
    { key: 'conversations', header: 'Conversations', render: (a: AgentAnalyticsItem) => a.conversation_count },
  ]

  return (
    <DataTable
      columns={columns}
      rows={agents}
      keyExtractor={(a) => a.agent_id}
      isLoading={isLoading}
      loadingMessage='Loading agents…'
      emptyTitle='No agent data'
      emptyDescription='Agent performance will appear here once agents are active.'
    />
  )
}
