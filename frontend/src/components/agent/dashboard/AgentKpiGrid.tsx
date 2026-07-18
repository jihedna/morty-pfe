import { Link } from 'react-router-dom'
import { AgentDashboardData } from '../../../hooks/useAgentDashboard'

interface AgentKpiGridProps {
  data: AgentDashboardData
}

interface KpiProps {
  label: string
  value: string | number
  href: string
  badge?: string
  icon: string
  iconClass: string
}

function AgentKpiCard({ label, value, href, badge, icon, iconClass }: KpiProps) {
  return (
    <Link to={href} className="group rounded-xl border border-border bg-surface p-5 shadow-card transition-colors hover:border-primary-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-navy-500">{label}</p>
          <p className="mt-1 text-3xl font-semibold tracking-tight text-navy-900">{value}</p>
        </div>
        <span className={`flex h-10 w-10 items-center justify-center rounded-lg ${iconClass}`} aria-hidden="true">
          <span className="text-lg">{icon}</span>
        </span>
      </div>
      {badge && <p className="mt-4 text-xs font-medium text-navy-500">{badge}</p>}
    </Link>
  )
}

export function AgentKpiGrid({ data }: AgentKpiGridProps) {
  const activeListings = data.properties.filter((property) => property.status === 'available').length
  const activeLeads = data.leadTotal
  const upcomingAppointments = data.appointments.length

  return (
    <section aria-labelledby="agent-kpi-heading">
      <h2 id="agent-kpi-heading" className="sr-only">Agent performance summary</h2>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <AgentKpiCard label="Active Leads" value={activeLeads} href="/agent/leads" badge={`${data.leads.length} currently visible`} icon="◉" iconClass="bg-primary-100 text-primary-700" />
        <AgentKpiCard label="Upcoming Appointments" value={upcomingAppointments} href="/agent/appointments" badge="Scheduled appointments" icon="▣" iconClass="bg-navy-100 text-navy-700" />
        <AgentKpiCard label="Active Listings" value={activeListings} href="/agent/properties" badge={`${data.properties.length} total listings`} icon="⌂" iconClass="bg-success-100 text-success-700" />
      </div>
    </section>
  )
}
