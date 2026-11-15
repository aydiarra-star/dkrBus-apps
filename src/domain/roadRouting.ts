export interface RoadRoutePlace {
  label: string
  lat: number
  lng: number
}

export interface RoadRouteResult {
  origin: RoadRoutePlace
  destination: RoadRoutePlace
  coordinates: RoadRoutePlace[]
  distanceMeters: number
  durationSeconds: number
}

// Les services publics sont partagés : limiter les appels à une requête par seconde.
let lastPublicRequestAt = 0

async function waitForPublicRequest(): Promise<void> {
  const remaining = 1_000 - (Date.now() - lastPublicRequestAt)
  if (remaining > 0) await new Promise<void>((resolve) => window.setTimeout(resolve, remaining))
  lastPublicRequestAt = Date.now()
}

interface PhotonFeature {
  properties?: {
    name?: string
    city?: string
    district?: string
    state?: string
    country?: string
  }
  geometry?: { coordinates?: [number, number] }
}

function normalized(value: string): string {
  return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim()
}

/** Reconnaît une recherche de trajet écrite dans la barre « On va où ? ». */
export function parseRoadRouteQuery(query: string): { origin: string; destination: string } | null {
  const match = query.trim().match(/^(.+?)\s+(?:à|vers|->|→|jusqu['’]?à|to)\s+(.+)$/i)
  if (!match) return null
  const origin = match[1].replace(/^(?:itin[eé]raire|trajet)\s+(?:de\s+)?/i, '').trim()
  const destination = match[2].trim()
  if (!origin || !destination || normalized(origin) === normalized(destination)) return null
  return { origin, destination }
}

async function geocodeDakarPlace(place: string): Promise<RoadRoutePlace> {
  await waitForPublicRequest()
  const params = new URLSearchParams({ q: `${place}, Sénégal`, limit: '8', lang: 'fr', lat: '14.7167', lon: '-17.4677' })
  const response = await fetch(`https://photon.komoot.io/api/?${params.toString()}`, {
    headers: { Accept: 'application/json' },
    signal: AbortSignal.timeout(12_000),
  })
  if (!response.ok) throw new Error(`Le service de recherche de lieux a répondu ${response.status}.`)
  const payload: unknown = await response.json()
  if (!payload || typeof payload !== 'object' || !('features' in payload) || !Array.isArray(payload.features)) {
    throw new Error('La recherche de lieu a renvoyé une réponse illisible.')
  }
  const features = payload.features as PhotonFeature[]
  const feature = features.find((candidate) => {
    const country = candidate.properties?.country ?? ''
    const coordinates = candidate.geometry?.coordinates
    return normalized(country) === 'senegal' &&
      Array.isArray(coordinates) && coordinates.length >= 2 &&
      Number.isFinite(coordinates[0]) && Number.isFinite(coordinates[1])
  })
  if (!feature?.geometry?.coordinates) {
    throw new Error(`« ${place} » n’a pas été trouvé au Sénégal. Précisez le quartier ou la commune.`)
  }
  const [lng, lat] = feature.geometry.coordinates
  const label = feature.properties?.name ?? feature.properties?.city ?? feature.properties?.district ?? place
  return { label, lat, lng }
}

/**
 * Calcule un itinéraire routier réel à partir des routes OpenStreetMap.
 * Ce résultat décrit un parcours routier calculé, pas un itinéraire de bus ni
 * un trafic en direct. Les services publics utilisés peuvent être indisponibles.
 */
export async function calculateRoadRoute(originName: string, destinationName: string): Promise<RoadRouteResult> {
  const origin = await geocodeDakarPlace(originName)
  const destination = await geocodeDakarPlace(destinationName)
  await waitForPublicRequest()
  const params = new URLSearchParams({ overview: 'full', geometries: 'geojson', steps: 'false' })
  const url = `https://router.project-osrm.org/route/v1/driving/${origin.lng},${origin.lat};${destination.lng},${destination.lat}?${params.toString()}`
  const response = await fetch(url, {
    headers: { Accept: 'application/json' },
    signal: AbortSignal.timeout(15_000),
  })
  if (!response.ok) throw new Error(`Le calcul de route a répondu ${response.status}. Réessayez dans un instant.`)
  const payload: unknown = await response.json()
  if (!payload || typeof payload !== 'object' || !('code' in payload) || payload.code !== 'Ok' ||
      !('routes' in payload) || !Array.isArray(payload.routes) || payload.routes.length === 0) {
    throw new Error('Aucun itinéraire routier n’a été trouvé entre ces deux lieux.')
  }
  const route = payload.routes[0] as {
    distance?: number
    duration?: number
    geometry?: { coordinates?: [number, number][] }
  }
  const coordinates = route.geometry?.coordinates
  if (!Array.isArray(coordinates) || coordinates.length < 2 ||
      !coordinates.every((point) => Array.isArray(point) && Number.isFinite(point[0]) && Number.isFinite(point[1]))) {
    throw new Error('Le calculateur n’a pas fourni de tracé routier exploitable.')
  }
  return {
    origin,
    destination,
    coordinates: coordinates.map(([lng, lat]) => ({ label: '', lat, lng })),
    distanceMeters: Number.isFinite(route.distance) ? route.distance! : 0,
    durationSeconds: Number.isFinite(route.duration) ? route.duration! : 0,
  }
}
