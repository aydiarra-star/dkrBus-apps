// @vitest-environment jsdom
/**
 * Ce que la carte reçoit réellement : le TER est dessiné avec la géométrie des
 * voies, les autres mobilités gardent exactement leur dessin d'avant.
 */
import type { ReactNode } from 'react'
import { cleanup, render } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { ALL_CORRIDOR_STOPS, CORRIDOR_LINES, TER_STOPS, type CorridorLine } from '../domain/corridors'
import { TER_TRACK } from '../domain/terTrackGeometry'
import { BRT_B1_TRACKS } from '../domain/brtTrackGeometry'

interface DrawnPolyline {
  positions: Array<[number, number]>
  attribution?: string
  interactive?: boolean
  pathOptions: { color: string; weight: number; opacity: number; dashArray?: string; dashOffset?: string; className?: string; lineCap?: string; lineJoin?: string }
}

const drawn = vi.hoisted(() => ({ polylines: [] as unknown[], markers: [] as unknown[] }))

vi.mock('react-leaflet', () => {
  const Layer = ({ children }: { children?: ReactNode }) => <>{children}</>
  const Leaf = () => null
  const map = {
    attributionControl: { setPrefix: () => undefined },
    fitBounds: () => undefined,
    flyTo: () => undefined,
    getZoom: () => 12,
    setZoom: () => undefined,
    invalidateSize: () => undefined,
    getContainer: () => document.createElement('div'),
  }
  return {
    MapContainer: Layer,
    TileLayer: Leaf,
    Tooltip: Leaf,
    Circle: Leaf,
    CircleMarker: Leaf,
    Marker: (props: Record<string, unknown>) => {
      drawn.markers.push(props)
      return null
    },
    Rectangle: Leaf,
    Polyline: (props: Record<string, unknown>) => {
      drawn.polylines.push(props)
      return null
    },
    useMap: () => map,
    useMapEvents: () => map,
  }
})

import { TransitMap } from './TransitMap'
import { mapItinerary, type JourneyMarker, type MapSegment } from '../routing/presentation'
import { dakarNetwork } from '../routing/dakar'
import { search } from '../routing/search'

function drawMap(
  lines: readonly CorridorLine[] = CORRIDOR_LINES,
  stops = ALL_CORRIDOR_STOPS,
  highlightedRouteSegments: readonly MapSegment[] = [],
  journeyFocus = false,
  highlightedCalls: readonly JourneyMarker[] = [],
) {
  drawn.polylines.length = 0
  drawn.markers.length = 0
  render(
    <TransitMap
      location={null}
      routePoints={{}}
      pickingPoint={null}
      recenterTo={null}
      zoomAction={null}
      onChoosePoint={() => undefined}
      corridorLines={lines}
      corridorStops={stops}
      journeyFocus={journeyFocus}
      highlightedCalls={highlightedCalls}
      highlightedRouteSegments={highlightedRouteSegments}
    />,
  )
  return drawn.polylines.filter((polyline) => (polyline as DrawnPolyline).pathOptions.className !== 'mobility-route-flow') as DrawnPolyline[]
}

/** Dessin d'avant la modification : les arrêts de la ligne reliés dans l'ordre de desserte. */
function stopToStop(line: CorridorLine): Array<[number, number]> {
  return line.stopIds
    .map((stopId) => ALL_CORRIDOR_STOPS.find((stop) => stop.id === stopId))
    .filter((stop) => stop !== undefined)
    .map((stop) => [stop.lat, stop.lon])
}

const lineOf = (network: CorridorLine['network']) => CORRIDOR_LINES.filter((line) => line.network === network)

beforeEach(() => {
  drawn.polylines.length = 0
  drawn.markers.length = 0
})
afterEach(cleanup)

describe('carte : tracé du TER sur les voies réelles', () => {
  it('dessine le TER avec les 491 sommets du fichier, sur ses trois traits habituels', () => {
    const ter = drawMap().filter((polyline) => polyline.positions.length === 491)
    expect(ter).toHaveLength(3)
    for (const polyline of ter) {
      expect(polyline.positions).toEqual(TER_TRACK.positions)
    }
    // Halo blanc, liseré, trait plein : les mêmes épaisseurs qu'avant.
    expect(ter.map((polyline) => polyline.pathOptions.weight)).toEqual([6, 4.5, 3])
  })

  it('met en évidence uniquement la portion sélectionnée et non toute la ligne', () => {
    const segment = {
      id: 'ter-dakar-colobane',
      network: 'ter' as const,
      positions: [[14.675, -17.433], [14.689, -17.439], [14.700, -17.441]] as const,
    }
    const polylines = drawMap(CORRIDOR_LINES, ALL_CORRIDOR_STOPS, [segment])
    const overlay = polylines.filter((polyline) => JSON.stringify(polyline.positions) === JSON.stringify(segment.positions))
    expect(overlay).toHaveLength(2)
    expect(overlay.map((polyline) => polyline.pathOptions.weight)).toEqual([8, 5.5])
  })

  it('ne relie plus les gares du TER par des segments droits', () => {
    const [terLine] = lineOf('ter')
    const straight = stopToStop(terLine)
    expect(straight).toHaveLength(14)
    expect(drawMap().some((polyline) => polyline.positions.length === straight.length && polyline.positions.every((position, index) => position[0] === straight[index][0] && position[1] === straight[index][1]))).toBe(false)
  })

  it('ne répète pas les crédits OSM sur les traits du TER (crédit unique sur le fond de carte)', () => {
    const ter = drawMap().filter((polyline) => polyline.positions.length === 491)
    expect(ter).toHaveLength(3)
    expect(ter.every((polyline) => polyline.attribution === undefined)).toBe(true)
  })

  it('rétablit les épaisseurs historiques du TER et ne dessine que le sens BRT validé', () => {
    const polylines = drawMap([lineOf('ter')[0], lineOf('brt')[0]])
    const ter = polylines.filter((polyline) => polyline.positions.length === 491)
    const brt = polylines.filter((polyline) => polyline.positions.length !== 491)
    expect(ter).toHaveLength(3)
    expect(brt).toHaveLength(3)
    expect(brt.map((polyline) => polyline.positions)).toEqual([
      BRT_B1_TRACKS[0].positions,
      BRT_B1_TRACKS[0].positions,
      BRT_B1_TRACKS[0].positions,
    ])
    // TER et BRT retrouvent les épaisseurs historiques d'avant les réductions.
    expect(ter.map((polyline) => polyline.pathOptions.weight)).toEqual([6, 4.5, 3])
    expect(brt.map((polyline) => polyline.pathOptions.weight)).toEqual([6, 4.5, 3])
  })
})

describe('carte : libellés texte des arrêts et exclusivité des corridors', () => {
  it('affiche uniquement le texte TER aux gares TER et aucun autre réseau sur la géométrie ferroviaire', () => {
    drawMap()
    const markers = drawn.markers as Array<{
      position: [number, number]
      icon: { options: { html: string | HTMLElement; iconSize: [number, number] } }
    }>

    for (const stop of TER_STOPS) {
      const atStation = markers.filter((marker) =>
        marker.position[0] === stop.lat && marker.position[1] === stop.lon,
      )
      expect(atStation.length, stop.name).toBeGreaterThan(0)
      expect(atStation.every((marker) => String(marker.icon.options.html).includes('data-mobility="ter"') && String(marker.icon.options.html).includes('>TER</span>')), stop.name).toBe(true)
    }

    for (const marker of markers) {
      const nearTerTrack = TER_TRACK.positions.slice(1).some((end, index) => {
        const start = TER_TRACK.positions[index]
        const lat = (start[0] + end[0]) / 2
        const meters = Math.hypot(
          (marker.position[0] - lat) * 111_000,
          (marker.position[1] - (start[1] + end[1]) / 2) * 111_000 * Math.cos(lat * Math.PI / 180),
        )
        return meters <= 35
      })
      if (nearTerTrack) expect(String(marker.icon.options.html)).toContain('data-mobility="ter"')
      expect(String(marker.icon.options.html)).toContain('mobility-stop-label')
      expect(String(marker.icon.options.html)).not.toContain('mobility-stop-badge')
      expect(String(marker.icon.options.html)).not.toContain('background:')
    }

    for (const marker of markers) {
      const nearBrtTrack = BRT_B1_TRACKS.some((track) => track.positions.slice(1).some((end, index) => {
        const start = track.positions[index]
        const lat = (start[0] + end[0]) / 2
        const meters = Math.hypot(
          (marker.position[0] - lat) * 111_000,
          (marker.position[1] - (start[1] + end[1]) / 2) * 111_000 * Math.cos(lat * Math.PI / 180),
        )
        return meters <= 35
      }))
      if (nearBrtTrack) expect(String(marker.icon.options.html)).toContain('data-mobility="brt"')
    }
  })

  it.each([
    ['brt', 'BRT'],
    ['ddd', 'DDD'],
    ['aftu_tata', 'AFTU'],
  ] as const)('affiche uniquement le sigle %s sur ses arrêts', (network, label) => {
    const lines = lineOf(network)
    const networkStopIds = new Set(lines.flatMap((line) => line.stopIds))
    const networkStops = ALL_CORRIDOR_STOPS.filter((stop) => networkStopIds.has(stop.id))
    drawMap(lines, networkStops)
    const markers = drawn.markers as Array<{ position: [number, number]; icon: { options: { html: string | HTMLElement; iconSize: [number, number] } } }>
    const expectedPositions = new Set(networkStops.map((stop) => `${stop.lat},${stop.lon}`))
    const stopMarkers = markers.filter((marker) => expectedPositions.has(`${marker.position[0]},${marker.position[1]}`))
    expect(stopMarkers.length).toBeGreaterThan(0)
    expect(stopMarkers.every((marker) =>
      String(marker.icon.options.html).includes(`data-mobility="${network}"`) &&
      (network === 'aftu_tata'
        ? />(AFTU|TATA)<\/span>/.test(String(marker.icon.options.html))
        : String(marker.icon.options.html).includes(`>${label}</span>`)) &&
      String(marker.icon.options.html).includes('mobility-stop-label') &&
      !String(marker.icon.options.html).includes('mobility-stop-badge'),
    )).toBe(true)
    if (network === 'aftu_tata') {
      expect(stopMarkers.every((marker) => />(AFTU|TATA)<\/span>/.test(String(marker.icon.options.html)))).toBe(true)
    }
  })

  it('identifie les arrêts sans réseau déclaré par le libellé BUS', () => {
    drawMap([], [{
      id: 'bus-stop-test',
      name: 'Arrêt bus test',
      lat: 14.7,
      lon: -17.4,
      order: 0,
      aliases: [],
    }])
    const markers = drawn.markers as Array<{ position: [number, number]; icon: { options: { html: string | HTMLElement } } }>
    const testMarkers = markers.filter((marker) => marker.position[0] === 14.7 && marker.position[1] === -17.4)
    expect(testMarkers).toHaveLength(1)
    expect(String(testMarkers[0].icon.options.html)).toContain('data-mobility="bus"')
    expect(String(testMarkers[0].icon.options.html)).toContain('>BUS</span>')
  })
})

describe('carte : les autres mobilités ne changent pas', () => {
  it('trace uniquement la géométrie BRT validée sans répéter les crédits sur chaque trait', () => {
    const lines = lineOf('brt')
    expect(lines.length).toBeGreaterThan(0)
    const polylines = drawMap(lines)
    expect(polylines).toHaveLength(3 * lines.length)
    const expectedTracks = [
      BRT_B1_TRACKS[0].positions,
      BRT_B1_TRACKS[0].positions,
      BRT_B1_TRACKS[0].positions,
    ]
    for (const [index, polyline] of polylines.entries()) {
      expect(polyline.positions).toEqual(expectedTracks[index])
      expect(polyline.attribution).toBeUndefined()
    }
  })

  it.each(['ddd', 'aftu_tata'] as const)('ne dessine aucun tracé routier parasite pour %s', (network) => {
    const lines = lineOf(network)
    expect(lines.length).toBeGreaterThan(0)
    expect(drawMap(lines)).toHaveLength(0)
  })

  it.each(['ddd', 'aftu_tata'] as const)('ne dessine aucun trait droit même lorsque %s est sélectionné dans un itinéraire', (network) => {
    const lines = lineOf(network)
    // DDD/AFTU-TATA n'ont pas de segments directionnels certifiés à surligner.
    expect(drawMap(lines, ALL_CORRIDOR_STOPS, [])).toHaveLength(0)
  })

  it('ne conserve sur la carte complète que les traits TER et BRT', () => {
    const expected = 3 * lineOf('ter').length + 3 * lineOf('brt').length
    expect(drawMap()).toHaveLength(expected)
  })
})


describe('carte de trajet, distincte de la carte de référence', () => {
  it('draws the exact selected Dakar ride and its calls, not whole lines, both directions or unrelated stops', () => {
    const result = search(dakarNetwork, { origin: 'ter-colobane', destination: 'ter-pikine', departAt: Date.parse('2026-11-18T08:01Z') / 1000 })
    if (!result.ok) throw Error(result.message)
    const { segments, calls } = mapItinerary(result.options[0])
    const layers = drawMap(CORRIDOR_LINES, ALL_CORRIDOR_STOPS, segments, true, calls)
    expect(layers.map(l => l.positions)).toEqual([segments[0].positions, segments[0].positions])
    expect(drawn.markers.map(m => (m as { title: string }).title)).toEqual(calls.map(c => `${c.role} · ${c.place.name} · ${c.line}`))
    expect(calls[0].role).toBe('Montée'); expect(calls.at(-1)?.role).toBe('Descente')
  })
  it('does not paint a reference line in place of a rejected route', () => {
    expect(drawMap(CORRIDOR_LINES, ALL_CORRIDOR_STOPS, [], true)).toHaveLength(0)
    expect(drawn.markers).toHaveLength(0)
  })
})
