import { Link } from 'react-router-dom'
import { DataTable, Card, SectionHeader } from '../../ui/shared'
import type { AgentAnalyticsItem } from '../../../lib/adminAnalyticsApi'

interface TopAgentsTableProps {
  agents: AgentAnalyticsItem[]
  loading?: boolean
  error?: string | null
}

export default function TopAgentsTable({ agents, loading, error }: TopAgentsTableProps) {
  const columns = [
    {
      key: 'agent',
      header: 'Agent Name',
      render: (agent: AgentAnalyticsItem) => (
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-navy-100 flex items-center justify-center text-xs font-bold text-navy-800">
            {agent.first_name[0]}{agent.last_name[0]}
          </div>
          <div>
            <p className="font-medium text-gray-900">
              {agent.first_name} {agent.last_name}
            </p>
            <p className="text-xs text-gray-500">{agent.years_experience} yrs exp.</p>
          </div>
        </div>
      ),
    },
    {
      key: 'completed_appointments',
      header: 'Completed Appointments',
      render: (agent: AgentAnalyticsItem) => agent.completed_appointment_count,
    },
    {
      key: 'listings',
      header: 'Listings',
      render: (agent: AgentAnalyticsItem) => agent.total_listings,
    },
    {
      key: 'sold',
      header: 'Sold',
      render: (agent: AgentAnalyticsItem) => agent.sold_listings,
    },
    {
      key: 'rented',
      header: 'Rented',
      render: (agent: AgentAnalyticsItem) => agent.rented_listings,
    },
    {
      key: 'favorites',
      header: 'Favorites',
      render: (agent: AgentAnalyticsItem) => agent.received_favorites,
    },
  ]

  if (error) {
    return (
      <Card>
        <SectionHeader title="Top Performing Agents" />
        <p className="text-sm text-gray-500">{error}</p>
      </Card>
    )
  }

  return (
    <Card>
      <div className="flex items-center justify-between mb-4">
        <SectionHeader title="Top Performing Agents" />
        <Link
          to="/admin/agents"
          className="text-sm font-medium text-primary-600 hover:text-primary-700 transition-colors"
        >
          View All
        </Link>
      </div>
      <DataTable
        columns={columns}
        rows={agents}
        keyExtractor={(agent) => agent.agent_id}
        isLoading={loading}
        emptyTitle="No agents yet"
        emptyDescription="Agents will appear here once they are added to the platform."
      />
    </Card>
  )
}
