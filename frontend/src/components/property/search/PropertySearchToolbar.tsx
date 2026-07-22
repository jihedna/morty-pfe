import { useState, useEffect, FormEvent } from 'react'
import { PropertyListFilters, PropertyType } from '../../../types/property'
import Input from '../../ui/Input'
import Select from '../../ui/Select'
import Button from '../../ui/Button'

interface PropertySearchToolbarProps {
  filters: PropertyListFilters
  onSearch: (search: string) => void
  onFilterChange: (key: keyof PropertyListFilters, value: string | number | boolean | undefined) => void
  onOpenMoreFilters: () => void
}

const propertyTypeOptions = [
  { value: '', label: 'Any Type' },
  { value: PropertyType.APARTMENT, label: 'Apartment' },
  { value: PropertyType.HOUSE, label: 'House' },
  { value: PropertyType.VILLA, label: 'Villa' },
  { value: PropertyType.LAND, label: 'Land' },
  { value: PropertyType.TERRAIN, label: 'Terrain' },
  { value: PropertyType.OFFICE, label: 'Office' },
  { value: PropertyType.COMMERCIAL, label: 'Commercial' },
  { value: PropertyType.WAREHOUSE, label: 'Warehouse' },
  { value: PropertyType.PENTHOUSE, label: 'Penthouse' },
  { value: PropertyType.STUDIO, label: 'Studio' },
  { value: PropertyType.DUPLEX, label: 'Duplex' },
]

const bedroomOptions = [
  { value: '', label: 'Any Beds' },
  { value: '1', label: '1+' },
  { value: '2', label: '2+' },
  { value: '3', label: '3+' },
  { value: '4', label: '4+' },
  { value: '5', label: '5+' },
]

const bathroomOptions = [
  { value: '', label: 'Any Baths' },
  { value: '1', label: '1+' },
  { value: '2', label: '2+' },
  { value: '3', label: '3+' },
  { value: '4', label: '4+' },
]

export function PropertySearchToolbar({
  filters,
  onSearch,
  onFilterChange,
  onOpenMoreFilters,
}: PropertySearchToolbarProps) {
  const [draftSearch, setDraftSearch] = useState(filters.search || '')

  useEffect(() => {
    setDraftSearch(filters.search || '')
  }, [filters.search])

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    onSearch(draftSearch.trim())
  }

  const handleSearchChange = (value: string) => {
    setDraftSearch(value)
    onSearch(value.trim())
  }

  return (
    <header className="sticky top-16 z-40 bg-white border-b border-navy-200 shadow-sm">
      <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-10 py-4">
        <form
          onSubmit={handleSubmit}
          className="flex flex-col lg:flex-row gap-4 items-start lg:items-center"
          aria-label="Property search"
        >
          <div className="relative flex-1 w-full">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-navy-400" aria-hidden="true">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </span>
            <Input
              id="search"
              value={draftSearch}
              onChange={handleSearchChange}
              placeholder="Enter city, district, or keywords..."
              className="pl-10"
              ariaLabel="Search properties"
            />
          </div>

          <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
            <div className="flex items-center gap-2">
              <Input
                id="minimum_price"
                type="number"
                value={filters.minimum_price !== undefined ? String(filters.minimum_price) : ''}
                onChange={(value) => onFilterChange('minimum_price', value !== '' ? Number(value) : undefined)}
                placeholder="Min TND"
                className="w-28"
                ariaLabel="Minimum price"
              />
              <span className="text-navy-400">-</span>
              <Input
                id="maximum_price"
                type="number"
                value={filters.maximum_price !== undefined ? String(filters.maximum_price) : ''}
                onChange={(value) => onFilterChange('maximum_price', value !== '' ? Number(value) : undefined)}
                placeholder="Max TND"
                className="w-28"
                ariaLabel="Maximum price"
              />
            </div>

            <Select
              id="property_type"
              value={filters.property_type || ''}
              onChange={(value) => onFilterChange('property_type', value || undefined)}
              options={propertyTypeOptions}
              className="w-40"
              ariaLabel="Property type"
            />

            <Select
              id="minimum_bedrooms"
              value={filters.minimum_bedrooms ? String(filters.minimum_bedrooms) : ''}
              onChange={(value) => onFilterChange('minimum_bedrooms', value ? Number(value) : undefined)}
              options={bedroomOptions}
              className="w-32"
              ariaLabel="Minimum bedrooms"
            />

            <Select
              id="minimum_bathrooms"
              value={filters.minimum_bathrooms ? String(filters.minimum_bathrooms) : ''}
              onChange={(value) => onFilterChange('minimum_bathrooms', value ? Number(value) : undefined)}
              options={bathroomOptions}
              className="w-32"
              ariaLabel="Minimum bathrooms"
            />

            <Button type="button" variant="outline" onClick={onOpenMoreFilters} className="gap-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
              </svg>
              More Filters
            </Button>
          </div>
        </form>
      </div>
    </header>
  )
}
