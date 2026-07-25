import { useMemo, useState } from 'react'
import AppLayout from '../../components/layout/AppLayout'
import Button from '../../components/ui/Button'
import { ErrorState, LoadingState } from '../../components/ui/shared'
import { useAgentDashboard } from '../../hooks/useAgentDashboard'
import { AgentLeadFilters } from '../../lib/agentLeadsApi'
import { useAuth } from '../../contexts/AuthContext'
import { AgentKpiGrid } from '../../components/agent/dashboard/AgentKpiGrid'
import { LeadsPipeline } from '../../components/agent/dashboard/LeadsPipeline'
import { UpcomingAppointments } from '../../components/agent/dashboard/UpcomingAppointments'
import { InventoryQuickStats } from '../../components/agent/dashboard/InventoryQuickStats'
import { RecentActivityTable } from '../../components/agent/dashboard/RecentActivityTable'

export default function AgentDashboard() {
  const { user } = useAuth()
  const [qualification, setQualification] = useState('')
  const [urgency, setUrgency] = useState('')
  const [city, setCity] = useState('')
  const filters = useMemo<AgentLeadFilters>(() => ({ qualification: qualification || undefined, urgency: urgency || undefined, city: city || undefined, order_by: 'lead_score', sort: 'desc' }), [city, qualification, urgency])
  const { data, isLoading, error, partialError, refetch } = useAgentDashboard(filters)
  const hasFilters = Boolean(qualification || urgency || city)

  const clearFilters = () => {
    setQualification('')
    setUrgency('')
    setCity('')
  }

  return (
    <AppLayout>
      <div className="mx-auto w-full max-w-7xl space-y-8">
        <header className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-navy-950 via-navy-900 to-primary-900 px-6 py-7 text-white shadow-card-hover sm:px-8 sm:py-9">
          <div className="absolute -right-16 -top-20 h-56 w-56 rounded-full bg-primary-500/20 blur-3xl" aria-hidden="true" />
          <div className="absolute -bottom-24 right-1/3 h-48 w-48 rounded-full bg-white/10 blur-3xl" aria-hidden="true" />
          <div className="relative flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary-200">Agent Portal</p>
              <h1 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">Agent Dashboard</h1>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-300">Welcome back, {user?.first_name || 'Agent'}. Review your listings, prioritize leads, and keep every client follow-up moving.</p>
            </div>
            <Button as="Link" to="/agent/properties/new" className="bg-white !text-navy-900 hover:bg-slate-100">New Listing</Button>
          </div>
        </header>

        {partialError && <p className="rounded-lg border border-warning-200 bg-warning-50 px-4 py-3 text-sm text-warning-800" role="status" aria-live="polite">{partialError}</p>}

        {isLoading ? <LoadingState message="Loading your agent dashboard…" /> : error ? <ErrorState message={error} onRetry={refetch} /> : data ? (
          <>
            <AgentKpiGrid data={data} />
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
              <div className="space-y-6 lg:col-span-8">
                <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-card" aria-labelledby="lead-filter-heading">
                  <div className="flex flex-wrap items-end justify-between gap-4"><div><h2 id="lead-filter-heading" className="text-base font-semibold text-navy-900">Lead filters</h2><p className="mt-1 text-xs text-navy-500">Filters are applied through the existing lead API.</p></div>{hasFilters && <button type="button" onClick={clearFilters} className="text-sm font-semibold text-primary-700 hover:underline">Clear filters</button>}</div>
                  <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3"><label className="text-sm font-medium text-navy-700">Qualification<select value={qualification} onChange={(event) => setQualification(event.target.value)} className="mt-1 block min-h-10 w-full rounded-lg border border-border bg-surface px-3 text-sm text-navy-900 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-200"><option value="">All bands</option><option value="hot">Hot</option><option value="warm">Warm</option><option value="cold">Cold</option></select></label><label className="text-sm font-medium text-navy-700">Urgency<select value={urgency} onChange={(event) => setUrgency(event.target.value)} className="mt-1 block min-h-10 w-full rounded-lg border border-border bg-surface px-3 text-sm text-navy-900 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-200"><option value="">All urgency</option><option value="immediate">Immediate</option><option value="high">High</option><option value="medium">Medium</option><option value="low">Low</option></select></label><label className="text-sm font-medium text-navy-700">City<input value={city} onChange={(event) => setCity(event.target.value)} placeholder="Any city" className="mt-1 block min-h-10 w-full rounded-lg border border-border bg-surface px-3 text-sm text-navy-900 placeholder:text-navy-400 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-200" /></label></div>
                </div>
                <LeadsPipeline leads={data.leads} total={data.leadTotal} />
              </div>
              <aside className="space-y-6 lg:col-span-4"><UpcomingAppointments appointments={data.appointments} /><InventoryQuickStats properties={data.properties} /><section className="relative overflow-hidden rounded-2xl border border-primary-200 bg-gradient-to-br from-primary-50 to-white p-5 shadow-card" aria-labelledby="agent-follow-up-heading"><div className="absolute -right-8 -top-8 h-24 w-24 rounded-full bg-primary-100" aria-hidden="true" /><div className="relative"><p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary-600">Priority</p><h2 id="agent-follow-up-heading" className="mt-1 text-lg font-semibold text-navy-900">Follow-up focus</h2><p className="mt-2 text-sm text-navy-600">{data.leads.length > 0 ? `Review ${data.leads.filter((lead) => lead.qualification_level.toLowerCase() === 'hot').length} hot leads first.` : 'No scored leads need follow-up right now.'}</p><Button as="Link" to="/agent/leads" variant="outline" size="sm" className="mt-4">Open Leads</Button></div></section></aside>
            </div>
            <RecentActivityTable properties={data.properties} />
          </>
        ) : null}
      </div>
    </AppLayout>
  )
}
