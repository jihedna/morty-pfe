import { useState, useEffect, useCallback } from 'react'
import AppLayout from '../../components/layout/AppLayout'
import {
  adminAnalyticsApi,
  DashboardOverviewResponse,
  PropertyAnalyticsResponse,
  AgentAnalyticsResponse,
  ClientAnalyticsResponse,
  AppointmentAnalyticsResponse,
  EngagementAnalyticsResponse,
  LeadAnalyticsResponse,
  TimeSeriesResponse,
  HeatMapPoint,
} from '../../lib/adminAnalyticsApi'
import { extractApiError } from '../../utils/format'
import {
  DataTable,
  PageHeader,
  LoadingState,
  ErrorState,
  Card,
  MetricCard,
  FilterPanel,
  EmptyState,
  SectionHeader,
} from '../../components/ui/shared'
import Input from '../../components/ui/Input'
import Select from '../../components/ui/Select'
import Button from '../../components/ui/Button'

type Tab =
  | 'overview'
  | 'properties'
  | 'agents'
  | 'clients'
  | 'appointments'
  | 'engagement'
  | 'leads'
  | 'heat-map'
  | 'time-series'

const TABS: { id: Tab; label: string }[] = [
  { id: 'overview', label: 'Overview' },
  { id: 'properties', label: 'Properties' },
  { id: 'agents', label: 'Agents' },
  { id: 'clients', label: 'Clients' },
  { id: 'appointments', label: 'Appointments' },
  { id: 'engagement', label: 'Engagement' },
  { id: 'leads', label: 'Leads' },
  { id: 'heat-map', label: 'Heat Map' },
  { id: 'time-series', label: 'Time Series' },
]

const METRIC_OPTIONS = [
  { value: 'properties', label: 'Properties Created' },
  { value: 'appointments', label: 'Appointments' },
  { value: 'conversations', label: 'Conversations' },
  { value: 'messages', label: 'Messages' },
  { value: 'users', label: 'New Users' },
  { value: 'favorites', label: 'Favorites' },
  { value: 'saved_searches', label: 'Saved Searches' },
]

const INTERVAL_OPTIONS = [
  { value: 'day', label: 'Day' },
  { value: 'week', label: 'Week' },
  { value: 'month', label: 'Month' },
]

function formatCurrency(n: number | null | undefined): string {
  if (n === null || n === undefined) return '—'
  return n.toLocaleString() + ' TND'
}

function demandBadge(level: string) {
  const color =
    level === 'high'
      ? 'bg-accent-100 text-accent-700 border-accent-200'
      : level === 'medium'
      ? 'bg-warning-100 text-warning-700 border-warning-200'
      : level === 'low'
      ? 'bg-success-100 text-success-700 border-success-200'
      : 'bg-gray-100 text-gray-700 border-gray-200'
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize border ${color}`}>
      {level}
    </span>
  )
}

function trendBadge(trend: string) {
  const color =
    trend === 'rising'
      ? 'bg-accent-100 text-accent-700 border-accent-200'
      : trend === 'stable'
      ? 'bg-warning-100 text-warning-700 border-warning-200'
      : trend === 'falling'
      ? 'bg-success-100 text-success-700 border-success-200'
      : 'bg-gray-100 text-gray-700 border-gray-200'
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize border ${color}`}>
      {trend}
    </span>
  )
}

export default function AdminAnalytics() {
  const [activeTab, setActiveTab] = useState<Tab>('properties')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')

  const [overview, setOverview] = useState<DashboardOverviewResponse | null>(null)
  const [propertyAnalytics, setPropertyAnalytics] = useState<PropertyAnalyticsResponse | null>(null)
  const [agentAnalytics, setAgentAnalytics] = useState<AgentAnalyticsResponse | null>(null)
  const [clientAnalytics, setClientAnalytics] = useState<ClientAnalyticsResponse | null>(null)
  const [appointmentAnalytics, setAppointmentAnalytics] = useState<AppointmentAnalyticsResponse | null>(null)
  const [engagementAnalytics, setEngagementAnalytics] = useState<EngagementAnalyticsResponse | null>(null)
  const [leadAnalytics, setLeadAnalytics] = useState<LeadAnalyticsResponse | null>(null)

  const [heatMap, setHeatMap] = useState<HeatMapPoint[] | null>(null)
  const [heatMapLoading, setHeatMapLoading] = useState(false)
  const [heatMapError, setHeatMapError] = useState<string | null>(null)

  const [timeSeries, setTimeSeries] = useState<TimeSeriesResponse | null>(null)
  const [timeSeriesLoading, setTimeSeriesLoading] = useState(false)
  const [timeSeriesError, setTimeSeriesError] = useState<string | null>(null)
  const [timeSeriesMetric, setTimeSeriesMetric] = useState('properties')
  const [timeSeriesInterval, setTimeSeriesInterval] = useState('day')

  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadAll = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      const results = await Promise.allSettled([
        adminAnalyticsApi.getOverview(),
        adminAnalyticsApi.getPropertyAnalytics({
          date_from: dateFrom || undefined,
          date_to: dateTo || undefined,
        }),
        adminAnalyticsApi.getAgentAnalytics({
          date_from: dateFrom || undefined,
          date_to: dateTo || undefined,
        }),
        adminAnalyticsApi.getClientAnalytics(),
        adminAnalyticsApi.getAppointmentAnalytics({
          date_from: dateFrom || undefined,
          date_to: dateTo || undefined,
        }),
        adminAnalyticsApi.getEngagementAnalytics(),
        adminAnalyticsApi.getLeadAnalytics(),
      ])

      const [overviewRes, propertyRes, agentRes, clientRes, appointmentRes, engagementRes, leadRes] = results

      setOverview(
        overviewRes.status === 'fulfilled'
          ? ((overviewRes as PromiseFulfilledResult<DashboardOverviewResponse | undefined>).value ?? null)
          : null
      )
      setPropertyAnalytics(
        propertyRes.status === 'fulfilled'
          ? ((propertyRes as PromiseFulfilledResult<PropertyAnalyticsResponse | undefined>).value ?? null)
          : null
      )
      setAgentAnalytics(
        agentRes.status === 'fulfilled'
          ? ((agentRes as PromiseFulfilledResult<AgentAnalyticsResponse | undefined>).value ?? null)
          : null
      )
      setClientAnalytics(
        clientRes.status === 'fulfilled'
          ? ((clientRes as PromiseFulfilledResult<ClientAnalyticsResponse | undefined>).value ?? null)
          : null
      )
      setAppointmentAnalytics(
        appointmentRes.status === 'fulfilled'
          ? ((appointmentRes as PromiseFulfilledResult<AppointmentAnalyticsResponse | undefined>).value ?? null)
          : null
      )
      setEngagementAnalytics(
        engagementRes.status === 'fulfilled'
          ? ((engagementRes as PromiseFulfilledResult<EngagementAnalyticsResponse | undefined>).value ?? null)
          : null
      )
      setLeadAnalytics(
        leadRes.status === 'fulfilled'
          ? ((leadRes as PromiseFulfilledResult<LeadAnalyticsResponse | undefined>).value ?? null)
          : null
      )

      const rejected = results.find((r): r is PromiseRejectedResult => r.status === 'rejected')
      if (rejected) {
        setError(extractApiError(rejected.reason) || 'Failed to load analytics')
      }
    } finally {
      setIsLoading(false)
    }
  }, [dateFrom, dateTo])

  const loadHeatMap = useCallback(async () => {
    setHeatMapLoading(true)
    setHeatMapError(null)
    try {
      const data = await adminAnalyticsApi.getHeatMap()
      setHeatMap(data)
    } catch (err) {
      setHeatMapError(extractApiError(err) || 'Failed to load heat map')
    } finally {
      setHeatMapLoading(false)
    }
  }, [])

  const loadTimeSeries = useCallback(async () => {
    if (!dateFrom || !dateTo) return
    setTimeSeriesLoading(true)
    setTimeSeriesError(null)
    try {
      const data = await adminAnalyticsApi.getTimeSeries({
        metric: timeSeriesMetric,
        date_from: dateFrom,
        date_to: dateTo,
        interval: timeSeriesInterval,
      })
      setTimeSeries(data)
    } catch (err) {
      setTimeSeriesError(extractApiError(err) || 'Failed to load time series')
    } finally {
      setTimeSeriesLoading(false)
    }
  }, [dateFrom, dateTo, timeSeriesMetric, timeSeriesInterval])

  useEffect(() => {
    loadAll()
  }, [loadAll])

  useEffect(() => {
    if (activeTab === 'heat-map' && heatMap === null) loadHeatMap()
  }, [activeTab, loadHeatMap, heatMap])

  useEffect(() => {
    if (activeTab === 'time-series' && dateFrom && dateTo) loadTimeSeries()
  }, [activeTab, dateFrom, dateTo, loadTimeSeries])

  const handleRefresh = useCallback(() => {
    loadAll()
    if (activeTab === 'heat-map') loadHeatMap()
    if (activeTab === 'time-series') loadTimeSeries()
  }, [loadAll, loadHeatMap, loadTimeSeries, activeTab])

  const handleClear = useCallback(() => {
    setDateFrom('')
    setDateTo('')
    setActiveTab('properties')
    setError(null)
    setTimeSeries(null)
  }, [])

  if (isLoading) {
    return (
      <AppLayout>
        <LoadingState message='Loading analytics…' />
      </AppLayout>
    )
  }

  if (error) {
    return (
      <AppLayout>
        <ErrorState message={error} onRetry={handleRefresh} />
      </AppLayout>
    )
  }

  return (
    <AppLayout>
      <div className='space-y-6'>
        <PageHeader
          title='Analytics'
          subtitle='Platform insights and performance metrics'
          action={
            <Button type='button' size='sm' onClick={handleRefresh}>
              Refresh
            </Button>
          }
        />

        <FilterPanel
          title='Filters'
          hasFilters={!!dateFrom || !!dateTo}
          onClear={handleClear}
        >
          <div className='grid grid-cols-1 md:grid-cols-3 gap-4 items-end'>
            <Input
              id='date-from'
              type='date'
              label='Date From'
              value={dateFrom}
              onChange={setDateFrom}
            />
            <Input
              id='date-to'
              type='date'
              label='Date To'
              value={dateTo}
              onChange={setDateTo}
            />
            <div className='flex items-end'>
              <Button type='button' size='sm' variant='secondary' onClick={handleRefresh}>
                Apply
              </Button>
            </div>
          </div>
        </FilterPanel>

        <div className='bg-white rounded-2xl border border-gray-100 shadow-card p-2 overflow-x-auto'>
          <div className='flex gap-2 border-b border-gray-100 min-w-max'>
            {TABS.map((tab) => (
              <button
                key={tab.id}
                type='button'
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-3 text-sm font-medium whitespace-nowrap transition-colors ${
                  activeTab === tab.id
                    ? 'border-b-2 border-primary-500 text-primary-600'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        <Card className='min-h-[400px]'>
          {activeTab === 'overview' && <OverviewSection overview={overview} />}
          {activeTab === 'properties' && <PropertiesSection analytics={propertyAnalytics} />}
          {activeTab === 'agents' && <AgentsSection analytics={agentAnalytics} />}
          {activeTab === 'clients' && <ClientsSection analytics={clientAnalytics} />}
          {activeTab === 'appointments' && <AppointmentsSection analytics={appointmentAnalytics} />}
          {activeTab === 'engagement' && <EngagementSection analytics={engagementAnalytics} />}
          {activeTab === 'leads' && <LeadsSection analytics={leadAnalytics} />}
          {activeTab === 'heat-map' && (
            <HeatMapSection
              points={heatMap}
              loading={heatMapLoading}
              error={heatMapError}
              onRetry={loadHeatMap}
            />
          )}
          {activeTab === 'time-series' && (
            <TimeSeriesSection
              timeSeries={timeSeries}
              loading={timeSeriesLoading}
              error={timeSeriesError}
              onRetry={loadTimeSeries}
              metric={timeSeriesMetric}
              setMetric={setTimeSeriesMetric}
              interval={timeSeriesInterval}
              setInterval={setTimeSeriesInterval}
              dateFrom={dateFrom}
              dateTo={dateTo}
              onLoad={loadTimeSeries}
            />
          )}
        </Card>
      </div>
    </AppLayout>
  )
}

function KeyValueTable({
  data,
  title,
  keyHeader = 'Key',
  valueHeader = 'Value',
  cap = false,
}: {
  data: Record<string, number>
  title: string
  keyHeader?: string
  valueHeader?: string
  cap?: boolean
}) {
  const rows = Object.entries(data).map(([key, value]) => ({ key, value }))
  return (
    <div>
      <SectionHeader title={title} />
      <DataTable
        columns={[
          {
            key: 'key',
            header: keyHeader,
            render: (row: { key: string; value: number }) => (
              <span className={cap ? 'capitalize' : ''}>{row.key}</span>
            ),
          },
          {
            key: 'value',
            header: valueHeader,
            render: (row: { key: string; value: number }) => row.value,
          },
        ]}
        rows={rows}
        keyExtractor={(row) => row.key}
        emptyTitle='No data'
        emptyDescription='No data available for this breakdown.'
      />
    </div>
  )
}

function AgentTable({ agents, loading }: { agents: AgentAnalyticsResponse['agents']; loading?: boolean }) {
  return (
    <DataTable
      columns={[
        {
          key: 'agent',
          header: 'Agent',
          render: (agent) => (
            <span className='text-sm font-medium text-gray-900'>
              {agent.first_name} {agent.last_name}
            </span>
          ),
        },
        { key: 'experience', header: 'Experience', render: (agent) => `${agent.years_experience} years` },
        { key: 'listings', header: 'Listings', render: (agent) => agent.total_listings },
        { key: 'sold', header: 'Sold', render: (agent) => agent.sold_listings },
        { key: 'rented', header: 'Rented', render: (agent) => agent.rented_listings },
        { key: 'appointments', header: 'Appointments', render: (agent) => agent.appointment_count },
        { key: 'conversations', header: 'Conversations', render: (agent) => agent.conversation_count },
        { key: 'favorites', header: 'Favorites', render: (agent) => agent.received_favorites },
      ]}
      rows={agents}
      keyExtractor={(agent) => agent.agent_id}
      isLoading={loading}
      emptyTitle='No agents found'
      emptyDescription='No agent data available for the current filters.'
    />
  )
}

function HeatMapTable({ points, loading }: { points: HeatMapPoint[]; loading?: boolean }) {
  return (
    <DataTable
      columns={[
        { key: 'city', header: 'City', render: (p) => p.city },
        { key: 'district', header: 'District', render: (p) => p.district },
        { key: 'demand', header: 'Demand', render: (p) => demandBadge(p.demand_level) },
        { key: 'trend', header: 'Price Trend', render: (p) => trendBadge(p.price_trend) },
        { key: 'price', header: 'Price/m²', render: (p) => formatCurrency(p.average_price_per_sqm) },
        { key: 'rent', header: 'Rent/m²', render: (p) => formatCurrency(p.average_rent_per_sqm) },
        {
          key: 'yield',
          header: 'Rental Yield',
          render: (p) => (p.rental_yield !== null && p.rental_yield !== undefined ? `${p.rental_yield}%` : '—'),
        },
        { key: 'transactions', header: 'Transactions', render: (p) => p.transaction_count },
      ]}
      rows={points}
      keyExtractor={(p) => p.id}
      isLoading={loading}
      emptyTitle='No heat map data'
      emptyDescription='No market heat map data available.'
    />
  )
}

function TimeSeriesTable({ points, metric }: { points: TimeSeriesResponse['points']; metric: string }) {
  return (
    <DataTable
      columns={[
        { key: 'period', header: 'Period', render: (p) => p.period },
        { key: 'value', header: `${metric} (count)`, render: (p) => p.value },
      ]}
      rows={points}
      keyExtractor={(p) => p.period}
      emptyTitle='No data points'
      emptyDescription='No data points for the selected range.'
    />
  )
}

function OverviewSection({ overview }: { overview: DashboardOverviewResponse | null }) {
  if (!overview) return <LoadingState message='Loading overview…' />

  const totalLeads = overview.total_hot_leads + overview.total_warm_leads + overview.total_cold_leads

  return (
    <div className='space-y-6'>
      <div className='grid grid-cols-2 md:grid-cols-4 gap-4'>
        <MetricCard title='Total Users' value={overview.total_users} />
        <MetricCard title='Total Clients' value={overview.total_clients} />
        <MetricCard title='Total Agents' value={overview.total_agents} />
        <MetricCard title='Total Properties' value={overview.total_properties} />
        <MetricCard title='Total Appointments' value={overview.total_appointments} />
        <MetricCard title='Total Conversations' value={overview.total_conversations} />
        <MetricCard title='Total Leads' value={totalLeads} />
        <MetricCard title='Avg Lead Score' value={overview.average_lead_score?.toFixed(1) ?? '—'} />
      </div>

      <Card>
        <SectionHeader title='Lead Distribution' />
        <div className='grid grid-cols-3 gap-4'>
          <MetricCard title='Hot Leads' value={overview.total_hot_leads} />
          <MetricCard title='Warm Leads' value={overview.total_warm_leads} />
          <MetricCard title='Cold Leads' value={overview.total_cold_leads} />
        </div>
      </Card>

      <Card>
        <SectionHeader title='Property Status' />
        <div className='grid grid-cols-2 md:grid-cols-5 gap-4'>
          <MetricCard title='Available' value={overview.available_properties} />
          <MetricCard title='Reserved' value={overview.reserved_properties} />
          <MetricCard title='Sold' value={overview.sold_properties} />
          <MetricCard title='Rented' value={overview.rented_properties} />
          <MetricCard title='Archived' value={overview.archived_properties} />
        </div>
      </Card>

      <Card>
        <SectionHeader title='Engagement' />
        <div className='grid grid-cols-2 md:grid-cols-4 gap-4'>
          <MetricCard title='Conversations' value={overview.total_conversations} />
          <MetricCard title='Messages' value={overview.total_messages} />
          <MetricCard title='Favorites' value={overview.total_favorites} />
          <MetricCard title='Saved Searches' value={overview.active_saved_searches} />
        </div>
      </Card>
    </div>
  )
}

function PropertiesSection({ analytics }: { analytics: PropertyAnalyticsResponse | null }) {
  if (!analytics) return <LoadingState message='Loading property analytics…' />

  return (
    <div className='space-y-6'>
      <div className='grid grid-cols-2 md:grid-cols-4 gap-4'>
        <MetricCard title='Total Properties' value={analytics.total_properties} />
        <MetricCard title='Featured' value={analytics.featured_count} />
        <MetricCard title='Created in Period' value={analytics.created_in_period} />
        <MetricCard title='Sold/Rented in Period' value={analytics.sold_or_rented_in_period} />
        <MetricCard title='Avg Sale Price' value={formatCurrency(analytics.average_sale_price)} />
        <MetricCard title='Avg Rental Price' value={formatCurrency(analytics.average_rental_price)} />
        <MetricCard title='Min Price' value={formatCurrency(analytics.minimum_price)} />
        <MetricCard title='Max Price' value={formatCurrency(analytics.maximum_price)} />
      </div>

      <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
        <KeyValueTable data={analytics.properties_by_status} title='By Status' keyHeader='Status' cap />
        <KeyValueTable data={analytics.properties_by_type} title='By Type' keyHeader='Type' cap />
        <KeyValueTable data={analytics.properties_by_city} title='By City' keyHeader='City' />
        <KeyValueTable data={analytics.properties_by_listing_type} title='By Listing Type' keyHeader='Listing Type' cap />
      </div>
    </div>
  )
}

function AgentsSection({ analytics }: { analytics: AgentAnalyticsResponse | null }) {
  if (!analytics) return <LoadingState message='Loading agent analytics…' />

  return (
    <div className='space-y-6'>
      <MetricCard title='Total Agents' value={analytics.total} />
      <AgentTable agents={analytics.agents} />
    </div>
  )
}

function ClientsSection({ analytics }: { analytics: ClientAnalyticsResponse | null }) {
  if (!analytics) return <LoadingState message='Loading client analytics…' />

  return (
    <div className='space-y-6'>
      <div className='grid grid-cols-2 md:grid-cols-4 gap-4'>
        <MetricCard title='Total Clients' value={analytics.total_clients} />
        <MetricCard title='Active Clients' value={analytics.active_clients} />
        <MetricCard title='With Search Requests' value={analytics.clients_with_search_requests} />
        <MetricCard title='With Favorites' value={analytics.clients_with_favorites} />
        <MetricCard title='With Saved Searches' value={analytics.clients_with_saved_searches} />
        <MetricCard title='With Conversations' value={analytics.clients_with_conversations} />
        <MetricCard title='With Appointments' value={analytics.clients_with_appointments} />
        <MetricCard title='Avg Favorites' value={analytics.average_favorites_per_client.toFixed(1)} />
        <MetricCard title='Avg Saved Searches' value={analytics.average_saved_searches_per_client.toFixed(1)} />
        <MetricCard title='Avg Appointments' value={analytics.average_appointments_per_client.toFixed(1)} />
      </div>
    </div>
  )
}

function AppointmentsSection({ analytics }: { analytics: AppointmentAnalyticsResponse | null }) {
  if (!analytics) return <LoadingState message='Loading appointment analytics…' />

  return (
    <div className='space-y-6'>
      <div className='grid grid-cols-2 md:grid-cols-4 gap-4'>
        <MetricCard title='Total Appointments' value={analytics.total_appointments} />
        <MetricCard title='Upcoming' value={analytics.upcoming_count} />
        <MetricCard title='Completion Rate' value={`${(analytics.completion_rate * 100).toFixed(1)}%`} />
        <MetricCard title='Cancellation Rate' value={`${(analytics.cancellation_rate * 100).toFixed(1)}%`} />
        <MetricCard title='No Show Rate' value={`${(analytics.no_show_rate * 100).toFixed(1)}%`} />
        <MetricCard title='Requested' value={analytics.requested} />
        <MetricCard title='Confirmed' value={analytics.confirmed} />
        <MetricCard title='Completed' value={analytics.completed} />
        <MetricCard title='Cancelled' value={analytics.cancelled} />
        <MetricCard title='No Show' value={analytics.no_show} />
        <MetricCard title='Rescheduled' value={analytics.rescheduled} />
      </div>

      <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
        <KeyValueTable data={analytics.appointments_by_day} title='Appointments by Day' keyHeader='Day' />
        <KeyValueTable data={analytics.appointments_by_agent} title='Appointments by Agent' keyHeader='Agent' />
      </div>
    </div>
  )
}

function EngagementSection({ analytics }: { analytics: EngagementAnalyticsResponse | null }) {
  if (!analytics) return <LoadingState message='Loading engagement analytics…' />

  return (
    <div className='space-y-6'>
      <div className='grid grid-cols-2 md:grid-cols-4 gap-4'>
        <MetricCard title='Total Conversations' value={analytics.total_conversations} />
        <MetricCard title='Active Conversations' value={analytics.active_conversations} />
        <MetricCard title='Total Messages' value={analytics.total_messages} />
        <MetricCard title='Avg Messages/Conversation' value={analytics.average_messages_per_conversation.toFixed(1)} />
        <MetricCard title='Total Favorites' value={analytics.total_favorites} />
        <MetricCard title='Total Saved Searches' value={analytics.total_saved_searches} />
        <MetricCard title='Total Notifications' value={analytics.total_notifications} />
        <MetricCard title='Unread Notifications' value={analytics.unread_notifications} />
        <MetricCard title='Read Rate' value={`${(analytics.notification_read_rate * 100).toFixed(1)}%`} />
        <MetricCard title='Saved Searches with Notifications' value={analytics.saved_searches_with_notifications_enabled} />
        <MetricCard title='Clients with Engagement' value={analytics.clients_with_engagement} />
      </div>
    </div>
  )
}

function LeadsSection({ analytics }: { analytics: LeadAnalyticsResponse | null }) {
  if (!analytics) return <LoadingState message='Loading lead analytics…' />

  return (
    <div className='space-y-6'>
      <div className='grid grid-cols-2 md:grid-cols-4 gap-4'>
        <MetricCard title='Total Search Requests' value={analytics.total_search_requests} />
        <MetricCard title='Active Search Requests' value={analytics.active_search_requests} />
        <MetricCard title='Scored Leads' value={analytics.scored_leads} />
        <MetricCard title='Unscored Leads' value={analytics.unscored_leads} />
        <MetricCard title='Avg Lead Score' value={analytics.average_lead_score?.toFixed(1) ?? '—'} />
        <MetricCard title='Hot Leads' value={analytics.total_hot_leads} />
        <MetricCard title='Warm Leads' value={analytics.total_warm_leads} />
        <MetricCard title='Cold Leads' value={analytics.total_cold_leads} />
      </div>

      <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
        <KeyValueTable data={analytics.leads_by_property_type} title='By Property Type' keyHeader='Property Type' cap />
        <KeyValueTable data={analytics.leads_by_city} title='By City' keyHeader='City' />
        <KeyValueTable data={analytics.leads_by_urgency} title='By Urgency' keyHeader='Urgency' cap />
      </div>
    </div>
  )
}

function HeatMapSection({
  points,
  loading,
  error,
  onRetry,
}: {
  points: HeatMapPoint[] | null
  loading: boolean
  error: string | null
  onRetry: () => void
}) {
  if (error) return <ErrorState message={error} onRetry={onRetry} />
  if (loading) return <LoadingState message='Loading heat map…' />
  if (!points) return <EmptyState title='No heat map data' description='Select the Heat Map tab to load market data.' />

  return (
    <div className='space-y-4'>
      <SectionHeader
        title='Market Heat Map'
        action={
          <Button type='button' size='sm' as='Link' to='/admin/analytics/heat-map'>
            View full heat map
          </Button>
        }
      />
      <HeatMapTable points={points} />
    </div>
  )
}

function TimeSeriesSection({
  timeSeries,
  loading,
  error,
  onRetry,
  metric,
  setMetric,
  interval,
  setInterval,
  dateFrom,
  dateTo,
  onLoad,
}: {
  timeSeries: TimeSeriesResponse | null
  loading: boolean
  error: string | null
  onRetry: () => void
  metric: string
  setMetric: (v: string) => void
  interval: string
  setInterval: (v: string) => void
  dateFrom: string
  dateTo: string
  onLoad: () => void
}) {
  if (error) return <ErrorState message={error} onRetry={onRetry} />
  if (!dateFrom || !dateTo) {
    return <EmptyState title='Select a date range' description='Choose a date range and click Load to view the time series.' />
  }
  if (loading) return <LoadingState message='Loading time series…' />

  return (
    <div className='space-y-4'>
      <SectionHeader title='Time Series' />
      <div className='flex flex-wrap gap-4 items-end'>
        <Select
          id='metric-select'
          label='Metric'
          value={metric}
          onChange={setMetric}
          options={METRIC_OPTIONS}
        />
        <Select
          id='interval-select'
          label='Interval'
          value={interval}
          onChange={setInterval}
          options={INTERVAL_OPTIONS}
        />
        <div className='flex items-end'>
          <Button type='button' size='sm' onClick={onLoad} isLoading={loading} disabled={!dateFrom || !dateTo}>
            Load
          </Button>
        </div>
      </div>

      {timeSeries ? (
        <TimeSeriesTable points={timeSeries.points} metric={timeSeries.metric} />
      ) : (
        <EmptyState title='No data loaded' description='Click Load to fetch the time series data.' />
      )}
    </div>
  )
}
