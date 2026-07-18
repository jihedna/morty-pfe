import { useState, useEffect, useRef, useCallback } from 'react'
import AppLayout from '../../components/layout/AppLayout'
import { adminAnalyticsApi, HeatMapPoint } from '../../lib/adminAnalyticsApi'
import { extractApiError } from '../../utils/format'
import Button from '../../components/ui/Button'
import { LoadingState, PageHeader, DataTable, Card } from '../../components/ui/shared'
import ErrorAlert from '../../components/ui/ErrorAlert'
import { addTunisiaMask, TUNISIA_CENTER, TUNISIA_BOUNDS } from '../../lib/tunisiaMap'

const DEMAND_COLORS: Record<string, string> = {
  low: '#93c5fd',
  medium: '#fbbf24',
  high: '#f97316',
  very_high: '#ef4444',
}

const TREND_LABELS: Record<string, string> = {
  falling: 'Falling',
  stable: 'Stable',
  rising: 'Rising',
  surging: 'Surging',
}

const DEMAND_LABELS: Record<string, string> = {
  low: 'Low',
  medium: 'Medium',
  high: 'High',
  very_high: 'Very high',
}

export default function AdminHeatMap() {
  const [points, setPoints] = useState<HeatMapPoint[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [colorBy, setColorBy] = useState<'demand' | 'price'>('demand')
  const [selectedPoint, setSelectedPoint] = useState<HeatMapPoint | null>(null)
  const mapContainerRef = useRef<HTMLDivElement>(null)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const mapInstanceRef = useRef<any>(null)

  useEffect(() => {
    adminAnalyticsApi
      .getHeatMap()
      .then(setPoints)
      .catch((err) => setError(extractApiError(err) || 'Failed to load heat map'))
      .finally(() => setIsLoading(false))
  }, [])

  const getColor = useCallback(
    (point: HeatMapPoint) => {
      if (colorBy === 'demand') return DEMAND_COLORS[point.demand_level] ?? '#6b7280'
      const intensity = point.normalized_price
      const r = Math.round(50 + intensity * 200)
      const g = Math.round(180 - intensity * 150)
      const b = 50
      return `rgb(${r},${g},${b})`
    },
    [colorBy]
  )

  const getRadius = (point: HeatMapPoint) => 18 + point.normalized_demand * 22

  useEffect(() => {
    if (isLoading || !mapContainerRef.current) return

    import('leaflet').then(({ default: L }) => {
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

      addTunisiaMask(L, map)

      const validPoints = points.filter((p) => p.latitude && p.longitude)

      validPoints.forEach((point) => {
        const color = getColor(point)
        const radius = getRadius(point)
        const marker = L.circleMarker([Number(point.latitude), Number(point.longitude)], {
          radius,
          color: 'white',
          weight: 1.5,
          fillColor: color,
          fillOpacity: 0.75,
        })
        marker.on('click', () => setSelectedPoint(point))
        marker.addTo(map)
      })

      if (validPoints.length > 0) {
        const lats = validPoints.map((p) => Number(p.latitude))
        const lngs = validPoints.map((p) => Number(p.longitude))
        const latPad = Math.max(0.2, (Math.max(...lats) - Math.min(...lats)) * 0.15)
        const lngPad = Math.max(0.2, (Math.max(...lngs) - Math.min(...lngs)) * 0.15)
        const sw: [number, number] = [Math.min(...lats) - latPad, Math.min(...lngs) - lngPad]
        const ne: [number, number] = [Math.max(...lats) + latPad, Math.max(...lngs) + lngPad]
        map.fitBounds([sw, ne], { padding: [30, 30] })
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
    {
      key: 'district',
      header: 'District',
      render: (p: HeatMapPoint) => <span className="font-medium">{p.district}</span>,
    },
    { key: 'city', header: 'City', render: (p: HeatMapPoint) => p.city },
    {
      key: 'price',
      header: 'Avg Price/m²',
      render: (p: HeatMapPoint) =>
        p.average_price_per_sqm ? `${Number(p.average_price_per_sqm).toLocaleString()} TND` : '—',
    },
    {
      key: 'rent',
      header: 'Avg Rent/m²',
      render: (p: HeatMapPoint) =>
        p.average_rent_per_sqm ? `${Number(p.average_rent_per_sqm).toLocaleString()} TND` : '—',
    },
    {
      key: 'yield',
      header: 'Yield',
      render: (p: HeatMapPoint) => (p.rental_yield ? `${Number(p.rental_yield).toFixed(1)}%` : '—'),
    },
    {
      key: 'demand',
      header: 'Demand',
      render: (p: HeatMapPoint) => (
        <span
          className="px-2 py-0.5 rounded-full text-xs font-medium"
          style={{ backgroundColor: DEMAND_COLORS[p.demand_level] + '33', color: '#374151' }}
        >
          {DEMAND_LABELS[p.demand_level] ?? p.demand_level}
        </span>
      ),
    },
    {
      key: 'trend',
      header: 'Trend',
      render: (p: HeatMapPoint) => TREND_LABELS[p.price_trend] ?? p.price_trend,
    },
    { key: 'transactions', header: 'Transactions', render: (p: HeatMapPoint) => p.transaction_count },
  ]

  return (
    <AppLayout>
      <div className="space-y-6">
        <PageHeader
          title="Heat Map"
          subtitle="Market area density and pricing visualisation"
          action={
            <div className="flex gap-2">
              <Button
                type="button"
                variant={colorBy === 'demand' ? 'primary' : 'outline'}
                size="sm"
                onClick={() => setColorBy('demand')}
              >
                By Demand
              </Button>
              <Button
                type="button"
                variant={colorBy === 'price' ? 'primary' : 'outline'}
                size="sm"
                onClick={() => setColorBy('price')}
              >
                By Price/m²
              </Button>
            </div>
          }
        />

        <Card>
          <h2 className="text-sm font-semibold text-gray-700 mb-2">Legend</h2>
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
              <div
                className="w-32 h-4 rounded"
                style={{ background: 'linear-gradient(to right, rgb(50,180,50), rgb(250,30,50))' }}
              />
              <span className="text-xs text-gray-500">Low price → High price</span>
            </div>
          )}
          <p className="text-xs text-gray-400 mt-2">
            Circle size shows demand. Click a circle to view details below. Values are normalised across loaded areas.
          </p>
        </Card>

        {error && <ErrorAlert message={error} />}

        {isLoading ? (
          <LoadingState message="Loading market heat map…" />
        ) : (
          <div className="rounded-2xl overflow-hidden shadow-card border border-gray-200 h-[60vh] min-h-[400px] max-h-[700px]">
            <div ref={mapContainerRef} className="h-full w-full" aria-label="Heat map" />
          </div>
        )}

        {selectedPoint && (
          <Card className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <p className="text-xs text-gray-500">Area</p>
              <p className="text-sm font-semibold">
                {selectedPoint.district}, {selectedPoint.city}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Avg Price/m²</p>
              <p className="text-sm font-semibold">
                {selectedPoint.average_price_per_sqm
                  ? `${Number(selectedPoint.average_price_per_sqm).toLocaleString()} TND`
                  : '—'}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Demand</p>
              <p className="text-sm font-semibold">
                {DEMAND_LABELS[selectedPoint.demand_level] ?? selectedPoint.demand_level}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Transactions</p>
              <p className="text-sm font-semibold">{selectedPoint.transaction_count}</p>
            </div>
          </Card>
        )}

        <DataTable
          columns={tableColumns}
          rows={points}
          keyExtractor={(p) => p.id}
          isLoading={isLoading}
          emptyTitle="No market heat map data"
          emptyDescription="Create market areas with coordinates to populate the map."
        />
      </div>
    </AppLayout>
  )
}
