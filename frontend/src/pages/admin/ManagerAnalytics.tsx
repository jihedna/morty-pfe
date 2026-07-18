import { useMemo } from 'react'
import AppLayout from '../../components/layout/AppLayout'
import { PageHeader, Card, SectionHeader, ErrorState } from '../../components/ui/shared'
import { useManagerAnalytics } from '../../hooks/useManagerAnalytics'
import AnalyticsFilterBar from '../../components/manager/analytics/AnalyticsFilterBar'
import ComposedChart from '../../components/manager/analytics/ComposedChart'
import LeadFunnelCard from '../../components/manager/analytics/LeadFunnelCard'
import TopAgentsTable from '../../components/manager/analytics/TopAgentsTable'
import RegionalHeatMapCard from '../../components/manager/analytics/RegionalHeatMapCard'
import type { ChartPoint } from '../../components/manager/analytics/ComposedChart'

function formatLabel(period: string, interval: string): string {
  const date = new Date(period)
  if (Number.isNaN(date.getTime())) return period
  if (interval === 'month') {
    return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
  }
  if (interval === 'week') {
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  }
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

export default function ManagerAnalytics() {
  const {
    filters,
    data,
    loading,
    error,
    partialError,
    setFilters,
    clearFilters,
    interval,
  } = useManagerAnalytics()

  const chartData = useMemo<ChartPoint[]>(() => {
    const searchPoints = data.searchRequestsSeries?.points || []
    const contractPoints = data.contractsSeries?.points || []
    const allPeriods = Array.from(
      new Set([...searchPoints.map((p) => p.period), ...contractPoints.map((p) => p.period)])
    ).sort()

    return allPeriods.map((period) => {
      const leads = searchPoints.find((p) => p.period === period)?.value ?? 0
      const deals = contractPoints.find((p) => p.period === period)?.value ?? 0
      const conversion = leads > 0 ? Math.min(100, (deals / leads) * 100) : 0
      return {
        period,
        label: formatLabel(period, interval),
        leads,
        conversion,
      }
    })
  }, [data.searchRequestsSeries, data.contractsSeries, interval])

  const funnel = useMemo(() => {
    const searchRequests = data.searchRequestsSeries
      ? (data.searchRequestsSeries.points || []).reduce((sum, p) => sum + p.value, 0)
      : data.leadAnalytics?.total_search_requests || 0
    const qualifiedLeads = data.leadAnalytics?.scored_leads || 0
    const showings = data.appointmentAnalytics?.completed || 0
    const deals = data.contractsSeries
      ? (data.contractsSeries.points || []).reduce((sum, p) => sum + p.value, 0)
      : 0
    return { searchRequests, qualifiedLeads, showings, deals }
  }, [data])

  const funnelStages = useMemo(
    () => [
      { label: 'Search Requests', value: funnel.searchRequests, colorClass: 'bg-navy-800' },
      { label: 'Scored Leads', value: funnel.qualifiedLeads, colorClass: 'bg-primary-500/80' },
      { label: 'Property Showings', value: funnel.showings, colorClass: 'bg-primary-500' },
      { label: 'Contracts', value: funnel.deals, colorClass: 'bg-tertiary-500' },
    ],
    [funnel]
  )

  const overallConversion = useMemo(() => {
    if (funnel.searchRequests === 0) return 0
    return Math.min(100, (funnel.deals / funnel.searchRequests) * 100)
  }, [funnel])

  const agentList = useMemo(
    () =>
      data.agents.map((a) => ({
        id: a.id,
        first_name: a.user?.first_name || '',
        last_name: a.user?.last_name || '',
      })),
    [data.agents]
  )

  if (error) {
    return (
      <AppLayout>
        <div className="space-y-6">
          <PageHeader title="Analytics" subtitle="Manager analytics dashboard" />
          <ErrorState message={`Unable to load analytics: ${error}`} />
        </div>
      </AppLayout>
    )
  }

  return (
    <AppLayout>
      <div className="space-y-6">
        <PageHeader title="Analytics" subtitle="Lead performance, agent activity, and market heat map" />

        <AnalyticsFilterBar
          filters={filters}
          cities={data.cities}
          districts={data.districts}
          agents={agentList}
          onChange={setFilters}
          onClear={clearFilters}
        />

        {partialError && (
          <div className="rounded-lg bg-amber-50 border border-amber-200 px-4 py-3 text-sm text-amber-800">
            {partialError}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-2">
            <div className="flex items-center justify-between mb-4">
              <SectionHeader title="Lead Volume vs. Conversion Rate" />
              <div className="flex items-center gap-4 text-sm">
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-sm bg-primary-500/20 border border-primary-500" />
                  <span className="text-gray-600">Leads</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-full bg-tertiary-500" />
                  <span className="text-gray-600">Conversion</span>
                </div>
              </div>
            </div>
            <ComposedChart
              data={chartData}
              loading={loading && chartData.length === 0}
              error={undefined}
              emptyTitle="No chart data for the selected filters"
            />
          </Card>

          <LeadFunnelCard
            stages={funnelStages}
            overallConversion={overallConversion}
            loading={loading}
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <TopAgentsTable
            agents={data.agentAnalytics?.agents || []}
            loading={loading}
          />
          <RegionalHeatMapCard
            points={data.heatMapPoints}
            cityFilter={filters.city}
            districtFilter={filters.district}
            loading={loading}
          />
        </div>
      </div>
    </AppLayout>
  )
}
