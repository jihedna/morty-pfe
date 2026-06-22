import { useState, useEffect, useCallback } from 'react'
import AppLayout from '../../components/layout/AppLayout'
import {
  adminAnalyticsApi,
  PropertyAnalyticsResponse,
  AgentAnalyticsResponse,
  ClientAnalyticsResponse,
  AppointmentAnalyticsResponse,
  EngagementAnalyticsResponse,
  TimeSeriesResponse,
} from '../../lib/adminAnalyticsApi'

export default function AdminAnalytics() {
  const [activeTab, setActiveTab] = useState<'properties' | 'agents' | 'clients' | 'appointments' | 'engagement' | 'time-series'>('properties')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [propertyAnalytics, setPropertyAnalytics] = useState<PropertyAnalyticsResponse | null>(null)
  const [agentAnalytics, setAgentAnalytics] = useState<AgentAnalyticsResponse | null>(null)
  const [clientAnalytics, setClientAnalytics] = useState<ClientAnalyticsResponse | null>(null)
  const [appointmentAnalytics, setAppointmentAnalytics] = useState<AppointmentAnalyticsResponse | null>(null)
  const [engagementAnalytics, setEngagementAnalytics] = useState<EngagementAnalyticsResponse | null>(null)
  const [timeSeries, setTimeSeries] = useState<TimeSeriesResponse | null>(null)
  const [timeSeriesMetric, setTimeSeriesMetric] = useState('total_properties')
  const [timeSeriesInterval, setTimeSeriesInterval] = useState('day')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const loadPropertyAnalytics = useCallback(async () => {
    try {
      const data = await adminAnalyticsApi.getPropertyAnalytics({
        date_from: dateFrom || undefined,
        date_to: dateTo || undefined,
      })
      setPropertyAnalytics(data)
    } catch (err) {
      console.error('Failed to load property analytics:', err)
    }
  }, [dateFrom, dateTo])

  const loadAgentAnalytics = useCallback(async () => {
    try {
      const data = await adminAnalyticsApi.getAgentAnalytics({
        date_from: dateFrom || undefined,
        date_to: dateTo || undefined,
      })
      setAgentAnalytics(data)
    } catch (err) {
      console.error('Failed to load agent analytics:', err)
    }
  }, [dateFrom, dateTo])

  const loadClientAnalytics = useCallback(async () => {
    try {
      const data = await adminAnalyticsApi.getClientAnalytics()
      setClientAnalytics(data)
    } catch (err) {
      console.error('Failed to load client analytics:', err)
    }
  }, [])

  const loadAppointmentAnalytics = useCallback(async () => {
    try {
      const data = await adminAnalyticsApi.getAppointmentAnalytics({
        date_from: dateFrom || undefined,
        date_to: dateTo || undefined,
      })
      setAppointmentAnalytics(data)
    } catch (err) {
      console.error('Failed to load appointment analytics:', err)
    }
  }, [dateFrom, dateTo])

  const loadEngagementAnalytics = useCallback(async () => {
    try {
      const data = await adminAnalyticsApi.getEngagementAnalytics()
      setEngagementAnalytics(data)
    } catch (err) {
      console.error('Failed to load engagement analytics:', err)
    }
  }, [])

  const loadTimeSeries = useCallback(async () => {
    if (!dateFrom || !dateTo) return
    try {
      const data = await adminAnalyticsApi.getTimeSeries({
        metric: timeSeriesMetric,
        date_from: dateFrom,
        date_to: dateTo,
        interval: timeSeriesInterval,
      })
      setTimeSeries(data)
    } catch (err) {
      console.error('Failed to load time series:', err)
    }
  }, [dateFrom, dateTo, timeSeriesMetric, timeSeriesInterval])

  useEffect(() => {
    const loadAll = async () => {
      setIsLoading(true)
      setError(null)
      await Promise.allSettled([
        loadPropertyAnalytics(),
        loadAgentAnalytics(),
        loadClientAnalytics(),
        loadAppointmentAnalytics(),
        loadEngagementAnalytics(),
      ])
      setIsLoading(false)
    }
    loadAll()
  }, [loadPropertyAnalytics, loadAgentAnalytics, loadClientAnalytics, loadAppointmentAnalytics, loadEngagementAnalytics])

  useEffect(() => {
    if (activeTab === 'time-series' && dateFrom && dateTo) {
      loadTimeSeries()
    }
  }, [activeTab, dateFrom, dateTo, loadTimeSeries])

  const handleApplyFilters = () => {
    loadPropertyAnalytics()
    loadAgentAnalytics()
    loadAppointmentAnalytics()
    if (activeTab === 'time-series') {
      loadTimeSeries()
    }
  }

  return (
    <AppLayout>
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">Analytics</h1>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded" role="alert" aria-live="polite">
            {error}
          </div>
        )}

        {/* Date Range Filter */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex flex-wrap gap-4 items-end">
            <div>
              <label htmlFor="date-from" className="block text-sm font-medium text-gray-700 mb-1">
                Date From
              </label>
              <input
                id="date-from"
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label htmlFor="date-to" className="block text-sm font-medium text-gray-700 mb-1">
                Date To
              </label>
              <input
                id="date-to"
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <button
              onClick={handleApplyFilters}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              Apply Filters
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-lg shadow">
          <div className="border-b">
            <nav className="flex -mb-px">
              {[
                { id: 'properties', label: 'Properties' },
                { id: 'agents', label: 'Agents' },
                { id: 'clients', label: 'Clients' },
                { id: 'appointments', label: 'Appointments' },
                { id: 'engagement', label: 'Engagement' },
                { id: 'time-series', label: 'Time Series' },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as 'properties' | 'agents' | 'clients' | 'appointments' | 'engagement' | 'time-series')}
                  className={`px-4 py-3 font-medium ${
                    activeTab === tab.id
                      ? 'border-b-2 border-blue-600 text-blue-600'
                      : 'text-gray-600 hover:text-gray-800'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>

          <div className="p-6">
            {isLoading && (
              <div className="flex items-center justify-center py-12" aria-live="polite" aria-busy="true">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" aria-hidden="true"></div>
                <span className="sr-only">Loading analytics...</span>
              </div>
            )}

            {!isLoading && (
              <>
                {activeTab === 'properties' && propertyAnalytics && (
                  <PropertyAnalyticsSection analytics={propertyAnalytics} />
                )}
                {activeTab === 'agents' && agentAnalytics && (
                  <AgentAnalyticsSection analytics={agentAnalytics} />
                )}
                {activeTab === 'clients' && clientAnalytics && (
                  <ClientAnalyticsSection analytics={clientAnalytics} />
                )}
                {activeTab === 'appointments' && appointmentAnalytics && (
                  <AppointmentAnalyticsSection analytics={appointmentAnalytics} />
                )}
                {activeTab === 'engagement' && engagementAnalytics && (
                  <EngagementAnalyticsSection analytics={engagementAnalytics} />
                )}
                {activeTab === 'time-series' && (
                  <TimeSeriesSection
                    timeSeries={timeSeries}
                    metric={timeSeriesMetric}
                    interval={timeSeriesInterval}
                    onMetricChange={setTimeSeriesMetric}
                    onIntervalChange={setTimeSeriesInterval}
                    onLoad={loadTimeSeries}
                    dateFrom={dateFrom}
                    dateTo={dateTo}
                  />
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </AppLayout>
  )
}

function PropertyAnalyticsSection({ analytics }: { analytics: PropertyAnalyticsResponse }) {
  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold">Property Analytics</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-gray-50 p-4 rounded">
          <h3 className="text-sm font-medium text-gray-600">Total Properties</h3>
          <p className="text-2xl font-bold">{analytics.total_properties}</p>
        </div>
        <div className="bg-gray-50 p-4 rounded">
          <h3 className="text-sm font-medium text-gray-600">Featured</h3>
          <p className="text-2xl font-bold">{analytics.featured_count}</p>
        </div>
        <div className="bg-gray-50 p-4 rounded">
          <h3 className="text-sm font-medium text-gray-600">Created in Period</h3>
          <p className="text-2xl font-bold">{analytics.created_in_period}</p>
        </div>
      </div>

      <div>
        <h3 className="text-lg font-medium mb-3">By Status</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          {Object.entries(analytics.properties_by_status).map(([status, count]) => (
            <div key={status} className="bg-gray-50 p-3 rounded">
              <p className="text-sm text-gray-600 capitalize">{status}</p>
              <p className="text-xl font-bold">{count}</p>
            </div>
          ))}
        </div>
      </div>

      <div>
        <h3 className="text-lg font-medium mb-3">By Type</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          {Object.entries(analytics.properties_by_type).map(([type, count]) => (
            <div key={type} className="bg-gray-50 p-3 rounded">
              <p className="text-sm text-gray-600 capitalize">{type}</p>
              <p className="text-xl font-bold">{count}</p>
            </div>
          ))}
        </div>
      </div>

      <div>
        <h3 className="text-lg font-medium mb-3">By City</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          {Object.entries(analytics.properties_by_city).map(([city, count]) => (
            <div key={city} className="bg-gray-50 p-3 rounded">
              <p className="text-sm text-gray-600">{city}</p>
              <p className="text-xl font-bold">{count}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function AgentAnalyticsSection({ analytics }: { analytics: AgentAnalyticsResponse }) {
  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold">Agent Analytics</h2>
      <p className="text-sm text-gray-600">Showing {analytics.skip + 1}-{Math.min(analytics.skip + analytics.limit, analytics.total)} of {analytics.total} agents</p>

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Agent</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Experience</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Listings</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Sold</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rented</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Appointments</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Conversations</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Favorites</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {analytics.agents.map((agent) => (
              <tr key={agent.agent_id}>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900">
                    {agent.first_name} {agent.last_name}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{agent.years_experience} years</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{agent.total_listings}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{agent.sold_listings}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{agent.rented_listings}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{agent.appointment_count}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{agent.conversation_count}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{agent.received_favorites}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function ClientAnalyticsSection({ analytics }: { analytics: ClientAnalyticsResponse }) {
  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold">Client Analytics</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-gray-50 p-4 rounded">
          <h3 className="text-sm font-medium text-gray-600">Total Clients</h3>
          <p className="text-2xl font-bold">{analytics.total_clients}</p>
        </div>
        <div className="bg-gray-50 p-4 rounded">
          <h3 className="text-sm font-medium text-gray-600">Active Clients</h3>
          <p className="text-2xl font-bold">{analytics.active_clients}</p>
        </div>
        <div className="bg-gray-50 p-4 rounded">
          <h3 className="text-sm font-medium text-gray-600">Avg Favorites per Client</h3>
          <p className="text-2xl font-bold">{analytics.average_favorites_per_client.toFixed(1)}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-gray-50 p-4 rounded">
          <h3 className="text-sm font-medium text-gray-600">Clients with Search Requests</h3>
          <p className="text-2xl font-bold">{analytics.clients_with_search_requests}</p>
        </div>
        <div className="bg-gray-50 p-4 rounded">
          <h3 className="text-sm font-medium text-gray-600">Clients with Favorites</h3>
          <p className="text-2xl font-bold">{analytics.clients_with_favorites}</p>
        </div>
        <div className="bg-gray-50 p-4 rounded">
          <h3 className="text-sm font-medium text-gray-600">Clients with Saved Searches</h3>
          <p className="text-2xl font-bold">{analytics.clients_with_saved_searches}</p>
        </div>
      </div>
    </div>
  )
}

function AppointmentAnalyticsSection({ analytics }: { analytics: AppointmentAnalyticsResponse }) {
  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold">Appointment Analytics</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-gray-50 p-4 rounded">
          <h3 className="text-sm font-medium text-gray-600">Total Appointments</h3>
          <p className="text-2xl font-bold">{analytics.total_appointments}</p>
        </div>
        <div className="bg-gray-50 p-4 rounded">
          <h3 className="text-sm font-medium text-gray-600">Upcoming</h3>
          <p className="text-2xl font-bold">{analytics.upcoming_count}</p>
        </div>
        <div className="bg-gray-50 p-4 rounded">
          <h3 className="text-sm font-medium text-gray-600">Completion Rate</h3>
          <p className="text-2xl font-bold">{(analytics.completion_rate * 100).toFixed(1)}%</p>
        </div>
      </div>

      <div>
        <h3 className="text-lg font-medium mb-3">By Status</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          <div className="bg-gray-50 p-3 rounded">
            <p className="text-sm text-gray-600">Requested</p>
            <p className="text-xl font-bold">{analytics.requested}</p>
          </div>
          <div className="bg-gray-50 p-3 rounded">
            <p className="text-sm text-gray-600">Confirmed</p>
            <p className="text-xl font-bold">{analytics.confirmed}</p>
          </div>
          <div className="bg-gray-50 p-3 rounded">
            <p className="text-sm text-gray-600">Completed</p>
            <p className="text-xl font-bold">{analytics.completed}</p>
          </div>
          <div className="bg-gray-50 p-3 rounded">
            <p className="text-sm text-gray-600">Cancelled</p>
            <p className="text-xl font-bold">{analytics.cancelled}</p>
          </div>
        </div>
      </div>
    </div>
  )
}

function EngagementAnalyticsSection({ analytics }: { analytics: EngagementAnalyticsResponse }) {
  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold">Engagement Analytics</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-gray-50 p-4 rounded">
          <h3 className="text-sm font-medium text-gray-600">Total Conversations</h3>
          <p className="text-2xl font-bold">{analytics.total_conversations}</p>
        </div>
        <div className="bg-gray-50 p-4 rounded">
          <h3 className="text-sm font-medium text-gray-600">Active Conversations</h3>
          <p className="text-2xl font-bold">{analytics.active_conversations}</p>
        </div>
        <div className="bg-gray-50 p-4 rounded">
          <h3 className="text-sm font-medium text-gray-600">Total Messages</h3>
          <p className="text-2xl font-bold">{analytics.total_messages}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-gray-50 p-4 rounded">
          <h3 className="text-sm font-medium text-gray-600">Avg Messages per Conversation</h3>
          <p className="text-2xl font-bold">{analytics.average_messages_per_conversation.toFixed(1)}</p>
        </div>
        <div className="bg-gray-50 p-4 rounded">
          <h3 className="text-sm font-medium text-gray-600">Total Favorites</h3>
          <p className="text-2xl font-bold">{analytics.total_favorites}</p>
        </div>
        <div className="bg-gray-50 p-4 rounded">
          <h3 className="text-sm font-medium text-gray-600">Total Saved Searches</h3>
          <p className="text-2xl font-bold">{analytics.total_saved_searches}</p>
        </div>
      </div>
    </div>
  )
}

function TimeSeriesSection({
  timeSeries,
  metric,
  interval,
  onMetricChange,
  onIntervalChange,
  onLoad,
  dateFrom,
  dateTo,
}: {
  timeSeries: TimeSeriesResponse | null
  metric: string
  interval: string
  onMetricChange: (metric: string) => void
  onIntervalChange: (interval: string) => void
  onLoad: () => void
  dateFrom: string
  dateTo: string
}) {
  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold">Time Series Analytics</h2>

      <div className="flex flex-wrap gap-4">
        <div>
          <label htmlFor="metric-select" className="block text-sm font-medium text-gray-700 mb-1">
            Metric
          </label>
          <select
            id="metric-select"
            value={metric}
            onChange={(e) => onMetricChange(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="total_properties">Total Properties</option>
            <option value="total_appointments">Total Appointments</option>
            <option value="total_conversations">Total Conversations</option>
            <option value="total_messages">Total Messages</option>
          </select>
        </div>
        <div>
          <label htmlFor="interval-select" className="block text-sm font-medium text-gray-700 mb-1">
            Interval
          </label>
          <select
            id="interval-select"
            value={interval}
            onChange={(e) => onIntervalChange(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="day">Day</option>
            <option value="week">Week</option>
            <option value="month">Month</option>
          </select>
        </div>
        <div className="flex items-end">
          <button
            onClick={onLoad}
            disabled={!dateFrom || !dateTo}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            Load
          </button>
        </div>
      </div>

      {!dateFrom || !dateTo ? (
        <p className="text-gray-600">Please select date range to view time series data</p>
      ) : timeSeries ? (
        <div className="space-y-2">
          <h3 className="text-lg font-medium">{metric} by {interval}</h3>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Period</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Value</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {timeSeries.points.map((point, index) => (
                  <tr key={index}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{point.period}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{point.value}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <p className="text-gray-600">No data available</p>
      )}
    </div>
  )
}
