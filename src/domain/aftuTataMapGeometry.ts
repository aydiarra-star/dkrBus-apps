import type { AftuTataMapRoute } from '../data/aftuTataMapRoutes'

export interface AftuTataMapTrack {
  id: string
  line: string
  positions: [number, number][]
}

/** Construit une route routière OSRM en conservant strictement l'ordre des waypoints publiés. */
export function buildAftuTataOsrmUrl(route: AftuTataMapRoute): string | null {
  if (route.waypoints.length < 2) return null
  const coordinates = route.waypoints.map((point) => {
    if (!Number.isFinite(point.lat) || !Number.isFinite(point.lon)) return null
    if (point.lat < 14 || point.lat > 16 || point.lon < -18 || point.lon > -16) return null
    return `${point.lon},${point.lat}`
  })
  if (coordinates.some((point) => point === null)) return null
  const params = new URLSearchParams({ overview: 'full', geometries: 'geojson', steps: 'false' })
  return `https://router.project-osrm.org/route/v1/driving/${coordinates.join(';')}?${params.toString()}`
}

/** Convertit la géométrie OSRM GeoJSON en coordonnées Leaflet [lat, lon]. */
export function osrmGeometryToLeafletPositions(value: unknown): [number, number][] {
  if (!Array.isArray(value)) return []
  return value
    .filter((point): point is [number, number] =>
      Array.isArray(point)
      && Number.isFinite(point[0])
      && Number.isFinite(point[1])
      && point[0] >= -18
      && point[0] <= -16
      && point[1] >= 14
      && point[1] <= 16,
    )
    .map(([lon, lat]) => [lat, lon] as [number, number])
}
