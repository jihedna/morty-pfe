import { TUNISIA_POLYGON } from './tunisiaPolygon'

export const TUNISIA_CENTER: [number, number] = [34.0, 9.0]

export const TUNISIA_BOUNDS: [[number, number], [number, number]] = [
  [30.2, 7.5],
  [37.8, 11.8],
]

export const TUNISIA_FIT_BOUNDS: [[number, number], [number, number]] = [
  [30.5, 7.8],
  [37.5, 11.6],
]

const WORLD_RING: [number, number][] = [
  [-90, -180],
  [90, -180],
  [90, 180],
  [-90, 180],
  [-90, -180],
]

const MASK_OPTIONS: {
  color: string
  weight: number
  fillColor: string
  fillOpacity: number
  interactive: boolean
} = {
  color: 'transparent',
  weight: 0,
  fillColor: '#a5d8ff',
  fillOpacity: 0.85,
  interactive: false,
}

export function addTunisiaMask(L: typeof import('leaflet'), map: import('leaflet').Map): void {
  L.polygon([WORLD_RING, TUNISIA_POLYGON], MASK_OPTIONS).addTo(map)
}

export function tunisiaMapOptions(): {
  maxBounds: [[number, number], [number, number]]
  maxBoundsViscosity: number
  minZoom: number
  maxZoom: number
} {
  return {
    maxBounds: TUNISIA_BOUNDS,
    maxBoundsViscosity: 1.0,
    minZoom: 6,
    maxZoom: 19,
  }
}
