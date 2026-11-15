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
import { MOBILITY_PALETTE } from '../domain/mobilityColors'

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

function drawMap(lines: readonly CorridorLine[] = CORRIDOR_LINES, stops = ALL_CORRIDOR_STOPS) {
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

  it('ne relie plus les gares du TER par des segments droits', () => {
    const [terLine] = lineOf('ter')
    const straight = stopToStop(terLine)
    expect(straight).toHaveLength(14)
    expect(drawMap().some((polyline) => polyline.positions.length === straight.length && polyline.positions.every((position, index) => position[0] === straight[index][0] && position[1] === straight[index][1]))).toBe(false)
  })

  it('crédite OpenStreetMap sur le trait du TER, et seulement sur lui', () => {
    const credited = drawMap().filter((polyline) => polyline.attribution === TER_TRACK_ATTRIBUTION)
    expect(credited).toHaveLength(1)
    expect(credited[0].positions).toHaveLength(491)
  })

  it('rétablit les épaisseurs historiques du TER et des deux sens réels du BRT', () => {
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
    // TER et BRT retrouvent les épaisseurs historiques d'avant les réductions.
    expect(ter.map((polyline) => polyline.pathOptions.weight)).toEqual([6, 4.5, 3])
    expect([brt[0], brt[2], brt[4]].map((polyline) => polyline.pathOptions.weight)).toEqual([6, 4.5, 3])
  })
})

describe('carte : icônes des mobilités et exclusivité du TER', () => {
  it('affiche un train aux gares TER et aucune icône de bus sur la géométrie ferroviaire', () => {
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
      expect(atStation.every((marker) => String(marker.icon.options.html).includes('ter.svg')), stop.name).toBe(true)
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
      if (nearTerTrack) expect(String(marker.icon.options.html)).toContain('🚆')
      expect(marker.icon.options.iconSize).toEqual([34, 24])
    }
  })

  it.each(['brt', 'ddd', 'aftu_tata'] as const)('utilise une icône bus pour %s', (network) => {
    const lines = lineOf(network)
    const networkStopIds = new Set(lines.flatMap((line) => line.stopIds))
    const networkStops = ALL_CORRIDOR_STOPS.filter((stop) => networkStopIds.has(stop.id))
    drawMap(lines, networkStops)
    const markers = drawn.markers as Array<{ icon: { options: { html: string | HTMLElement } } }>
    expect(markers.length).toBeGreaterThan(0)
    expect(markers.every((marker) => String(marker.icon.options.html).includes(network === 'brt' ? 'brt.svg' : network === 'ddd' ? 'ddd.svg' : 'aftu-tata.svg'))).toBe(true)
  })
})

  it.each(['ter', 'brt', 'ddd', 'aftu_tata'] as const)('colore le flux animé de %s avec sa couleur officielle', (network) => {
    drawMap(lineOf(network))
    const flows = drawn.polylines.filter((entry) =>
      (entry as DrawnPolyline).pathOptions.className === 'mobility-route-flow',
    ) as DrawnPolyline[]
    expect(flows.length).toBeGreaterThan(0)
    expect(flows.every((flow) => flow.pathOptions.color === MOBILITY_PALETTE[network].bright)).toBe(true)
  })

  it('superpose un flux animé de la couleur officielle sur chaque géométrie, sans remplacer le tracé', () => {
    drawMap()
    const flows = drawn.polylines.filter((entry) =>
      (entry as DrawnPolyline).pathOptions.className === 'mobility-route-flow',
    ) as DrawnPolyline[]
    expect(flows.length).toBeGreaterThan(0)
    expect(flows.every((flow) => flow.pathOptions.dashArray === '8 18' && flow.pathOptions.dashOffset === '26')).toBe(true)
    for (const flow of flows) {
      expect(flow.positions.length).toBeGreaterThan(1)
      expect(flow.pathOptions.opacity).toBe(0.96)
    }
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
      expect(polyline.pathOptions.weight).toBe(2.2)
      expect(polyline.attribution).toBeUndefined()
    }
  })

  it('n’ajoute ni ne retire aucun trait sur la carte complète', () => {
    const expected = 3 * lineOf('ter').length + 6 * lineOf('brt').length + lineOf('ddd').length + lineOf('aftu_tata').length
    expect(drawMap()).toHaveLength(expected)
  })
})
