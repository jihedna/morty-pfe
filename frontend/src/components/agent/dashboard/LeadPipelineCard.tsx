import { Link } from 'react-router-dom'
import { AgentLeadResponse } from '../../../lib/agentLeadsApi'
import { formatCurrency, formatRelativeTime } from '../../../utils/format'

interface LeadPipelineCardProps {
  lead: AgentLeadResponse
}

function budgetLabel(lead: AgentLeadResponse) {
  if (lead.minimum_budget && lead.maximum_budget) return `${formatCurrency(lead.minimum_budget)} – ${formatCurrency(lead.maximum_budget)}`
  if (lead.minimum_budget) return `From ${formatCurrency(lead.minimum_budget)}`
  if (lead.maximum_budget) return `Up to ${formatCurrency(lead.maximum_budget)}`
  return 'Budget not specified'
}

export function LeadPipelineCard({ lead }: LeadPipelineCardProps) {
  return (
    <Link to={`/agent/leads/${lead.request_id}`} className="block rounded-lg border border-border bg-surface p-4 shadow-card transition-shadow hover:shadow-card-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2">
      <div className="mb-3 flex items-center justify-between gap-2">
        <span className="rounded bg-navy-100 px-2 py-0.5 text-[10px] font-bold uppercase text-navy-700">{lead.qualification_level}</span>
        <span className="text-xs text-navy-500">{formatRelativeTime(lead.created_at)}</span>
      </div>
      <h3 className="truncate text-sm font-semibold text-navy-900">{lead.summary || `${lead.property_type} request`}</h3>
      <p className="mt-1 truncate text-xs text-navy-500">{[lead.preferred_city, lead.preferred_district].filter(Boolean).join(' – ') || 'Location not specified'}</p>
      <div className="mt-4 flex items-center justify-between gap-2">
        <span className="text-xs font-semibold text-primary-700">{budgetLabel(lead)}</span>
        <span className="rounded-full border border-primary-200 bg-primary-50 px-2 py-0.5 text-xs font-semibold text-primary-700" aria-label={`Lead score ${lead.lead_score} out of 100`}>{lead.lead_score}/100</span>
      </div>
    </Link>
  )
}
