export interface Coordinates {
  latitude: number | null
  longitude: number | null
}

export function isValidCoordinates(coords: Coordinates): boolean {
  if (coords.latitude === null || coords.longitude === null) {
    return false
  }

  if (typeof coords.latitude !== 'number' || typeof coords.longitude !== 'number') {
    return false
  }

  if (isNaN(coords.latitude) || isNaN(coords.longitude)) {
    return false
  }

  if (!isFinite(coords.latitude) || !isFinite(coords.longitude)) {
    return false
  }

  if (coords.latitude < -90 || coords.latitude > 90) {
    return false
  }

  if (coords.longitude < -180 || coords.longitude > 180) {
    return false
  }

  return true
}

export function toLeafletPosition(coords: Coordinates): [number, number] | null {
  if (!isValidCoordinates(coords)) {
    return null
  }

  return [coords.latitude, coords.longitude]
}

export function normalizeCoordinates(
  latitude: number | string | null | undefined,
  longitude: number | string | null | undefined
): Coordinates {
  const parseNumber = (value: number | string | null | undefined): number | null => {
    if (value === null || value === undefined) {
      return null
    }
    if (typeof value === 'string') {
      const parsed = parseFloat(value)
      return isNaN(parsed) ? null : parsed
    }
    if (typeof value === 'number') {
      return isNaN(value) || !isFinite(value) ? null : value
    }
    return null
  }

  return {
    latitude: parseNumber(latitude),
    longitude: parseNumber(longitude),
  }
}
