// @vitest-environment jsdom
/**
 * Ce que la carte reçoit réellement : le TER est dessiné avec la géométrie des
 * voies, les autres mobilités gardent exactement leur dessin d'avant.
 */
import type { ReactNode } from 'react'
import { cleanup, render } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { ALL_CORRIDOR_STOPS, CORRIDOR_LINES, type CorridorLine } from '../domain/corridors'
import { TER_TRACK, TER_TRACK_ATTRIBUTION } from '../domain/terTrackGeometry'

interface DrawnPolyline {
  positions: Array<[number, number]>
  attribution?: string
  interactive?: boolean
  pathOptions: { color: string; weight: number; opacity: number; dashArray?: string; lineCap?: string; lineJoin?: string }
}

const drawn = vi.hoisted(() => ({ polylines: [] as unknown[] }))

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
    expect(ter.map((polyline) => polyline.pathOptions.weight)).toEqual([11, 8, 4.5])
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

  it('applique au TER les mêmes règles de trait qu’au BRT', () => {
    const polylines = drawMap([lineOf('ter')[0], lineOf('brt')[0]])
    const ter = polylines.filter((polyline) => polyline.positions.length === 491)
    const brt = polylines.filter((polyline) => polyline.positions.length !== 491)
    expect(ter).toHaveLength(3)
    expect(brt).toHaveLength(3)
    // Mêmes épaisseurs, opacités, extrémités et interactivité ; seule la couleur distingue les réseaux.
    expect(ter.map(styleOf)).toEqual(brt.map(styleOf))
  })
})

describe('carte : les autres mobilités ne changent pas', () => {
  it('trace le BRT comme avant, arrêt après arrêt', () => {
    const lines = lineOf('brt')
    expect(lines.length).toBeGreaterThan(0)
    const polylines = drawMap(lines)
    expect(polylines).toHaveLength(3 * lines.length)
    for (const [index, polyline] of polylines.entries()) {
      expect(polyline.positions).toEqual(stopToStop(lines[index % lines.length]))
      expect(polyline.attribution).toBeUndefined()
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
    const expected = 3 * (lineOf('ter').length + lineOf('brt').length) + lineOf('ddd').length + lineOf('aftu_tata').length
    expect(drawMap()).toHaveLength(expected)
  })
})
