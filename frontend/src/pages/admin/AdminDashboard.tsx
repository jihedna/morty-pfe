import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import AppLayout from '../../components/layout/AppLayout'
import { adminAnalyticsApi, DashboardOverviewResponse } from '../../lib/adminAnalyticsApi'
import { extractApiError } from '../../utils/format'

export default function AdminDashboard() {
  const navigate = useNavigate()
  const [overview, setOverview] = useState<DashboardOverviewResponse | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [retryCount, setRetryCount] = useState(0)

  const loadOverview = useCallback(async () => {
    setIsLoading(true)
    setError(null)

    try {
      const data = await adminAnalyticsApi.getOverview()
      setOverview(data)
    } catch (err) {
      const errorMessage = extractApiError(err)
      setError(errorMessage || 'Failed to load dashboard overview')
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    loadOverview()
  }, [loadOverview, retryCount])

  const handleRetry = () => {
    setRetryCount(prev => prev + 1)
  }

  if (isLoading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center py-12" aria-live="polite" aria-busy="true">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" aria-hidden="true"></div>
          <span className="sr-only">Loading dashboard...</span>
        </div>
      </AppLayout>
    )
  }

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold">Manager Dashboard</h1>
          <button
            onClick={handleRetry}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            Refresh
          </button>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded" role="alert" aria-live="polite">
            {error}
          </div>
        )}

        {overview && (
          <>
            {/* User Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <MetricCard
                title="Total Users"
                value={overview.total_users}
                onClick={() => navigate('/admin/users')}
              />
              <MetricCard
                title="Total Clients"
                value={overview.total_clients}
                onClick={() => navigate('/admin/users')}
              />
              <MetricCard
                title="Total Agents"
                value={overview.total_agents}
                onClick={() => navigate('/admin/agents')}
              />
            </div>

            {/* Agent Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <MetricCard
                title="Active Agents"
                value={overview.active_agents}
                onClick={() => navigate('/admin/agents')}
              />
              <MetricCard
                title="Clients with Search Requests"
                value={overview.total_client_search_requests}
              />
            </div>

            {/* Property Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <MetricCard
                title="Total Properties"
                value={overview.total_properties}
                onClick={() => navigate('/admin/properties')}
              />
              <MetricCard
                title="Available Properties"
                value={overview.available_properties}
                onClick={() => navigate('/admin/properties')}
              />
              <MetricCard
                title="Reserved Properties"
                value={overview.reserved_properties}
                onClick={() => navigate('/admin/properties')}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <MetricCard
                title="Sold Properties"
                value={overview.sold_properties}
                onClick={() => navigate('/admin/properties')}
              />
              <MetricCard
                title="Rented Properties"
                value={overview.rented_properties}
                onClick={() => navigate('/admin/properties')}
              />
              <MetricCard
                title="Archived Properties"
                value={overview.archived_properties}
                onClick={() => navigate('/admin/properties')}
              />
            </div>

            {/* Appointment Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <MetricCard
                title="Total Appointments"
                value={overview.total_appointments}
                onClick={() => navigate('/admin/appointments')}
              />
              <MetricCard
                title="Upcoming Appointments"
                value={overview.upcoming_appointments}
                onClick={() => navigate('/admin/appointments')}
              />
              <MetricCard
                title="Completed Appointments"
                value={overview.completed_appointments}
                onClick={() => navigate('/admin/appointments')}
              />
            </div>

            {/* Engagement Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <MetricCard
                title="Active Conversations"
                value={overview.active_conversations}
                onClick={() => navigate('/admin/conversations')}
              />
              <MetricCard
                title="Total Favorites"
                value={overview.total_favorites}
              />
              <MetricCard
                title="Active Saved Searches"
                value={overview.active_saved_searches}
              />
            </div>

            {/* Quick Actions */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold mb-4">Quick Actions</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <QuickActionLink
                  label="Manage Agents"
                  onClick={() => navigate('/admin/agents')}
                />
                <QuickActionLink
                  label="Manage Properties"
                  onClick={() => navigate('/admin/properties')}
                />
                <QuickActionLink
                  label="View Analytics"
                  onClick={() => navigate('/admin/analytics')}
                />
              </div>
            </div>
          </>
        )}
      </div>
    </AppLayout>
  )
}

function MetricCard({ title, value, onClick }: { title: string; value: number; onClick?: () => void }) {
  return (
    <button
      onClick={onClick}
      className="bg-white rounded-lg shadow p-6 text-left hover:shadow-md transition-shadow focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
      disabled={!onClick}
    >
      <h3 className="text-sm font-medium text-gray-600 mb-2">{title}</h3>
      <p className="text-3xl font-bold text-gray-900">{value}</p>
    </button>
  )
}

function QuickActionLink({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="px-4 py-3 bg-blue-50 text-blue-700 rounded hover:bg-blue-100 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
    >
      {label}
    </button>
  )
}
