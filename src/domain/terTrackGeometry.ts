/**
 * Géométrie cartographique du TER Dakar – AIBD.
 *
 * SOURCE UNIQUE : `data/ter/ter-dakar-aibd.geojson`, lu tel quel. Ce module ne
 * lisse rien, ne simplifie rien, n'interpole rien et n'ajoute aucun point : il
 * ne fait que passer de l'ordre GeoJSON (longitude, latitude) à l'ordre attendu
 * par Leaflet (latitude, longitude).
 *
 * PORTÉE : uniquement le dessin de la ligne TER sur la carte. Les gares, les
 * fréquences, les temps de parcours, les prochains passages et le calculateur
 * ne lisent pas ce module et continuent de s'appuyer sur `corridors.ts`.
 *
 * NATURE : voies voyageurs (1 435 mm) numérisées par les contributeurs
 * d'OpenStreetMap, relation d'itinéraire 13645077, une seule des deux voies
 * principales, du heurtoir de Dakar au heurtoir de la gare de l'aéroport. Ce
 * n'est pas un levé ferroviaire certifié. Détail des sources et des contrôles :
 * `docs/ter-dakar-aibd-trace-reel-2026-11-15.md`.
 */
import trackGeoJson from '../../data/ter/ter-dakar-aibd.geojson?raw'

/** Identifiant, dans `CORRIDOR_LINES`, de la ligne dessinée avec cette géométrie. */
export const TER_TRACK_LINE_ID = 'ter-dakar-diamniadio'

/** Mention exigée par la licence ODbL, affichée dans le bandeau d'attribution de la carte. */
export const TER_TRACK_ATTRIBUTION = 'Tracé TER : © les contributeurs d’OpenStreetMap (licence ODbL)'

/** Position Leaflet : [latitude, longitude], en degrés WGS 84. */
export type TrackPosition = readonly [number, number]

export interface TerTrack {
  /** Sommets dans l'ordre du fichier, de Dakar vers l'aéroport. */
  positions: readonly TrackPosition[]
  /** Indice du sommet qui sépare la phase 1 (Dakar – Diamniadio) de la phase 2. */
  phase2StartIndex: number
  /** Longueur déclarée dans le fichier, en mètres. */
  lengthM: number
  /** Relation d'itinéraire OpenStreetMap dont la géométrie est issue. */
  osmRelationId: number
  /** Date de l'extrait OpenStreetMap (AAAA-MM-JJ). */
  extractedOn: string
}

function fail(reason: string): never {
  throw new Error(`data/ter/ter-dakar-aibd.geojson : ${reason}`)
}

/**
 * Lit le fichier GeoJSON livré. Refuse tout ce qui n'est pas « une seule
 * LineString en longitude/latitude » plutôt que de dessiner un tracé douteux.
 */
export function parseTerTrack(source: string): TerTrack {
  const collection = JSON.parse(source) as {
    type?: unknown
    features?: Array<{
      properties?: Record<string, unknown>
      geometry?: { type?: unknown; coordinates?: unknown }
    }>
  }
  if (collection.type !== 'FeatureCollection' || !Array.isArray(collection.features)) fail('FeatureCollection attendue')
  if (collection.features.length !== 1) fail('une seule entité attendue')
  const feature = collection.features[0]
  if (!feature || feature.geometry?.type !== 'LineString' || !Array.isArray(feature.geometry.coordinates)) fail('LineString attendue')

  const positions = (feature.geometry.coordinates as unknown[]).map((coordinate, index): TrackPosition => {
    if (!Array.isArray(coordinate) || coordinate.length < 2) fail(`sommet ${index} illisible`)
    const [lon, lat] = coordinate as unknown[]
    if (typeof lon !== 'number' || typeof lat !== 'number' || !Number.isFinite(lon) || !Number.isFinite(lat)) fail(`sommet ${index} non numérique`)
    if (lat < -90 || lat > 90 || lon < -180 || lon > 180) fail(`sommet ${index} hors WGS 84`)
    return [lat, lon]
  })
  if (positions.length < 2) fail('au moins deux sommets attendus')

  const properties = feature.properties ?? {}
  const phase2StartIndex = properties.phase_2_start_index
  const lengthM = properties.length_m
  const osmRelationId = properties.osm_relation
  const extractedOn = properties.extracted_on
  if (typeof phase2StartIndex !== 'number' || !Number.isInteger(phase2StartIndex) || phase2StartIndex <= 0 || phase2StartIndex >= positions.length - 1) {
    fail('phase_2_start_index invalide')
  }
  if (typeof lengthM !== 'number' || typeof osmRelationId !== 'number' || typeof extractedOn !== 'string') fail('propriétés de provenance manquantes')

  return { positions, phase2StartIndex, lengthM, osmRelationId, extractedOn }
}

export const TER_TRACK: TerTrack = parseTerTrack(trackGeoJson)

/**
 * Géométrie des voies pour une ligne du réseau de référence, si elle existe.
 * Seul le TER en a une ; les autres lignes gardent leur dessin habituel.
 */
export function trackPositionsForLine(lineId: string): readonly TrackPosition[] | undefined {
  return lineId === TER_TRACK_LINE_ID ? TER_TRACK.positions : undefined
}
