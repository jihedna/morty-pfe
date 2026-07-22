import { useState, useEffect, useRef, useCallback } from 'react'
import AppLayout from '../components/layout/AppLayout'
import { mapApi, MapProperty, MapAgent } from '../lib/mapApi'
import { extractApiError } from '../utils/format'
import Button from '../components/ui/Button'
import Input from '../components/ui/Input'
import Select from '../components/ui/Select'
import LoadingState from '../components/ui/LoadingState'
import ErrorAlert from '../components/ui/ErrorAlert'
import { FilterPanel, PageHeader } from '../components/ui/shared'
import { addTunisiaMask, TUNISIA_CENTER, TUNISIA_BOUNDS } from '../lib/tunisiaMap'
import { propertyApi } from '../lib/propertyApi'
import { PropertyPublicResponse } from '../types/property'

const CITY_COORDS: Record<string, [number, number]> = {
  tunis: [36.8190, 10.1658],
  ariana: [36.8625, 10.1956],
  sousse: [35.8245, 10.6346],
  sfax: [34.7406, 10.7603],
  nabeul: [36.4561, 10.7376],
  hammamet: [36.4008, 10.6146],
  bizerte: [37.2746, 9.8735],
  gabes: [33.8881, 9.9876],
  mahdia: [35.5047, 11.0622],
  monastir: [35.7643, 10.8113],
  kairouan: [35.6781, 10.0963],
  gafsa: [34.4250, 8.7842],
  tozeur: [33.9197, 8.1335],
  tataouine: [32.9297, 10.4518],
  medenine: [33.3549, 10.5055],
  benarous: [36.7534, 10.2248],
  manouba: [36.8092, 10.0972],
  zaghouan: [36.4020, 10.1424],
  siliana: [36.0850, 9.3708],
  beja: [36.7259, 9.1817],
  jendouba: [36.5012, 8.7803],
  kef: [36.1822, 8.7148],
  kasserine: [35.1722, 8.8304],
  sidi_bouzid: [35.0382, 9.4858],
  kebili: [33.7040, 8.9690],
  djerba: [33.8090, 10.9900],
}

function getCityCoords(cityName: string): [number, number] | null {
  const key = cityName.toLowerCase().replace(/[^a-z]/g, '')
  for (const [k, v] of Object.entries(CITY_COORDS)) {
    if (key.includes(k.replace('_', '')) || k.replace('_', '').includes(key)) return v
  }
  return null
}

const formatPrice = (price: number) =>
  new Intl.NumberFormat('fr-TN', { style: 'currency', currency: 'TND', maximumFractionDigits: 0 }).format(price)

const escapeHtml = (value: string | number | null | undefined) =>
  String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')

export default function MapPage() {
  const [properties, setProperties] = useState<MapProperty[]>([])
  const [agents, setAgents] = useState<MapAgent[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showAgents, setShowAgents] = useState(true)
  const [showProperties, setShowProperties] = useState(true)
  const [selectedProperty, setSelectedProperty] = useState<PropertyPublicResponse | null>(null)
  const [isPropertyLoading, setIsPropertyLoading] = useState(false)
  const [propertyError, setPropertyError] = useState<string | null>(null)
  const [filters, setFilters] = useState({ city: '', property_type: '', listing_type: '', status: '' })
  const mapContainerRef = useRef<HTMLDivElement>(null)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const mapInstanceRef = useRef<any>(null)

  const selectProperty = useCallback(async (propertyId: string) => {
    setIsPropertyLoading(true)
    setPropertyError(null)
    try {
      setSelectedProperty(await propertyApi.getProperty(propertyId))
    } catch (err) {
      setPropertyError(extractApiError(err) || 'Failed to load property details')
    } finally {
      setIsPropertyLoading(false)
    }
  }, [])

  useEffect(() => {
    const timer = window.setTimeout(() => mapInstanceRef.current?.invalidateSize(), 50)
    return () => window.clearTimeout(timer)
  }, [selectedProperty, isPropertyLoading])

  useEffect(() => {
    const load = async () => {
      setIsLoading(true)
      setError(null)
      try {
        const [props, agts] = await Promise.all([
          mapApi.getProperties({
            city: filters.city || undefined,
            property_type: filters.property_type || undefined,
            listing_type: filters.listing_type || undefined,
            status: filters.status || undefined,
          }),
          mapApi.getAgents(),
        ])
        setProperties(props)
        setAgents(agts)
      } catch (err) {
        setError(extractApiError(err) || 'Failed to load map data')
      } finally {
        setIsLoading(false)
      }
    }
    load()
  }, [filters])

  useEffect(() => {
    if (isLoading || !mapContainerRef.current) return

    // Dynamically import Leaflet to avoid SSR / module-level issues
    import('leaflet').then(({ default: L }) => {
      import('leaflet/dist/leaflet.css')

      // Fix default icon URLs
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      delete (L.Icon.Default.prototype as any)._getIconUrl
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
        iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
        shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
      })

      const agentIcon = new L.Icon({
        iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-red.png',
        shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
        iconSize: [25, 41],
        iconAnchor: [12, 41],
        popupAnchor: [1, -34],
      })

      // Destroy previous instance
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove()
        mapInstanceRef.current = null
      }

      const map = L.map(mapContainerRef.current!, {
        maxBounds: TUNISIA_BOUNDS,
        maxBoundsViscosity: 1.0,
        minZoom: 6,
        maxZoom: 17,
      }).setView(TUNISIA_CENTER, 7)
      mapInstanceRef.current = map

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        noWrap: true,
      }).addTo(map)

      addTunisiaMask(L, map)

      if (showProperties) {
        properties.forEach(prop => {
          if (prop.latitude && prop.longitude) {
            const location = [prop.district, prop.city].filter(Boolean).join(', ')
            const image = prop.image_url
              ? `<img src="${escapeHtml(prop.image_url)}" alt="" style="width:100%;height:112px;object-fit:cover;display:block" onerror="this.style.display='none'" />`
              : ''
            const preview = `
              <a href="/properties/${encodeURIComponent(prop.id)}" class="property-map-preview">
                <div class="property-map-preview-image">${image}</div>
                <div class="property-map-preview-body">
                  <p class="property-map-preview-price">${escapeHtml(formatPrice(prop.price))}</p>
                  <p class="property-map-preview-title">${escapeHtml(prop.title)}</p>
                  <p class="property-map-preview-location">${escapeHtml(location || 'Location unavailable')}</p>
                  <p class="property-map-preview-meta">${escapeHtml(prop.property_type)} · ${escapeHtml(prop.area_sqm)} m² · ${escapeHtml(prop.bedrooms)} ch · ${escapeHtml(prop.bathrooms)} sdb</p>
                </div>
              </a>`
            const marker = L.marker([prop.latitude, prop.longitude]).addTo(map)
            marker.bindTooltip(preview, {
              direction: 'right',
              offset: [16, 10],
              opacity: 1,
              className: 'property-map-tooltip',
              interactive: true,
              sticky: true,
            })
            marker.on('click', () => {
              marker.closeTooltip()
              selectProperty(prop.id)
            })
          }
        })
      }

      if (showAgents) {
        agents.forEach(agent => {
          const popup = `
            <div style="min-width:160px">
              <p style="font-weight:600;font-size:13px;margin:0 0 2px">${agent.name}</p>
              <p style="font-size:11px;color:#666;margin:0 0 2px">${agent.office}</p>
              <p style="font-size:11px;color:#999;margin:0">${agent.years_experience} ans d'expérience</p>
            </div>`
          const coords =
            agent.territories.map(getCityCoords).find(c => c !== null) ??
            TUNISIA_CENTER
          L.marker(coords, { icon: agentIcon }).bindPopup(popup).addTo(map)
        })
      }
    })

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove()
        mapInstanceRef.current = null
      }
    }
  }, [isLoading, properties, agents, showProperties, showAgents, selectProperty])

  const filterTypeOptions = [
    { value: '', label: 'Tous types' },
    { value: 'apartment', label: 'Appartement' },
    { value: 'house', label: 'Maison' },
    { value: 'villa', label: 'Villa' },
    { value: 'land', label: 'Terrain' },
    { value: 'terrain', label: 'Terrain (zero-room listings)' },
    { value: 'commercial', label: 'Commercial' },
  ]

  const listingTypeOptions = [
    { value: '', label: 'Vente & Location' },
    { value: 'sale', label: 'Vente' },
    { value: 'rent', label: 'Location' },
  ]

  const statusOptions = [
    { value: '', label: 'Disponible & Réservé' },
    { value: 'available', label: 'Disponible' },
    { value: 'reserved', label: 'Réservé' },
    { value: 'sold', label: 'Vendu' },
  ]

  const hasFilters = filters.city || filters.property_type || filters.listing_type || filters.status

  return (
    <AppLayout>
      <div className="space-y-6">
        <PageHeader
          title="Carte Immobilière"
          action={
            <div className="flex gap-2 flex-wrap">
              <Button
                type="button"
                variant={showProperties ? 'primary' : 'outline'}
                size="sm"
                onClick={() => setShowProperties(v => !v)}
              >
                Properties ({properties.length})
              </Button>
              <Button
                type="button"
                variant={showAgents ? 'danger' : 'outline'}
                size="sm"
                onClick={() => setShowAgents(v => !v)}
              >
                Agents ({agents.length})
              </Button>
            </div>
          }
        />

        <FilterPanel
          title="Filtres"
          hasFilters={!!hasFilters}
          onClear={() => setFilters({ city: '', property_type: '', listing_type: '', status: '' })}
        >
          <div className="flex flex-wrap gap-3">
            <Input
              id="map-city"
              value={filters.city}
              onChange={v => setFilters(f => ({ ...f, city: v }))}
              placeholder="Ville"
              className="w-40"
            />
            <Select
              id="map-property-type"
              value={filters.property_type}
              onChange={v => setFilters(f => ({ ...f, property_type: v }))}
              options={filterTypeOptions}
              className="w-44"
            />
            <Select
              id="map-listing-type"
              value={filters.listing_type}
              onChange={v => setFilters(f => ({ ...f, listing_type: v }))}
              options={listingTypeOptions}
              className="w-44"
            />
            <Select
              id="map-status"
              value={filters.status}
              onChange={v => setFilters(f => ({ ...f, status: v }))}
              options={statusOptions}
              className="w-44"
            />
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setFilters({ city: '', property_type: '', listing_type: '', status: '' })}
            >
              Réinitialiser
            </Button>
          </div>
        </FilterPanel>

        {error && (
          <ErrorAlert message={error} />
        )}

        {isLoading ? (
          <LoadingState message="Loading map data…" />
        ) : (
          <div className={`grid gap-5 items-start justify-center ${selectedProperty || isPropertyLoading || propertyError ? 'lg:grid-cols-[360px_minmax(480px,650px)]' : 'grid-cols-1 max-w-[680px] mx-auto'}`}>
            {(selectedProperty || isPropertyLoading || propertyError) && (
              <aside className="rounded-2xl border border-gray-200 bg-white shadow-card overflow-hidden lg:sticky lg:top-5 h-[72vh] min-h-[560px] overflow-y-auto">
                {isPropertyLoading ? (
                  <div className="h-full flex items-center justify-center"><LoadingState message="Loading property…" /></div>
                ) : propertyError ? (
                  <div className="p-5"><ErrorAlert message={propertyError} /></div>
                ) : selectedProperty ? (
                  <div>
                    <div className="relative h-56 bg-slate-100">
                      {selectedProperty.images[0] ? (
                        <img src={selectedProperty.images[0].image_url} alt={selectedProperty.title} className="h-full w-full object-cover" />
                      ) : (
                        <div className="h-full flex items-center justify-center text-sm text-slate-400">No image available</div>
                      )}
                      <button
                        type="button"
                        onClick={() => setSelectedProperty(null)}
                        className="absolute right-3 top-3 h-9 w-9 rounded-full bg-white/95 shadow flex items-center justify-center text-xl text-slate-700 hover:bg-white"
                        aria-label="Close property details"
                      >
                        ×
                      </button>
                    </div>
                    <div className="p-5 space-y-5">
                      <div>
                        <div className="flex items-center justify-between gap-3">
                          <span className="text-xs font-semibold uppercase tracking-wide text-red-600">{selectedProperty.listing_type === 'sale' ? 'For sale' : 'For rent'}</span>
                          <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium capitalize text-emerald-700">{selectedProperty.status}</span>
                        </div>
                        <h2 className="mt-2 text-xl font-bold text-slate-900">{selectedProperty.title}</h2>
                        <p className="mt-2 text-2xl font-bold text-red-600">{formatPrice(selectedProperty.price)}</p>
                        <p className="mt-2 text-sm text-slate-500">
                          {[selectedProperty.address_line, selectedProperty.city, selectedProperty.governorate].filter(Boolean).join(', ')}
                        </p>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        {[
                          ['Type', selectedProperty.property_type],
                          ['Area', `${selectedProperty.area_sqm} m²`],
                          ['Rooms', selectedProperty.rooms],
                          ['Bedrooms', selectedProperty.bedrooms],
                          ['Bathrooms', selectedProperty.bathrooms],
                          ['Floor', `${selectedProperty.floor_number} / ${selectedProperty.total_floors}`],
                        ].map(([label, value]) => (
                          <div key={String(label)} className="rounded-xl bg-slate-50 p-3">
                            <p className="text-xs text-slate-500">{label}</p>
                            <p className="mt-1 text-sm font-semibold capitalize text-slate-900">{value}</p>
                          </div>
                        ))}
                      </div>

                      {selectedProperty.features.length > 0 && (
                        <div>
                          <h3 className="text-sm font-semibold text-slate-900">Features</h3>
                          <div className="mt-2 flex flex-wrap gap-2">
                            {selectedProperty.features.map(feature => (
                              <span key={feature.id} className="rounded-full bg-blue-50 px-2.5 py-1 text-xs capitalize text-blue-700">
                                {feature.feature.replace(/_/g, ' ')}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {selectedProperty.description && (
                        <div>
                          <h3 className="text-sm font-semibold text-slate-900">Description</h3>
                          <p className="mt-2 text-sm leading-6 text-slate-600">{selectedProperty.description}</p>
                        </div>
                      )}

                      <Button as="Link" to={`/properties/${selectedProperty.id}`} className="w-full">
                        View Full Property
                      </Button>
                    </div>
                  </div>
                ) : null}
              </aside>
            )}
            <div className="rounded-2xl overflow-hidden shadow-card border border-gray-200 h-[72vh] min-h-[560px] max-h-[820px] w-full bg-slate-100">
              <div ref={mapContainerRef} className="h-full w-full" />
            </div>
          </div>
        )}

        <p className="text-xs text-gray-400 text-center">
          Carte OpenStreetMap · Propriétés avec coordonnées GPS uniquement · Les agents sont regroupés au centre de Tunis
        </p>
      </div>
    </AppLayout>
  )
}
