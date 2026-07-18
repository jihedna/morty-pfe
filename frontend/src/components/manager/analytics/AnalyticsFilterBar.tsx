import { FilterPanel } from '../../ui/shared'
import Select from '../../ui/Select'
import Input from '../../ui/Input'
import Button from '../../ui/Button'
import type { DateRangePreset, ManagerAnalyticsFilters } from '../../../hooks/useManagerAnalytics'

interface AnalyticsFilterBarProps {
  filters: ManagerAnalyticsFilters
  cities: string[]
  districts: string[]
  agents: { id: string; first_name: string; last_name: string }[]
  onChange: (updates: Partial<ManagerAnalyticsFilters>) => void
  onClear: () => void
}

const PRESETS: { value: DateRangePreset; label: string }[] = [
  { value: 'last30', label: 'Last 30 Days' },
  { value: 'lastQuarter', label: 'Last Quarter' },
  { value: 'ytd', label: 'Year to Date' },
  { value: 'custom', label: 'Custom Range' },
]

export default function AnalyticsFilterBar({
  filters,
  cities,
  districts,
  agents,
  onChange,
  onClear,
}: AnalyticsFilterBarProps) {
  const hasFilters = Boolean(
    filters.city || filters.district || filters.agentId || filters.preset !== 'last30'
  )

  const cityOptions = [{ value: '', label: 'All cities' }, ...cities.map((c) => ({ value: c, label: c }))]
  const districtOptions = [{ value: '', label: 'All districts' }, ...districts.map((d) => ({ value: d, label: d }))]
  const agentOptions = [
    { value: '', label: 'All agents' },
    ...agents.map((a) => ({ value: a.id, label: `${a.first_name} ${a.last_name}` })),
  ]

  return (
    <FilterPanel title="Filters" onClear={onClear} hasFilters={hasFilters}>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Select
          id="date-preset"
          label="Date Range"
          value={filters.preset}
          onChange={(value) => onChange({ preset: value as DateRangePreset })}
          options={PRESETS}
        />

        {filters.preset === 'custom' && (
          <>
            <Input
              id="custom-date-from"
              label="Start date"
              type="date"
              value={filters.customDateFrom}
              onChange={(value) => onChange({ customDateFrom: value })}
              max={filters.customDateTo}
            />
            <Input
              id="custom-date-to"
              label="End date"
              type="date"
              value={filters.customDateTo}
              onChange={(value) => onChange({ customDateTo: value })}
              min={filters.customDateFrom}
            />
          </>
        )}

        <Select
          id="city-filter"
          label="City"
          value={filters.city}
          onChange={(value) => onChange({ city: value, district: '' })}
          options={cityOptions}
        />

        <Select
          id="district-filter"
          label="District"
          value={filters.district}
          onChange={(value) => onChange({ district: value })}
          options={districtOptions}
          disabled={!filters.city}
        />

        <Select
          id="agent-filter"
          label="Agent"
          value={filters.agentId}
          onChange={(value) => onChange({ agentId: value })}
          options={agentOptions}
        />
      </div>

      <div className="flex justify-end">
        <Button type="button" variant="outline" onClick={onClear} disabled={!hasFilters}>
          Clear filters
        </Button>
      </div>
    </FilterPanel>
  )
}
