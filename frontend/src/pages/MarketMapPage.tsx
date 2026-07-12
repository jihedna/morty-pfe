import { useState, useEffect, useRef, useCallback } from 'react'
import AppLayout from '../components/layout/AppLayout'
import { marketApi, HeatMapPoint } from '../lib/marketApi'
import { extractApiError } from '../utils/format'
import Button from '../components/ui/Button'
import LoadingState from '../components/ui/LoadingState'
import ErrorAlert from '../components/ui/ErrorAlert'
import { PageHeader, DataTable, Card } from '../components/ui/shared'

const TUNISIA_CENTER: [number, number] = [36.8, 9.7]
const TUNISIA_BOUNDS: [[number, number], [number, number]] = [[30.2, 7.5], [37.8, 11.8]]
const TUNISIA_FIT_BOUNDS: [[number, number], [number, number]] = [[30.5, 7.8], [37.5, 11.6]]

const DEMAND_COLORS: Record<string, string> = {
  low: '#93c5fd',
  medium: '#fbbf24',
  high: '#f97316',
  very_high: '#ef4444',
}

const TREND_LABELS: Record<string, string> = {
  falling: '↘ Baisse',
  stable: '→ Stable',
  rising: '↗ Hausse',
  surging: '↑↑ Forte hausse',
}

const DEMAND_LABELS: Record<string, string> = {
  low: 'Faible',
  medium: 'Moyenne',
  high: 'Forte',
  very_high: 'Très forte',
}

export default function MarketMapPage() {
  const [points, setPoints] = useState<HeatMapPoint[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [colorBy, setColorBy] = useState<'demand' | 'price'>('demand')
  const mapContainerRef = useRef<HTMLDivElement>(null)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const mapInstanceRef = useRef<any>(null)

  useEffect(() => {
    marketApi.getHeatMap()
      .then(setPoints)
      .catch(err => setError(extractApiError(err) || 'Failed to load heat map'))
      .finally(() => setIsLoading(false))
  }, [])

  const getColor = useCallback((point: HeatMapPoint) => {
    if (colorBy === 'demand') return DEMAND_COLORS[point.demand_level] ?? '#6b7280'
    const intensity = point.normalized_price
    const r = Math.round(50 + intensity * 200)
    const g = Math.round(180 - intensity * 150)
    const b = 50
    return `rgb(${r},${g},${b})`
  }, [colorBy])

  const getRadius = (point: HeatMapPoint) => 18 + point.normalized_demand * 22

  useEffect(() => {
    if (isLoading || !mapContainerRef.current) return

    import('leaflet').then(({ default: L }) => {
      import('leaflet/dist/leaflet.css')

      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove()
        mapInstanceRef.current = null
      }

      const map = L.map(mapContainerRef.current!, {
        maxBounds: TUNISIA_BOUNDS,
        maxBoundsViscosity: 1.0,
        minZoom: 7,
        maxZoom: 17,
      }).setView(TUNISIA_CENTER, 8)
      mapInstanceRef.current = map

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      }).addTo(map)

      const validPoints = points.filter(p => p.latitude && p.longitude)

      validPoints.forEach(point => {
        const color = getColor(point)
        const radius = getRadius(point)
        const popup = `
          <div style="min-width:180px">
            <p style="font-weight:700;font-size:13px;margin:0 0 6px">📍 ${point.city} — ${point.district}</p>
            <p style="font-size:11px;margin:2px 0">💰 Prix : <b>${point.average_price_per_sqm ? Number(point.average_price_per_sqm).toLocaleString('fr-TN') + ' TND/m²' : 'N/D'}</b></p>
            <p style="font-size:11px;margin:2px 0">🏠 Loyer : <b>${point.average_rent_per_sqm ? Number(point.average_rent_per_sqm).toLocaleString('fr-TN') + ' TND/m²' : 'N/D'}</b></p>
            <p style="font-size:11px;margin:2px 0">📈 Rendement : <b>${point.rental_yield ? Number(point.rental_yield).toFixed(1) + '%' : 'N/D'}</b></p>
            <p style="font-size:11px;margin:2px 0">📊 Demande : <b>${DEMAND_LABELS[point.demand_level] ?? point.demand_level}</b></p>
            <p style="font-size:11px;margin:2px 0">📉 Tendance : <b>${TREND_LABELS[point.price_trend] ?? point.price_trend}</b></p>
            <p style="font-size:11px;color:#6b7280;margin-top:6px">${point.transaction_count} bien(s) dans ce secteur</p>
          </div>`
        L.circleMarker([Number(point.latitude), Number(point.longitude)], {
          radius,
          color: 'white',
          weight: 1.5,
          fillColor: color,
          fillOpacity: 0.75,
        }).bindPopup(popup).addTo(map)
      })

      // Fit to data points if available, otherwise fit to all of Tunisia
      if (validPoints.length > 0) {
        const lats = validPoints.map(p => Number(p.latitude))
        const lngs = validPoints.map(p => Number(p.longitude))
        const latPad = Math.max(0.2, (Math.max(...lats) - Math.min(...lats)) * 0.15)
        const lngPad = Math.max(0.2, (Math.max(...lngs) - Math.min(...lngs)) * 0.15)
        const sw: [number, number] = [Math.min(...lats) - latPad, Math.min(...lngs) - lngPad]
        const ne: [number, number] = [Math.max(...lats) + latPad, Math.max(...lngs) + lngPad]
        map.fitBounds([sw, ne], { padding: [30, 30] })
      } else {
        map.fitBounds(TUNISIA_FIT_BOUNDS)
      }
    })

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove()
        mapInstanceRef.current = null
      }
    }
  }, [isLoading, points, colorBy, getColor])

  const tableColumns = [
    { key: 'district', header: 'Quartier', render: (p: HeatMapPoint) => <span className="font-medium">{p.district}</span> },
    { key: 'city', header: 'Ville', render: (p: HeatMapPoint) => p.city },
    { key: 'price', header: 'Prix/m²', render: (p: HeatMapPoint) => p.average_price_per_sqm ? `${Number(p.average_price_per_sqm).toLocaleString()} TND` : '—' },
    { key: 'rent', header: 'Loyer/m²', render: (p: HeatMapPoint) => p.average_rent_per_sqm ? `${Number(p.average_rent_per_sqm).toLocaleString()} TND` : '—' },
    { key: 'yield', header: 'Rendement', render: (p: HeatMapPoint) => p.rental_yield ? `${Number(p.rental_yield).toFixed(1)}%` : '—' },
    { key: 'demand', header: 'Demande', render: (p: HeatMapPoint) => (
      <span className="px-2 py-0.5 rounded-full text-xs font-medium" style={{ backgroundColor: DEMAND_COLORS[p.demand_level] + '33', color: '#374151' }}>
        {DEMAND_LABELS[p.demand_level] ?? p.demand_level}
      </span>
    )},
    { key: 'trend', header: 'Tendance', render: (p: HeatMapPoint) => TREND_LABELS[p.price_trend] ?? p.price_trend },
    { key: 'transactions', header: 'Transactions', render: (p: HeatMapPoint) => p.transaction_count },
  ]

  return (
    <AppLayout>
      <div className="space-y-6">
        <PageHeader
          title="Carte de Chaleur du Marché"
          subtitle="Données agrégées issues du catalogue de propriétés"
          action={
            <div className="flex gap-2">
              <Button
                type="button"
                variant={colorBy === 'demand' ? 'primary' : 'outline'}
                size="sm"
                onClick={() => setColorBy('demand')}
              >
                Par demande
              </Button>
              <Button
                type="button"
                variant={colorBy === 'price' ? 'primary' : 'outline'}
                size="sm"
                onClick={() => setColorBy('price')}
              >
                Par prix/m²
              </Button>
            </div>
          }
        />

        <Card>
          <h2 className="text-sm font-semibold text-gray-700 mb-2">Légende</h2>
          {colorBy === 'demand' ? (
            <div className="flex gap-4 flex-wrap">
              {Object.entries(DEMAND_LABELS).map(([k, v]) => (
                <div key={k} className="flex items-center gap-1.5">
                  <div className="w-4 h-4 rounded-full" style={{ backgroundColor: DEMAND_COLORS[k] }} />
                  <span className="text-xs text-gray-600">{v}</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <div className="w-32 h-4 rounded" style={{ background: 'linear-gradient(to right, rgb(50,180,50), rgb(250,30,50))' }} />
              <span className="text-xs text-gray-500">Prix bas → Prix élevé</span>
            </div>
          )}
          <p className="text-xs text-gray-400 mt-2">La taille du cercle représente le niveau de demande. Cliquez sur un cercle pour les détails.</p>
        </Card>

        {error && (
          <ErrorAlert message={error} />
        )}

        {isLoading ? (
          <LoadingState message="Loading market heat map…" />
        ) : (
          <div className="rounded-2xl overflow-hidden shadow-card border border-gray-200 h-[60vh] min-h-[400px] max-h-[700px]">
            <div ref={mapContainerRef} className="h-full w-full" />
          </div>
        )}

        <DataTable
          columns={tableColumns}
          rows={points}
          keyExtractor={(p) => p.id}
          isLoading={isLoading}
          emptyTitle="Aucune donnée de marché"
          emptyDescription="Les données de chaleur du marché n'ont pas pu être chargées."
        />
      </div>
    </AppLayout>
  )
}
