import { PropertyResponse } from '../../../lib/agentPropertiesApi'

interface InventoryQuickStatsProps {
  properties: PropertyResponse[]
}

function Stat({ label, value }: { label: string; value: number }) {
  return <div className="flex items-center justify-between gap-3"><span className="text-sm text-navy-600">{label}</span><span className="text-sm font-bold text-navy-900">{value}</span></div>
}

export function InventoryQuickStats({ properties }: InventoryQuickStatsProps) {
  return <section className="rounded-xl border border-border bg-surface p-5 shadow-card" aria-labelledby="inventory-stats-heading"><h2 id="inventory-stats-heading" className="mb-4 text-lg font-semibold text-navy-900">Inventory Quick Stats</h2><div className="space-y-4"><Stat label="Active listings" value={properties.filter((property) => property.status === 'available').length} /><Stat label="Reserved listings" value={properties.filter((property) => property.status === 'reserved').length} /><Stat label="Sold or rented" value={properties.filter((property) => property.status === 'sold' || property.status === 'rented').length} /><Stat label="Draft listings" value={properties.filter((property) => property.status === 'draft').length} /></div></section>
}
