import { Link } from 'react-router-dom'
import { AgentLeadResponse } from '../../../lib/agentLeadsApi'
import { EmptyState } from '../../ui/shared'
import { LeadPipelineCard } from './LeadPipelineCard'

const columns = [
  { key: 'hot', label: 'Hot', description: 'High priority leads' },
  { key: 'warm', label: 'Warm', description: 'Leads to follow up' },
  { key: 'cold', label: 'Cold', description: 'Early-stage leads' },
]

interface LeadsPipelineProps {
  leads: AgentLeadResponse[]
  total: number
}

export function LeadsPipeline({ leads, total }: LeadsPipelineProps) {
  return (
    <section className="space-y-4" aria-labelledby="leads-pipeline-heading">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 id="leads-pipeline-heading" className="text-xl font-semibold text-navy-900">Leads Pipeline</h2>
          <p className="mt-1 text-sm text-navy-500">Deterministic qualification bands from the current lead-scoring system.</p>
        </div>
        <Link to="/agent/leads" className="rounded-lg border border-border bg-surface px-3 py-2 text-sm font-medium text-navy-700 hover:bg-navy-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2">View all leads{total > leads.length ? ` (${total})` : ''}</Link>
      </div>
      {leads.length === 0 ? (
        <div className="rounded-xl border border-border bg-surface shadow-card"><EmptyState title="No leads found" description="No scored leads are available for this dashboard." action={<Link to="/agent/leads" className="text-sm font-semibold text-primary-700 hover:underline">Open leads</Link>} /></div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {columns.map((column) => {
            const columnLeads = leads.filter((lead) => lead.qualification_level.toLowerCase() === column.key)
            return (
              <div key={column.key} className="min-w-0 space-y-3" aria-labelledby={`pipeline-${column.key}-heading`}>
                <div className="flex items-center justify-between px-1">
                  <div><h3 id={`pipeline-${column.key}-heading`} className="text-xs font-bold uppercase tracking-wider text-navy-500">{column.label} ({columnLeads.length})</h3><p className="mt-1 text-xs text-navy-400">{column.description}</p></div>
                </div>
                {columnLeads.length > 0 ? columnLeads.map((lead) => <LeadPipelineCard key={lead.request_id} lead={lead} />) : <div className="rounded-lg border border-dashed border-border bg-navy-50/50 p-5 text-center text-xs text-navy-500">No {column.label.toLowerCase()} leads</div>}
              </div>
            )
          })}
        </div>
      )}
    </section>
  )
}
