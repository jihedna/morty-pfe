import { Card, SectionHeader } from '../../ui/shared'

export interface FunnelStage {
  label: string
  value: number
  colorClass: string
}

interface LeadFunnelCardProps {
  stages: FunnelStage[]
  overallConversion: number
  loading?: boolean
}

export default function LeadFunnelCard({
  stages,
  overallConversion,
  loading,
}: LeadFunnelCardProps) {
  const max = stages[0]?.value || 0

  if (loading) {
    return (
      <Card className="h-full">
        <SectionHeader title="Lead Funnel" />
        <div className="space-y-6 animate-pulse">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="space-y-2">
              <div className="h-4 bg-slate-200 rounded w-1/2" />
              <div className="h-3 bg-slate-200 rounded w-full" />
            </div>
          ))}
        </div>
      </Card>
    )
  }

  return (
    <Card className="h-full">
      <SectionHeader title="Lead Funnel" />
      <div className="space-y-6">
        {stages.map((stage, index) => {
          const pct = max > 0 ? (stage.value / max) * 100 : 0
          const indent = index * 16
          return (
            <div key={stage.label} style={{ marginLeft: indent }} className="space-y-1.5">
              <div className="flex items-baseline justify-between">
                <span className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                  {stage.label}
                </span>
                <span className="text-sm font-bold text-gray-900">
                  {stage.value.toLocaleString()}
                </span>
              </div>
              <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full ${stage.colorClass}`}
                  style={{ width: `${pct}%` }}
                />
              </div>
              <div className="text-xs text-gray-400">
                {max > 0 ? `${pct.toFixed(1)}%` : '—'}
              </div>
            </div>
          )
        })}

        <div className="pt-4 border-t border-slate-200">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-600">Overall conversion rate</span>
            <span className="text-2xl font-bold text-primary-600">
              {max > 0 ? `${overallConversion.toFixed(1)}%` : '—'}
            </span>
          </div>
        </div>
      </div>
    </Card>
  )
}
