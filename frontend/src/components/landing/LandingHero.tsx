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
    <section className="relative flex min-h-[650px] items-center justify-center overflow-hidden bg-navy-900 py-20 md:py-28" aria-label="Hero">
      <div className="absolute inset-0 opacity-10 pointer-events-none" aria-hidden="true">
        <div className="absolute -top-20 left-10 w-96 h-96 bg-primary-500 rounded-full blur-[120px]" />
        <div className="absolute -bottom-24 right-0 w-[500px] h-[500px] bg-blue-400 rounded-full blur-[150px]" />
      </div>

      <div className="relative z-10 w-full max-w-[1280px] px-4 sm:px-6 lg:px-10 text-center">
        <div className="mx-auto mb-5 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-1.5 text-xs font-semibold text-white/80 backdrop-blur">
          <span className="h-2 w-2 rounded-full bg-success-400" /> Tunisia's intelligent real estate platform
        </div>
        <h1 className="text-4xl md:text-6xl lg:text-7xl font-semibold text-white mb-5 max-w-4xl mx-auto leading-[1.08] tracking-tight">
          Find Your Next Property in <span className="text-primary-400">Tunisia</span>
        </h1>
        <p className="text-base md:text-lg text-white/70 mb-10 max-w-2xl mx-auto leading-relaxed">
          Search properties across Tunisia and connect with suitable real estate agents.
        </p>

        <div className="bg-white/95 backdrop-blur-xl p-4 md:p-5 rounded-2xl max-w-5xl mx-auto shadow-2xl border border-white/30">
          <div className="flex gap-2 mb-4" role="group" aria-label="Search type">
            {TABS.map(tab => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                aria-pressed={activeTab === tab.id}
                className={`px-4 md:px-6 py-2 rounded-full text-sm font-medium transition-colors ${
                  activeTab === tab.id
                    ? 'bg-primary-500 text-white shadow-sm'
                    : 'bg-slate-100 text-navy-600 hover:bg-slate-200'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
          <form onSubmit={handleSearch} className="flex flex-col md:flex-row gap-2">
            <div className="flex-grow flex items-center bg-slate-50 border border-slate-200 rounded-xl px-4 py-3.5 focus-within:border-primary-300 focus-within:ring-2 focus-within:ring-primary-100 transition">
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
              className="bg-primary-500 text-white px-7 md:px-9 py-3.5 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 hover:bg-primary-600 shadow-lg shadow-primary-500/20 transition-all active:scale-95"
            >
              Search Properties
            </button>
          </form>
        </div>
        <div className="mx-auto mt-8 grid max-w-2xl grid-cols-3 divide-x divide-white/15 text-white">
          <div><p className="text-xl font-semibold">Explore</p><p className="mt-1 text-xs text-white/50">Available properties</p></div>
          <div><p className="text-xl font-semibold">Smart</p><p className="mt-1 text-xs text-white/50">Agent matching</p></div>
          <div><p className="text-xl font-semibold">Intelligent</p><p className="mt-1 text-xs text-white/50">Property assistance</p></div>
        </div>
      </div>
    </section>
  )
}
