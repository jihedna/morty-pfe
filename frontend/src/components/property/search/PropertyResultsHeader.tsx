import Select from '../../ui/Select'

interface PropertyResultsHeaderProps {
  title: string
  count: number
  sortBy: string
  sortDirection: string
  onSortChange: (sortBy: string, sortDirection: string) => void
}

const sortOptions = [
  { value: 'created_at:desc', label: 'Newest' },
  { value: 'created_at:asc', label: 'Oldest' },
  { value: 'price:asc', label: 'Price: Low to High' },
  { value: 'price:desc', label: 'Price: High to Low' },
  { value: 'area_sqm:desc', label: 'Area: Largest' },
  { value: 'area_sqm:asc', label: 'Area: Smallest' },
]

export function PropertyResultsHeader({
  title,
  count,
  sortBy,
  sortDirection,
  onSortChange,
}: PropertyResultsHeaderProps) {
  const value = `${sortBy}:${sortDirection}`

  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
      <div>
        <h1 className="text-xl sm:text-2xl font-semibold text-navy-900">{title}</h1>
        <p className="text-sm text-slate-500 mt-0.5">{count} results found</p>
      </div>

      <div className="flex items-center gap-2">
        <label htmlFor="sort" className="text-sm text-slate-500">
          Sort by
        </label>
        <Select
          id="sort"
          value={value}
          onChange={(newValue) => {
            const [field, direction] = newValue.split(':')
            onSortChange(field, direction)
          }}
          options={sortOptions}
          className="w-48"
          ariaLabel="Sort results"
        />
      </div>
    </div>
  )
}
