import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { BRT_STOPS, haversineMeters } from './corridors'
import { BRT_B1_TRACKS, BRT_TRACK_ATTRIBUTION, brtTrackPositionsForLine, parseBrtTracks, type BrtTrackPosition } from './brtTrackGeometry'

const delivered = JSON.parse(readFileSync(new URL('../../data/brt/brt-b1-osm.geojson', import.meta.url), 'utf8')) as {
  features: Array<{
    properties: Record<string, unknown>
    geometry: { type: string; coordinates: Array<[number, number]> }
  }>
}

const point = ([lat, lon]: BrtTrackPosition) => ({ lat, lon })
const segmentLength = (a: BrtTrackPosition, b: BrtTrackPosition) => haversineMeters(point(a), point(b))
const pathLength = (positions: readonly BrtTrackPosition[]) =>
  positions.slice(1).reduce((total, position, index) => total + segmentLength(positions[index], position), 0)

function distanceToTrack(target: { lat: number; lon: number }, positions: readonly BrtTrackPosition[]): number {
  const k = 111_195
  const cos = Math.cos((target.lat * Math.PI) / 180)
  const xy = ([lat, lon]: BrtTrackPosition) => [(lon - target.lon) * k * cos, (lat - target.lat) * k] as const
  let best = Infinity
  for (let index = 0; index < positions.length - 1; index += 1) {
    const [ax, ay] = xy(positions[index])
    const [bx, by] = xy(positions[index + 1])
    const dx = bx - ax
    const dy = by - ay
    const denominator = dx * dx + dy * dy
    const t = denominator ? Math.max(0, Math.min(1, -(ax * dx + ay * dy) / denominator)) : 0
    best = Math.min(best, Math.hypot(ax + t * dx, ay + t * dy))
  }
  return best
}

describe('tracé BRT B1 : géométries OSM dans les deux sens', () => {
  it('livre séparément les deux relations OSM opposées, sans inverser un seul tracé', () => {
    expect(delivered.features).toHaveLength(2)
    expect(BRT_B1_TRACKS.map((track) => track.osmRelationId)).toEqual([19961937, 19961993])
    expect(BRT_B1_TRACKS.map((track) => [track.directionFrom, track.directionTo])).toEqual([
      ['Préfecture de Guédiawaye', 'Petersen'],
      ['Petersen', 'Préfecture de Guédiawaye'],
    ])
    expect(BRT_B1_TRACKS.map((track) => track.positions.length)).toEqual([237, 241])
    expect(BRT_B1_TRACKS.every((track) => track.extractedOn === '2026-11-14')).toBe(true)
  })

  it('n’affiche dans le corridor que le sens dont les 23 stations sont raccordées dans la tolérance', () => {
    const verified = brtTrackPositionsForLine('brt-b1') ?? []
    expect(verified).toHaveLength(1)
    expect(verified[0]).toEqual(BRT_B1_TRACKS[0].positions)
    expect(brtTrackPositionsForLine('brt-unknown')).toBeUndefined()
  })

  it('conserve la forme du corridor et des longueurs cohérentes dans chaque sens', () => {
    expect(Math.abs(pathLength(BRT_B1_TRACKS[0].positions) - 17_834) / 17_834).toBeLessThan(0.002)
    expect(Math.abs(pathLength(BRT_B1_TRACKS[1].positions) - 17_640) / 17_640).toBeLessThan(0.002)
    for (const track of BRT_B1_TRACKS) {
      const segmentLengths = track.positions.slice(1).map((position, index) => segmentLength(track.positions[index], position))
      expect(Math.min(...segmentLengths)).toBeGreaterThan(0)
      expect(Math.max(...segmentLengths)).toBeLessThan(800)
    }
  })

  it('place les 23 stations de référence à moins de 2 m de l’un des deux tracés', () => {
    expect(BRT_STOPS).toHaveLength(23)
    for (const stop of BRT_STOPS) {
      const nearest = Math.min(...BRT_B1_TRACKS.map((track) => distanceToTrack(stop, track.positions)))
      expect(nearest, stop.name).toBeLessThan(2)
    }
  })

  it('crédite OpenStreetMap et refuse un fichier incomplet ou sans les deux sens', () => {
    expect(BRT_TRACK_ATTRIBUTION).toContain('© les contributeurs d’OpenStreetMap')
    expect(BRT_TRACK_ATTRIBUTION).toContain('ODbL')
    expect(delivered.features.every((feature) => feature.properties.source_license === 'ODbL 1.0')).toBe(true)
    expect(() => parseBrtTracks(JSON.stringify({ type: 'FeatureCollection', features: delivered.features.slice(0, 1) }))).toThrow(/deux sens/)
  })
})
