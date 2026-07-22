import { useState, useEffect, useCallback } from 'react'
import AppLayout from '../../components/layout/AppLayout'
import { adminAnalyticsApi, DashboardOverviewResponse, AgentAnalyticsItem } from '../../lib/adminAnalyticsApi'
import { adminAppointmentsApi, AppointmentResponse } from '../../lib/adminAppointmentsApi'
import { extractApiError } from '../../utils/format'
import { LoadingState, ErrorState, DataTable } from '../../components/ui/shared'

const iconPaths = {
  users: 'M17 20h5v-2a4 4 0 00-4-4h-1M9 20H2v-2a4 4 0 014-4h3m6-5a4 4 0 11-8 0 4 4 0 018 0z',
  agents: 'M16 21v-2a4 4 0 00-4-4H6a4 4 0 00-4 4v2m7-10a4 4 0 100-8 4 4 0 000 8zm8 0v6m3-3h-6',
  properties: 'M3 21h18M5 21V7l7-4 7 4v14M9 9h2m2 0h2M9 13h2m2 0h2m-6 8v-4h6v4',
  calendar: 'M8 7V3m8 4V3M5 11h14M5 5h14a2 2 0 012 2v12a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2z',
  message: 'M21 15a4 4 0 01-4 4H8l-5 3V7a4 4 0 014-4h10a4 4 0 014 4v8zM8 9h8m-8 4h5',
  chart: 'M4 19V9m5 10V5m5 14v-7m5 7V3',
  map: 'M9 18l-6 3V6l6-3 6 3 6-3v15l-6 3-6-3zm0 0V3m6 18V6',
  book: 'M4 19.5A2.5 2.5 0 016.5 17H20V3H6.5A2.5 2.5 0 004 5.5v14zm0 0A2.5 2.5 0 006.5 22H20',
}

function Icon({ name, className = 'w-5 h-5' }: { name: keyof typeof iconPaths; className?: string }) {
  return <svg className={className} fill='none' stroke='currentColor' viewBox='0 0 24 24' aria-hidden='true'><path strokeLinecap='round' strokeLinejoin='round' strokeWidth={1.8} d={iconPaths[name]} /></svg>
}

export default function AdminDashboard() {
  const [overview, setOverview] = useState<DashboardOverviewResponse | null>(null)
  const [appointments, setAppointments] = useState<AppointmentResponse[]>([])
  const [agents, setAgents] = useState<AgentAnalyticsItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isLoadingSections, setIsLoadingSections] = useState(false)
  const [error, setError] = useState<string | null>(null)
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
      if (appointmentsResult.status === 'fulfilled') setAppointments(appointmentsResult.value)
      else setSectionError(extractApiError(appointmentsResult.reason) || 'Recent appointments could not be loaded.')
      if (agentsResult.status === 'fulfilled') setAgents(agentsResult.value.agents)
      else setSectionError(extractApiError(agentsResult.reason) || 'Agent performance could not be loaded.')
    } catch (err) {
      setError(extractApiError(err) || 'Failed to load dashboard overview')
    } finally {
      setIsLoading(false)
      setIsLoadingSections(false)
    }
  }, [])

  useEffect(() => { loadDashboard() }, [loadDashboard])

  if (isLoading) return <AppLayout><LoadingState message='Loading dashboard...' /></AppLayout>
  if (error) return <AppLayout><ErrorState message={error} onRetry={loadDashboard} /></AppLayout>
  if (!overview) return null

  const activePropertyRate = overview.total_properties ? Math.round((overview.available_properties / overview.total_properties) * 100) : 0
  const completionRate = overview.total_appointments ? Math.round((overview.completed_appointments / overview.total_appointments) * 100) : 0

  return (
    <AppLayout>
      <div className='mx-auto max-w-[1500px] space-y-7'>
        <section className='relative overflow-hidden rounded-3xl bg-navy-900 px-6 py-7 text-white shadow-card-lg sm:px-8'>
          <div className='absolute -right-20 -top-24 h-64 w-64 rounded-full bg-primary-500/20 blur-3xl' />
          <div className='absolute bottom-0 right-1/3 h-32 w-32 rounded-full bg-blue-400/10 blur-2xl' />
          <div className='relative flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between'>
            <div>
              <div className='mb-3 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-3 py-1 text-xs font-medium text-slate-200'>
                <span className='h-2 w-2 rounded-full bg-success-400' /> Live platform overview
              </div>
              <h1 className='text-3xl font-semibold tracking-tight sm:text-4xl'>Good to see you, Manager</h1>
              <p className='mt-2 max-w-2xl text-sm leading-6 text-slate-300'>Monitor portfolio performance, client demand, agent activity and daily operations from one place.</p>
            </div>
            <div className='flex flex-wrap gap-3'>
              <a href='/admin/analytics' className='inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2.5 text-sm font-semibold text-navy-900 shadow-sm transition hover:bg-slate-100'><Icon name='chart' />View analytics</a>
              <button type='button' onClick={loadDashboard} className='inline-flex items-center gap-2 rounded-xl border border-white/20 bg-white/10 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-white/20'>
                <svg className='h-4 w-4' fill='none' stroke='currentColor' viewBox='0 0 24 24'><path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M4 4v6h6M20 20v-6h-6M5.5 15a7 7 0 0012 2M18.5 9a7 7 0 00-12-2' /></svg>
                Refresh
              </button>
            </div>
          </div>
        </section>

        {sectionError && <div className='rounded-xl border border-warning-200 bg-warning-50 px-4 py-3 text-sm text-warning-800' role='alert'>{sectionError}</div>}

        <section className='grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4'>
          <KpiCard label='Total users' value={overview.total_users} detail={`${overview.total_clients} clients`} icon='users' href='/admin/users' tone='blue' />
          <KpiCard label='Active agents' value={overview.active_agents} detail={`${overview.total_agents} registered`} icon='agents' href='/admin/agents' tone='violet' />
          <KpiCard label='Properties' value={overview.total_properties} detail={`${activePropertyRate}% available`} icon='properties' href='/admin/properties' tone='green' />
          <KpiCard label='Upcoming visits' value={overview.upcoming_appointments} detail={`${overview.total_appointments} total`} icon='calendar' href='/admin/appointments' tone='orange' />
        </section>

        <section className='grid grid-cols-1 gap-6 xl:grid-cols-3'>
          <div className='rounded-2xl border border-slate-200 bg-white p-6 shadow-card xl:col-span-2'>
            <PanelHeading title='Portfolio health' subtitle='Current status of all property listings' action={<a href='/admin/properties' className='text-sm font-semibold text-primary-600 hover:text-primary-700'>Manage properties</a>} />
            <PropertyStatusDistribution overview={overview} />
          </div>
          <div className='rounded-2xl border border-slate-200 bg-white p-6 shadow-card'>
            <PanelHeading title='Lead quality' subtitle='Qualification of active demand' action={<span className='rounded-lg bg-navy-50 px-2.5 py-1 text-xs font-semibold text-navy-700'>Avg. {Math.round(overview.average_lead_score ?? 0)}</span>} />
            <LeadQualificationSummary overview={overview} />
          </div>
        </section>

        <section className='grid grid-cols-1 gap-6 lg:grid-cols-3'>
          <OperationalCard title='Client engagement' icon='message' metrics={[
            ['Active conversations', overview.active_conversations], ['Total messages', overview.total_messages], ['Saved searches', overview.active_saved_searches], ['Favorites', overview.total_favorites],
          ]} href='/admin/conversations' />
          <OperationalCard title='Appointments' icon='calendar' metrics={[
            ['Upcoming', overview.upcoming_appointments], ['Completed', overview.completed_appointments], ['Cancelled', overview.cancelled_appointments], ['Completion rate', `${completionRate}%`],
          ]} href='/admin/appointments' />
          <OperationalCard title='Client demand' icon='chart' metrics={[
            ['Search requests', overview.total_client_search_requests], ['Active requests', overview.active_client_search_requests], ['Hot leads', overview.total_hot_leads], ['Unread alerts', overview.unread_notifications],
          ]} href='/admin/analytics' />
        </section>

        <section className='grid grid-cols-1 gap-6 2xl:grid-cols-2'>
          <div className='min-w-0 rounded-2xl border border-slate-200 bg-white p-5 shadow-card'>
            <PanelHeading title='Recent appointments' subtitle='Latest scheduled client visits' action={<a href='/admin/appointments' className='text-sm font-semibold text-primary-600'>View all</a>} />
            <RecentAppointmentsTable appointments={appointments} isLoading={isLoadingSections} />
          </div>
          <div className='min-w-0 rounded-2xl border border-slate-200 bg-white p-5 shadow-card'>
            <PanelHeading title='Top performing agents' subtitle='Ranked by active portfolio size' action={<a href='/admin/agents' className='text-sm font-semibold text-primary-600'>View all</a>} />
            <TopAgentsTable agents={agents} isLoading={isLoadingSections} />
          </div>
        </section>

        <section>
          <PanelHeading title='Quick actions' subtitle='Jump directly to frequently used manager tools' />
          <div className='grid grid-cols-2 gap-3 sm:grid-cols-4 xl:grid-cols-8'>
            <QuickLink label='Users' href='/admin/users' icon='users' />
            <QuickLink label='Agents' href='/admin/agents' icon='agents' />
            <QuickLink label='Properties' href='/admin/properties' icon='properties' />
            <QuickLink label='Analytics' href='/admin/analytics' icon='chart' />
            <QuickLink label='Heat map' href='/admin/analytics/heat-map' icon='map' />
            <QuickLink label='Appointments' href='/admin/appointments' icon='calendar' />
            <QuickLink label='Messages' href='/admin/conversations' icon='message' />
            <QuickLink label='Knowledge' href='/admin/knowledge-base' icon='book' />
          </div>
        </section>
      </div>
    </AppLayout>
  )
}

const toneClasses = {
  blue: 'bg-blue-50 text-blue-600 ring-blue-100', violet: 'bg-violet-50 text-violet-600 ring-violet-100',
  green: 'bg-success-50 text-success-600 ring-success-100', orange: 'bg-warning-50 text-warning-600 ring-warning-100',
}

function KpiCard({ label, value, detail, icon, href, tone }: { label: string; value: number; detail: string; icon: keyof typeof iconPaths; href: string; tone: keyof typeof toneClasses }) {
  return <a href={href} className='group rounded-2xl border border-slate-200 bg-white p-5 shadow-card transition duration-200 hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-card-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500'>
    <div className='flex items-start justify-between'><div className={`flex h-11 w-11 items-center justify-center rounded-xl ring-1 ${toneClasses[tone]}`}><Icon name={icon} /></div><svg className='h-4 w-4 text-slate-300 transition group-hover:translate-x-0.5 group-hover:text-slate-500' fill='none' stroke='currentColor' viewBox='0 0 24 24'><path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M9 5l7 7-7 7' /></svg></div>
    <p className='mt-5 text-3xl font-semibold tracking-tight text-navy-900'>{value.toLocaleString()}</p><p className='mt-1 text-sm font-medium text-slate-600'>{label}</p><p className='mt-2 text-xs text-slate-400'>{detail}</p>
  </a>
}

function PanelHeading({ title, subtitle, action }: { title: string; subtitle?: string; action?: React.ReactNode }) {
  return <div className='mb-5 flex items-start justify-between gap-4'><div><h2 className='text-lg font-semibold text-navy-900'>{title}</h2>{subtitle && <p className='mt-1 text-sm text-slate-500'>{subtitle}</p>}</div>{action}</div>
}

function OperationalCard({ title, icon, metrics, href }: { title: string; icon: keyof typeof iconPaths; metrics: [string, number | string][]; href: string }) {
  return <div className='rounded-2xl border border-slate-200 bg-white p-5 shadow-card'><div className='mb-5 flex items-center justify-between'><div className='flex items-center gap-3'><span className='flex h-10 w-10 items-center justify-center rounded-xl bg-navy-50 text-navy-700'><Icon name={icon} /></span><h2 className='font-semibold text-navy-900'>{title}</h2></div><a href={href} className='text-xs font-semibold text-primary-600'>Details</a></div><div className='grid grid-cols-2 gap-px overflow-hidden rounded-xl bg-slate-200 ring-1 ring-slate-200'>{metrics.map(([label, value]) => <div key={label} className='bg-slate-50 p-4'><p className='text-xl font-semibold text-navy-900'>{typeof value === 'number' ? value.toLocaleString() : value}</p><p className='mt-1 text-xs text-slate-500'>{label}</p></div>)}</div></div>
}

function QuickLink({ label, href, icon }: { label: string; href: string; icon: keyof typeof iconPaths }) {
  return <a href={href} className='group flex min-h-24 flex-col items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white p-3 text-center shadow-card transition hover:-translate-y-0.5 hover:border-primary-200 hover:shadow-card-hover'><span className='flex h-10 w-10 items-center justify-center rounded-xl bg-navy-50 text-navy-700 transition group-hover:bg-primary-50 group-hover:text-primary-600'><Icon name={icon} /></span><span className='text-xs font-semibold text-slate-700'>{label}</span></a>
}

function PropertyStatusDistribution({ overview }: { overview: DashboardOverviewResponse }) {
  const statuses = [
    { label: 'Available', value: overview.available_properties, color: 'bg-success-500', text: 'text-success-600' },
    { label: 'Reserved', value: overview.reserved_properties, color: 'bg-warning-500', text: 'text-warning-600' },
    { label: 'Sold', value: overview.sold_properties, color: 'bg-primary-500', text: 'text-primary-600' },
    { label: 'Rented', value: overview.rented_properties, color: 'bg-blue-500', text: 'text-blue-600' },
    { label: 'Archived', value: overview.archived_properties, color: 'bg-slate-400', text: 'text-slate-500' },
  ]
  const total = statuses.reduce((sum, item) => sum + item.value, 0)
  return <div><div className='flex h-3 overflow-hidden rounded-full bg-slate-100'>{statuses.map(item => <div key={item.label} className={item.color} style={{ width: `${total ? (item.value / total) * 100 : 0}%` }} title={`${item.label}: ${item.value}`} />)}</div><div className='mt-6 grid grid-cols-2 gap-3 sm:grid-cols-5'>{statuses.map(item => <div key={item.label} className='rounded-xl bg-slate-50 p-3'><div className='flex items-center gap-2'><span className={`h-2 w-2 rounded-full ${item.color}`} /><span className='text-xs text-slate-500'>{item.label}</span></div><p className={`mt-2 text-xl font-semibold ${item.text}`}>{item.value}</p></div>)}</div></div>
}

function LeadQualificationSummary({ overview }: { overview: DashboardOverviewResponse }) {
  const levels = [{ label: 'Hot', value: overview.total_hot_leads, color: 'bg-primary-500', text: 'text-primary-600' }, { label: 'Warm', value: overview.total_warm_leads, color: 'bg-warning-500', text: 'text-warning-600' }, { label: 'Cold', value: overview.total_cold_leads, color: 'bg-blue-500', text: 'text-blue-600' }]
  const total = levels.reduce((sum, item) => sum + item.value, 0)
  return <div className='space-y-4'>{levels.map(item => { const pct = total ? Math.round((item.value / total) * 100) : 0; return <div key={item.label}><div className='mb-2 flex items-center justify-between text-sm'><span className='font-medium text-slate-600'>{item.label}</span><span className={`font-semibold ${item.text}`}>{item.value} <span className='font-normal text-slate-400'>({pct}%)</span></span></div><div className='h-2 overflow-hidden rounded-full bg-slate-100'><div className={`h-full rounded-full ${item.color}`} style={{ width: `${pct}%` }} /></div></div> })}</div>
}

function RecentAppointmentsTable({ appointments, isLoading }: { appointments: AppointmentResponse[]; isLoading: boolean }) {
  const columns = [
    { key: 'client', header: 'Client', render: (a: AppointmentResponse) => <span className='font-medium'>{a.client.first_name} {a.client.last_name}</span> },
    { key: 'property', header: 'Property', render: (a: AppointmentResponse) => a.property?.title || '-' },
    { key: 'start', header: 'Date', render: (a: AppointmentResponse) => new Date(a.scheduled_start).toLocaleDateString([], { month: 'short', day: 'numeric' }) },
    { key: 'status', header: 'Status', render: (a: AppointmentResponse) => <span className='rounded-full bg-navy-50 px-2 py-1 text-xs font-medium capitalize text-navy-700'>{a.status}</span> },
  ]
  return <DataTable columns={columns} rows={appointments} keyExtractor={a => a.id} isLoading={isLoading} loadingMessage='Loading appointments...' emptyTitle='No recent appointments' className='border-0 shadow-none' />
}

function TopAgentsTable({ agents, isLoading }: { agents: AgentAnalyticsItem[]; isLoading: boolean }) {
  const columns = [
    { key: 'name', header: 'Agent', render: (a: AgentAnalyticsItem) => <div className='flex items-center gap-2'><span className='flex h-8 w-8 items-center justify-center rounded-full bg-primary-50 text-xs font-bold text-primary-600'>{a.first_name[0]}{a.last_name[0]}</span><span className='font-medium'>{a.first_name} {a.last_name}</span></div> },
    { key: 'listings', header: 'Listings', render: (a: AgentAnalyticsItem) => a.total_listings },
    { key: 'closed', header: 'Closed', render: (a: AgentAnalyticsItem) => a.sold_listings + a.rented_listings },
    { key: 'appointments', header: 'Visits', render: (a: AgentAnalyticsItem) => a.appointment_count },
  ]
  return <DataTable columns={columns} rows={agents} keyExtractor={a => a.agent_id} isLoading={isLoading} loadingMessage='Loading agents...' emptyTitle='No agent data' className='border-0 shadow-none' />
}
