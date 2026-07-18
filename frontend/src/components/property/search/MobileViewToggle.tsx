type MobileView = 'list' | 'map'

interface MobileViewToggleProps {
  view: MobileView
  onChange: (view: MobileView) => void
}

export function MobileViewToggle({ view, onChange }: MobileViewToggleProps) {
  return (
    <div
      className="lg:hidden fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-white rounded-full shadow-card-lg border border-slate-200 p-1 flex gap-1"
      role="tablist"
      aria-label="Results view"
    >
      <button
        type="button"
        role="tab"
        aria-selected={view === 'list'}
        onClick={() => onChange('list')}
        className={`px-4 py-2 text-sm font-medium rounded-full transition-colors ${
          view === 'list'
            ? 'bg-navy-900 text-white'
            : 'text-navy-700 hover:bg-navy-50'
        }`}
      >
        List
      </button>
      <button
        type="button"
        role="tab"
        aria-selected={view === 'map'}
        onClick={() => onChange('map')}
        className={`px-4 py-2 text-sm font-medium rounded-full transition-colors ${
          view === 'map'
            ? 'bg-navy-900 text-white'
            : 'text-navy-700 hover:bg-navy-50'
        }`}
      >
        Map
      </button>
    </div>
  )
}
