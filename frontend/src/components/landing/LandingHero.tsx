import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

type SearchTab = 'buy' | 'rent' | 'commercial'

const TABS: { id: SearchTab; label: string; param: string }[] = [
  { id: 'buy', label: 'Buy', param: 'listing_type=sale' },
  { id: 'rent', label: 'Rent', param: 'listing_type=rent' },
  { id: 'commercial', label: 'Commercial', param: 'property_type=commercial' },
]

export default function LandingHero() {
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState<SearchTab>('buy')
  const [searchTerm, setSearchTerm] = useState('')

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    const params = new URLSearchParams()
    if (activeTab === 'buy') params.set('listing_type', 'sale')
    else if (activeTab === 'rent') params.set('listing_type', 'rent')
    else if (activeTab === 'commercial') params.set('property_type', 'commercial')
    if (searchTerm.trim()) params.set('search', searchTerm.trim())
    navigate(`/properties?${params.toString()}`)
  }

  return (
    <section className="relative flex items-center justify-center overflow-hidden hero-gradient-bg py-20 md:py-28" aria-label="Hero">
      <div className="absolute inset-0 opacity-10 pointer-events-none" aria-hidden="true">
        <div className="absolute top-10 left-10 w-72 h-72 bg-primary-500 rounded-full blur-[100px]" />
        <div className="absolute bottom-10 right-10 w-96 h-96 bg-navy-300 rounded-full blur-[120px]" />
      </div>

      <div className="relative z-10 w-full max-w-[1280px] px-4 sm:px-6 lg:px-10 text-center">
        <h1 className="text-3xl md:text-5xl font-bold text-white mb-4 max-w-3xl mx-auto leading-tight tracking-tight">
          Find Your Next Property in Tunisia
        </h1>
        <p className="text-base md:text-lg text-white/80 mb-10 max-w-2xl mx-auto leading-relaxed">
          Search properties across Tunisia and connect with suitable real estate agents.
        </p>

        <div className="glass-effect p-4 md:p-6 rounded-xl max-w-4xl mx-auto shadow-xl border border-white/20">
          <div className="flex gap-2 mb-4" role="group" aria-label="Search type">
            {TABS.map(tab => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                aria-pressed={activeTab === tab.id}
                className={`px-4 md:px-6 py-2 rounded-full text-sm font-medium transition-colors ${
                  activeTab === tab.id
                    ? 'bg-primary-500 text-white'
                    : 'bg-navy-200/50 text-navy-700 hover:bg-navy-200'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
          <form onSubmit={handleSearch} className="flex flex-col md:flex-row gap-2">
            <div className="flex-grow flex items-center bg-white border border-navy-200 rounded-lg px-4 py-3">
              <svg className="w-5 h-5 text-navy-400 mr-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <label htmlFor="hero-search" className="sr-only">Search by neighborhood, city, or property type</label>
              <input
                id="hero-search"
                type="text"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                placeholder="Enter neighborhood, city, or property type..."
                className="w-full bg-transparent border-none focus:ring-0 focus:outline-none text-navy-900 placeholder:text-navy-400 text-sm"
              />
            </div>
            <button
              type="submit"
              className="bg-primary-500 text-white px-6 md:px-8 py-3 rounded-lg text-sm font-semibold flex items-center justify-center gap-2 hover:bg-primary-600 transition-all active:scale-95"
            >
              Search Properties
            </button>
          </form>
        </div>
      </div>
    </section>
  )
}
