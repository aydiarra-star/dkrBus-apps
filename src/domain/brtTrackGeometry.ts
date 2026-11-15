import brtTrackGeoJson from '../../data/brt/brt-b1-osm.geojson?raw'

export type BrtTrackPosition = readonly [number, number]

export interface BrtDirectionalTrack {
  positions: readonly BrtTrackPosition[]
  osmRelationId: number
  directionFrom: string
  directionTo: string
  lengthM: number
  extractedOn: string
}

export const BRT_TRACK_ATTRIBUTION = 'Tracé BRT B1 : © les contributeurs d’OpenStreetMap (licence ODbL)'

function fail(reason: string): never {
  throw new Error(`data/brt/brt-b1-osm.geojson : ${reason}`)
}

/** Lit les deux relations directionnelles B1 sans fusionner ni inverser les sens. */
export function parseBrtTracks(source: string): readonly BrtDirectionalTrack[] {
  const collection = JSON.parse(source) as {
    type?: unknown
    features?: Array<{
      properties?: Record<string, unknown>
      geometry?: { type?: unknown; coordinates?: unknown }
    }>
  }
  if (collection.type !== 'FeatureCollection' || !Array.isArray(collection.features)) fail('FeatureCollection attendue')
  if (collection.features.length !== 2) fail('les deux sens B1 sont obligatoires')

  const tracks = collection.features.map((feature, featureIndex): BrtDirectionalTrack => {
    if (feature.geometry?.type !== 'LineString' || !Array.isArray(feature.geometry.coordinates)) {
      fail(`LineString attendue pour le sens ${featureIndex + 1}`)
    }
    const properties = feature.properties ?? {}
    if (properties.network !== 'SunuBRT' || properties.line !== 'B1') fail('réseau ou ligne inattendu')
    if (properties.status !== 'OSM_DIRECTIONAL_GEOMETRY_CANDIDATE') fail('statut de source manquant')
    const positions = (feature.geometry.coordinates as unknown[]).map((coordinate, index): BrtTrackPosition => {
      if (!Array.isArray(coordinate) || coordinate.length < 2) fail(`sommet ${index} illisible`)
      const [lon, lat] = coordinate as unknown[]
      if (typeof lon !== 'number' || typeof lat !== 'number' || !Number.isFinite(lon) || !Number.isFinite(lat)) fail(`sommet ${index} non numérique`)
      if (lat < 14.6 || lat > 14.85 || lon < -17.5 || lon > -17.3) fail(`sommet ${index} hors emprise Dakar`)
      return [lat, lon]
    })
    if (positions.length < 2) fail('au moins deux sommets attendus')
    const osmRelationId = properties.osm_relation
    const lengthM = properties.length_m
    const directionFrom = properties.direction_from
    const directionTo = properties.direction_to
    const extractedOn = properties.extracted_on
    if (typeof osmRelationId !== 'number' || typeof lengthM !== 'number' || typeof directionFrom !== 'string' || typeof directionTo !== 'string' || typeof extractedOn !== 'string') {
      fail('métadonnées directionnelles ou provenance manquantes')
    }
    if (properties.coordinate_count !== positions.length) fail('nombre de sommets incohérent')
    return { positions, osmRelationId, directionFrom, directionTo, lengthM, extractedOn }
  })

  const relations = new Set(tracks.map((track) => track.osmRelationId))
  if (relations.size !== 2 || !relations.has(19961937) || !relations.has(19961993)) fail('les deux relations OSM B1 attendues sont requises')
  const directions = new Set(tracks.map((track) => `${track.directionFrom}|${track.directionTo}`))
  if (!directions.has('Préfecture de Guédiawaye|Petersen') || !directions.has('Petersen|Préfecture de Guédiawaye')) fail('les deux directions opposées doivent être présentes')
  return tracks
}

export const BRT_B1_TRACKS = parseBrtTracks(brtTrackGeoJson)

/** Géométries OSM directionnelles disponibles pour une ligne cartographique. */
export function brtTrackPositionsForLine(lineId: string): readonly (readonly BrtTrackPosition[])[] | undefined {
  return lineId === 'brt-b1' ? BRT_B1_TRACKS.map((track) => track.positions) : undefined
}
