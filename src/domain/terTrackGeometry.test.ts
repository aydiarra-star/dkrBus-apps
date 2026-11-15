import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { CORRIDOR_LINES, TER_STOPS, getCorridorStop, haversineMeters } from './corridors'
import { TER_TRACK, TER_TRACK_ATTRIBUTION, TER_TRACK_LINE_ID, parseTerTrack, trackPositionsForLine, type TrackPosition } from './terTrackGeometry'

/** Le fichier livré, relu directement sur le disque, indépendamment du module. */
const delivered = JSON.parse(readFileSync(new URL('../../data/ter/ter-dakar-aibd.geojson', import.meta.url), 'utf8')) as {
  bbox: [number, number, number, number]
  features: Array<{ properties: Record<string, unknown>; geometry: { type: string; coordinates: Array<[number, number]> } }>
}
const deliveredCoordinates = delivered.features[0].geometry.coordinates

const point = ([lat, lon]: TrackPosition) => ({ lat, lon })
const segmentLength = (a: TrackPosition, b: TrackPosition) => haversineMeters(point(a), point(b))
const pathLength = (positions: readonly TrackPosition[]) =>
  positions.slice(1).reduce((total, position, index) => total + segmentLength(positions[index], position), 0)

/** Cap d'un segment en degrés, suffisant à cette latitude pour mesurer un changement de direction. */
function bearing(a: TrackPosition, b: TrackPosition): number {
  const dLat = b[0] - a[0]
  const dLon = (b[1] - a[1]) * Math.cos((a[0] * Math.PI) / 180)
  return (Math.atan2(dLon, dLat) * 180) / Math.PI
}

/** Plus grand changement de direction entre deux segments consécutifs, en degrés. */
function sharpestTurn(positions: readonly TrackPosition[]): number {
  let worst = 0
  for (let index = 1; index < positions.length - 1; index += 1) {
    const turn = Math.abs(((bearing(positions[index], positions[index + 1]) - bearing(positions[index - 1], positions[index]) + 540) % 360) - 180)
    worst = Math.max(worst, turn)
  }
  return worst
}

/** Distance en mètres d'un point au tracé (projection plane locale, exacte au mètre près ici). */
function distanceToTrack(target: { lat: number; lon: number }, positions: readonly TrackPosition[]): number {
  const k = 111_195
  const cos = Math.cos((target.lat * Math.PI) / 180)
  const xy = ([lat, lon]: TrackPosition) => [(lon - target.lon) * k * cos, (lat - target.lat) * k] as const
  let best = Infinity
  for (let index = 0; index < positions.length - 1; index += 1) {
    const [ax, ay] = xy(positions[index])
    const [bx, by] = xy(positions[index + 1])
    const dx = bx - ax
    const dy = by - ay
    const t = Math.max(0, Math.min(1, -(ax * dx + ay * dy) / (dx * dx + dy * dy)))
    best = Math.min(best, Math.hypot(ax + t * dx, ay + t * dy))
  }
  return best
}

const track = TER_TRACK.positions
const boundary = TER_TRACK.phase2StartIndex
const phase1 = track.slice(0, boundary + 1)
const phase2 = track.slice(boundary)

describe('tracé TER Dakar – AIBD : fidélité au fichier livré', () => {
  it('reprend les 491 sommets du fichier, dans le même ordre, sans en retirer ni en ajouter', () => {
    expect(delivered.features).toHaveLength(1)
    expect(delivered.features[0].geometry.type).toBe('LineString')
    expect(deliveredCoordinates).toHaveLength(491)
    expect(track).toHaveLength(491)
    // Égalité stricte, valeur pour valeur : ni arrondi, ni lissage, ni interpolation.
    expect(track.map(([lat, lon]) => [lon, lat])).toEqual(deliveredCoordinates)
  })

  it('reprend la frontière de phase et la provenance déclarées dans le fichier', () => {
    const properties = delivered.features[0].properties
    expect(boundary).toBe(319)
    expect(boundary).toBe(properties.phase_2_start_index)
    expect(TER_TRACK.lengthM).toBe(properties.length_m)
    expect(TER_TRACK.osmRelationId).toBe(13645077)
    expect(TER_TRACK.extractedOn).toBe('2026-11-15')
  })

  it('crédite OpenStreetMap sous licence ODbL, comme le fichier', () => {
    expect(delivered.features[0].properties.attribution).toBe("© les contributeurs d'OpenStreetMap")
    expect(delivered.features[0].properties.license).toBe('ODbL 1.0')
    expect(TER_TRACK_ATTRIBUTION).toContain('© les contributeurs d’OpenStreetMap')
    expect(TER_TRACK_ATTRIBUTION).toContain('ODbL')
  })
})

describe('tracé TER Dakar – AIBD : système de coordonnées', () => {
  it('est en degrés WGS 84 et livré à Leaflet dans l’ordre latitude, longitude', () => {
    for (const [lat, lon] of track) {
      // Presqu'île du Cap-Vert : une inversion longitude/latitude sortirait de ces bornes.
      expect(lat).toBeGreaterThan(14.6)
      expect(lat).toBeLessThan(14.8)
      expect(lon).toBeGreaterThan(-17.5)
      expect(lon).toBeLessThan(-17.0)
    }
  })

  it('occupe exactement l’emprise déclarée dans le fichier', () => {
    const lats = track.map(([lat]) => lat)
    const lons = track.map(([, lon]) => lon)
    expect([Math.min(...lons), Math.min(...lats), Math.max(...lons), Math.max(...lats)]).toEqual(delivered.bbox)
    expect(delivered.bbox).toEqual([-17.4419467, 14.6725636, -17.0636528, 14.7654111])
  })

  it('refuse un fichier qui ne serait pas une LineString unique en longitude, latitude', () => {
    const feature = (geometry: unknown) => JSON.stringify({ type: 'FeatureCollection', features: [{ type: 'Feature', properties: delivered.features[0].properties, geometry }] })
    expect(() => parseTerTrack(feature({ type: 'MultiLineString', coordinates: [deliveredCoordinates] }))).toThrow(/LineString/)
    expect(() => parseTerTrack(feature({ type: 'LineString', coordinates: [[-17.4, 14.7], [-17.3, 140.7]] }))).toThrow(/WGS 84/)
    expect(() => parseTerTrack(feature({ type: 'LineString', coordinates: [[-17.4, 14.7]] }))).toThrow(/deux sommets/)
    expect(() => parseTerTrack(JSON.stringify({ type: 'FeatureCollection', features: [] }))).toThrow(/une seule entité/)
  })
})

describe('tracé TER Dakar – AIBD : continuité', () => {
  it('enchaîne les 491 sommets sans doublon, sans saut et sans rebroussement', () => {
    const lengths = track.slice(1).map((position, index) => segmentLength(track[index], position))
    expect(lengths).toHaveLength(490)
    expect(Math.min(...lengths)).toBeGreaterThan(0)
    // Le plus long alignement droit du fichier mesure 1,72 km ; au-delà, il manquerait un tronçon.
    expect(Math.max(...lengths)).toBeLessThan(2_000)
    // Une voie ferrée ne tourne pas à angle vif : le maximum du fichier est de 7°.
    expect(sharpestTurn(track)).toBeLessThan(15)
    expect(new Set(track.map(([lat, lon]) => `${lat},${lon}`)).size).toBe(491)
  })

  it('progresse vers l’est de Dakar à l’aéroport et mesure la longueur annoncée', () => {
    expect(track[490][1]).toBeGreaterThan(track[0][1])
    // Le fichier annonce 55 436 m sur l'ellipsoïde ; la sphère de `haversineMeters` s'en écarte de 0,1 %.
    expect(Math.abs(pathLength(track) - TER_TRACK.lengthM) / TER_TRACK.lengthM).toBeLessThan(0.002)
  })
})

describe('tracé TER Dakar – AIBD : phase 1, Dakar – Diamniadio', () => {
  it('compte 320 sommets pour 35,6 km, sans saut ni angle vif', () => {
    expect(phase1).toHaveLength(320)
    expect(Math.abs(pathLength(phase1) - 35_643) / 35_643).toBeLessThan(0.002)
    expect(Math.max(...phase1.slice(1).map((position, index) => segmentLength(phase1[index], position)))).toBeLessThan(2_000)
    expect(sharpestTurn(phase1)).toBeLessThan(15)
  })

  it('passe par les treize gares et haltes de Dakar à Diamniadio', () => {
    const stops = TER_STOPS.slice(0, 13)
    expect(stops[0].id).toBe('ter-dakar')
    expect(stops[12].id).toBe('ter-diamniadio')
    for (const stop of stops) {
      expect(distanceToTrack(stop, phase1), stop.name).toBeLessThan(15)
    }
  })
})

describe('tracé TER Dakar – AIBD : phase 2, Diamniadio – AIBD', () => {
  it('compte 172 sommets pour 19,8 km, sans saut ni angle vif', () => {
    expect(phase2).toHaveLength(172)
    expect(Math.abs(pathLength(phase2) - 19_792) / 19_792).toBeLessThan(0.002)
    expect(Math.max(...phase2.slice(1).map((position, index) => segmentLength(phase2[index], position)))).toBeLessThan(2_000)
    expect(sharpestTurn(phase2)).toBeLessThan(15)
  })

  it('ne dessert plus aucune gare de la phase 1 et se termine à l’aéroport', () => {
    const aibd = getCorridorStop('ter-aibd')!
    expect(distanceToTrack(aibd, phase2)).toBeLessThan(50)
    for (const stop of TER_STOPS.slice(0, 12)) {
      expect(distanceToTrack(stop, phase2), stop.name).toBeGreaterThan(1_000)
    }
  })
})

describe('tracé TER Dakar – AIBD : raccord de Diamniadio', () => {
  const diamniadio = getCorridorStop('ter-diamniadio')!

  it('place la frontière de phase sur la gare de Diamniadio', () => {
    expect(track[boundary]).toEqual([14.7160563, -17.1984391])
    expect(haversineMeters(diamniadio, point(track[boundary]))).toBeLessThan(5)
  })

  it('relie les deux phases par un sommet commun, sans rupture ni changement de direction', () => {
    expect(phase1[phase1.length - 1]).toBe(phase2[0])
    expect(segmentLength(track[boundary - 1], track[boundary])).toBeLessThan(500)
    expect(segmentLength(track[boundary], track[boundary + 1])).toBeLessThan(500)
    const turn = Math.abs(((bearing(track[boundary], track[boundary + 1]) - bearing(track[boundary - 1], track[boundary]) + 540) % 360) - 180)
    expect(turn).toBeLessThan(5)
  })

  it('poursuit vers l’est après Diamniadio : la phase 2 ne revient jamais sur la phase 1', () => {
    for (const [, lon] of phase2.slice(1)) {
      expect(lon).toBeGreaterThan(track[boundary][1])
    }
  })
})

describe('tracé TER Dakar – AIBD : extrémités', () => {
  it('commence au heurtoir de la gare de Dakar', () => {
    expect(track[0]).toEqual([14.6760751, -17.4334675])
    expect(haversineMeters(getCorridorStop('ter-dakar')!, point(track[0]))).toBeLessThan(25)
  })

  it('se termine au heurtoir de la gare de l’aéroport', () => {
    expect(track[490]).toEqual([14.6725636, -17.0643331])
    expect(haversineMeters(getCorridorStop('ter-aibd')!, point(track[490]))).toBeLessThan(50)
  })
})

describe('tracé TER Dakar – AIBD : aucune autre mobilité concernée', () => {
  it('ne fournit une géométrie de voie que pour la ligne TER', () => {
    expect(trackPositionsForLine(TER_TRACK_LINE_ID)).toBe(TER_TRACK.positions)
    const others = CORRIDOR_LINES.filter((line) => line.id !== TER_TRACK_LINE_ID)
    expect(others.length).toBeGreaterThan(0)
    for (const line of others) {
      expect(trackPositionsForLine(line.id), line.id).toBeUndefined()
    }
  })

  it('désigne bien l’unique ligne TER du réseau de référence, dont les gares sont inchangées', () => {
    const terLines = CORRIDOR_LINES.filter((line) => line.network === 'ter')
    expect(terLines.map((line) => line.id)).toEqual([TER_TRACK_LINE_ID])
    expect(terLines[0].stopIds).toEqual(TER_STOPS.map((stop) => stop.id))
    expect(terLines[0]).not.toHaveProperty('positions')
  })
})
