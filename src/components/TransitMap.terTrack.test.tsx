// @vitest-environment jsdom
/**
 * Ce que la carte reçoit réellement : le TER est dessiné avec la géométrie des
 * voies, les autres mobilités gardent exactement leur dessin d'avant.
 */
import type { ReactNode } from 'react'
import { cleanup, render } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { ALL_CORRIDOR_STOPS, CORRIDOR_LINES, TER_STOPS, type CorridorLine } from '../domain/corridors'
import { TER_TRACK, TER_TRACK_ATTRIBUTION } from '../domain/terTrackGeometry'
import { BRT_B1_TRACKS, BRT_TRACK_ATTRIBUTION } from '../domain/brtTrackGeometry'

interface DrawnPolyline {
  positions: Array<[number, number]>
  attribution?: string
  interactive?: boolean
  pathOptions: { color: string; weight: number; opacity: number; dashArray?: string; lineCap?: string; lineJoin?: string }
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
    CircleMarker: (props: Record<string, unknown>) => {
      drawn.markers.push(props)
      return null
    },
    Marker: Leaf,
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

function drawMap(lines: readonly CorridorLine[] = CORRIDOR_LINES) {
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
      corridorStops={ALL_CORRIDOR_STOPS}
    />,
  )
  return drawn.polylines as DrawnPolyline[]
}

/** Dessin d'avant la modification : les arrêts de la ligne reliés dans l'ordre de desserte. */
function stopToStop(line: CorridorLine): Array<[number, number]> {
  return line.stopIds
    .map((stopId) => ALL_CORRIDOR_STOPS.find((stop) => stop.id === stopId))
    .filter((stop) => stop !== undefined)
    .map((stop) => [stop.lat, stop.lon])
}

const lineOf = (network: CorridorLine['network']) => CORRIDOR_LINES.filter((line) => line.network === network)
const styleOf = ({ pathOptions, interactive }: DrawnPolyline) => ({ ...pathOptions, color: undefined, interactive })

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

  it('ne relie plus les gares du TER par des segments droits', () => {
    const [terLine] = lineOf('ter')
    const straight = stopToStop(terLine)
    expect(straight).toHaveLength(14)
    expect(drawMap().some((polyline) => polyline.positions.length === straight.length && polyline.positions.every((position, index) => position[0] === straight[index][0] && position[1] === straight[index][1]))).toBe(false)
  })

  it('crédite OpenStreetMap sur le trait du TER, et seulement sur lui', () => {
    const credited = drawMap().filter((polyline) => polyline.attribution !== undefined)
    expect(credited).toHaveLength(1)
    expect(credited[0].attribution).toBe(TER_TRACK_ATTRIBUTION)
    expect(credited[0].positions).toHaveLength(491)
  })

  it('applique les mêmes règles de trait au TER et aux deux sens réels du BRT', () => {
    const polylines = drawMap([lineOf('ter')[0], lineOf('brt')[0]])
    const ter = polylines.filter((polyline) => polyline.positions.length === 491)
    const brt = polylines.filter((polyline) => polyline.positions.length !== 491)
    expect(ter).toHaveLength(3)
    expect(brt).toHaveLength(6)
    expect(brt.map((polyline) => polyline.positions)).toEqual([
      BRT_B1_TRACKS[0].positions, BRT_B1_TRACKS[1].positions,
      BRT_B1_TRACKS[0].positions, BRT_B1_TRACKS[1].positions,
      BRT_B1_TRACKS[0].positions, BRT_B1_TRACKS[1].positions,
    ])
    // Les deux sens du BRT gardent les mêmes couches visuelles que le TER.
    expect(ter.map(styleOf)).toEqual([brt[0], brt[2], brt[4]].map(styleOf))
    expect([brt[0], brt[2], brt[4]].map((polyline) => polyline.pathOptions.weight)).toEqual([6, 4.5, 3])
  })
})

describe('carte : visibilité des gares TER et correspondances', () => {
  it('affiche les 14 gares TER et garde visibles les pastilles aux pôles partagés', () => {
    drawMap()
    const markers = drawn.markers as Array<{
      center: [number, number]
      radius: number
      pathOptions: { fillOpacity: number; color: string; fillColor: string; weight: number }
    }>

    for (const stop of TER_STOPS) {
      const atStation = markers.filter((marker) =>
        marker.center[0] === stop.lat && marker.center[1] === stop.lon,
      )
      expect(atStation.length, stop.name).toBeGreaterThan(0)

      const shared = ALL_CORRIDOR_STOPS.some((candidate) => {
        if (candidate.id.startsWith('ter-')) return false
        const meters = Math.hypot(
          (candidate.lat - stop.lat) * 111_000,
          (candidate.lon - stop.lon) * 111_000 * Math.cos(stop.lat * Math.PI / 180),
        )
        return meters <= 30
      })

      if (shared) {
        // La pastille du réseau correspondant reste visible sous l'anneau TER.
        expect(atStation.some((marker) => marker.pathOptions.fillOpacity > 0), stop.name).toBe(true)
        expect(atStation.some((marker) => marker.radius === 10 && marker.pathOptions.fillOpacity === 0), stop.name).toBe(true)
      } else {
        expect(atStation.some((marker) => marker.radius === 7 && marker.pathOptions.fillOpacity === 1), stop.name).toBe(true)
      }
    }
  })
})

describe('carte : les autres mobilités ne changent pas', () => {
  it('trace le BRT sur ses deux géométries OSM et crédite la source', () => {
    const lines = lineOf('brt')
    expect(lines.length).toBeGreaterThan(0)
    const polylines = drawMap(lines)
    expect(polylines).toHaveLength(6 * lines.length)
    const expectedTracks = [
      BRT_B1_TRACKS[0].positions, BRT_B1_TRACKS[1].positions,
      BRT_B1_TRACKS[0].positions, BRT_B1_TRACKS[1].positions,
      BRT_B1_TRACKS[0].positions, BRT_B1_TRACKS[1].positions,
    ]
    for (const [index, polyline] of polylines.entries()) {
      expect(polyline.positions).toEqual(expectedTracks[index])
      expect(polyline.attribution).toBe(index >= 4 ? BRT_TRACK_ATTRIBUTION : undefined)
    }
  })

  it.each(['ddd', 'aftu_tata'] as const)('trace le réseau %s comme avant, en pointillés d’arrêt en arrêt', (network) => {
    const lines = lineOf(network)
    expect(lines.length).toBeGreaterThan(0)
    const polylines = drawMap(lines)
    expect(polylines).toHaveLength(lines.length)
    for (const [index, polyline] of polylines.entries()) {
      expect(polyline.positions).toEqual(stopToStop(lines[index]))
      expect(polyline.pathOptions.dashArray).toBeDefined()
      expect(polyline.attribution).toBeUndefined()
    }
  })

  it('n’ajoute ni ne retire aucun trait sur la carte complète', () => {
    const expected = 3 * lineOf('ter').length + 6 * lineOf('brt').length + lineOf('ddd').length + lineOf('aftu_tata').length
    expect(drawMap()).toHaveLength(expected)
  })
})
