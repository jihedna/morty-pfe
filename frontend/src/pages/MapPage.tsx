import { useState, useEffect, useRef } from 'react'
import AppLayout from '../components/layout/AppLayout'
import { mapApi, MapProperty, MapAgent } from '../lib/mapApi'
import { extractApiError } from '../utils/format'
import Button from '../components/ui/Button'
import Input from '../components/ui/Input'
import Select from '../components/ui/Select'
import LoadingState from '../components/ui/LoadingState'
import ErrorAlert from '../components/ui/ErrorAlert'
import { FilterPanel, PageHeader } from '../components/ui/shared'

const TUNISIA_CENTER: [number, number] = [33.8869, 9.5375]
const TUNISIA_BOUNDS: [[number, number], [number, number]] = [[30.2, 7.5], [37.8, 11.8]]

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

export default function MapPage() {
  const [properties, setProperties] = useState<MapProperty[]>([])
  const [agents, setAgents] = useState<MapAgent[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showAgents, setShowAgents] = useState(true)
  const [showProperties, setShowProperties] = useState(true)
  const [filters, setFilters] = useState({ city: '', property_type: '', listing_type: '', status: '' })
  const mapContainerRef = useRef<HTMLDivElement>(null)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const mapInstanceRef = useRef<any>(null)

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
      }).addTo(map)

      if (showProperties) {
        properties.forEach(prop => {
          if (prop.latitude && prop.longitude) {
            const popup = `
              <div style="min-width:180px">
                <p style="font-weight:600;font-size:13px;margin:0 0 4px">${prop.title}</p>
                <p style="font-size:11px;color:#666;margin:0 0 2px">${prop.city}${prop.district ? ' — ' + prop.district : ''}</p>
                <p style="font-size:13px;font-weight:700;color:#2563eb;margin:0 0 2px">${formatPrice(prop.price)}</p>
                <p style="font-size:11px;color:#999;margin:0 0 6px">${prop.area_sqm} m² · ${prop.bedrooms} ch · ${prop.bathrooms} sdb</p>
                <span style="font-size:11px;padding:2px 8px;border-radius:9999px;background:${prop.listing_type === 'sale' ? '#dcfce7' : '#f3e8ff'};color:${prop.listing_type === 'sale' ? '#15803d' : '#7c3aed'}">
                  ${prop.listing_type === 'sale' ? 'À vendre' : 'À louer'}
                </span>
                <br/><a href="/properties/${prop.id}" style="font-size:11px;color:#2563eb;margin-top:6px;display:inline-block">Voir le détail →</a>
              </div>`
            L.marker([prop.latitude, prop.longitude]).bindPopup(popup).addTo(map)
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
  }, [isLoading, properties, agents, showProperties, showAgents])

  const filterTypeOptions = [
    { value: '', label: 'Tous types' },
    { value: 'apartment', label: 'Appartement' },
    { value: 'house', label: 'Maison' },
    { value: 'villa', label: 'Villa' },
    { value: 'land', label: 'Terrain' },
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
          <div className="rounded-2xl overflow-hidden shadow-card border border-gray-200 h-[60vh] min-h-[400px] max-h-[700px]">
            <div ref={mapContainerRef} className="h-full w-full" />
          </div>
        )}

        <p className="text-xs text-gray-400 text-center">
          Carte OpenStreetMap · Propriétés avec coordonnées GPS uniquement · Les agents sont regroupés au centre de Tunis
        </p>
      </div>
    </AppLayout>
  )
}
