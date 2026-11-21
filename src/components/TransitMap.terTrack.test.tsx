// @vitest-environment jsdom
/**
 * Contrats des couches Leaflet : tracés directionnels et accès aux points indépendants.
 */
import type { ReactNode } from 'react'
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react'
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

const drawn = vi.hoisted(() => ({ polylines: [] as unknown[], markers: [] as unknown[], fitBounds: vi.fn() }))

vi.mock('react-leaflet', () => {
  const Layer = ({ children }: { children?: ReactNode }) => <>{children}</>
  const Leaf = () => null
  const container = document.body.appendChild(document.createElement('div'))
  const map = {
    attributionControl: { setPrefix: () => undefined },
    fitBounds: drawn.fitBounds,
    flyTo: () => undefined,
    getZoom: () => 19, getMaxZoom: () => 19,
    getSize: () => ({ x: 1000, y: 800 }),
    latLngToContainerPoint: ([lat, lng]: number[]) => ({ x: (lng + 17.4) * 400000, y: (14.7 - lat) * 400000 }),
    setZoom: () => undefined,
    invalidateSize: () => undefined,
    getContainer: () => container,
  }
  return {
    MapContainer: Layer,
    TileLayer: Leaf,
    Tooltip: Leaf,
    Circle: Leaf,
    CircleMarker: Leaf,
    Marker: (props: Record<string, unknown>) => {
      drawn.markers.push(props)
      const handlers = props.eventHandlers as { click: (e: unknown) => void }
      return <button type="button" onClick={e => handlers.click({ target: { getElement: () => e.currentTarget } })}>{String(props.title)}</button>
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

describe('carte : sélection des points sans exclusivité de voie', () => {
  it('ouvre les trois identités et seulement les liens déclarés à Petersen, même au zoom maximal', () => {
    drawMap()
    fireEvent.click(screen.getByRole('button', { name: /points sur la carte.*autour de Petersen/ }))
    const panel = screen.getByRole('dialog', { name: 'Points sur la carte' })
    for (const id of ['brt-petersen', 'ddd-petersen', 'aftu-petersen']) {
      expect(panel.querySelector(`[data-point-key="ref:${id}"]`)).not.toBeNull()
    }
    const brt = panel.querySelector('[data-point-key="ref:brt-petersen"]')!
    expect(brt.textContent).toContain('Pôle commun déclaré : DDD')
    expect(brt.textContent).toContain('Marche de référence, chemin non vérifié : TER')
    expect(brt.querySelectorAll('[data-peer]')).toHaveLength(3)
    fireEvent.keyDown(within(panel).getByRole('button', { name: 'Fermer les points' }), { key: 'Escape' })
    expect(screen.queryByRole('dialog')).toBeNull()
  })
  it('identifie un arrêt sans réseau déclaré comme BUS', () => {
    drawMap([], [{ id: 'bus-stop-test', name: 'Arrêt bus test', lat: 14.7, lon: -17.4, order: 0, aliases: [] }])
    expect(screen.getByRole('button', { name: 'BUS — Arrêt bus test' })).toBeTruthy()
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
  it.each([true,false])('honours reduced motion (%s) when fitting the actual journey bounds', reduce => {
    vi.stubGlobal('matchMedia', (query: string) => ({ matches: reduce && query === '(prefers-reduced-motion: reduce)' }))
    try {
      drawn.fitBounds.mockClear()
      const positions = [[14.67,-17.43],[14.70,-17.44]] as const
      drawMap([], [], [{ id:'view-test', network:'ter', positions }], true)
      expect(drawn.fitBounds).toHaveBeenCalledWith(positions, expect.objectContaining({ animate:!reduce, maxZoom:15 }))
    } finally { vi.unstubAllGlobals() }
  })
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

it('picking a marker keeps its namespace even if a published ID and coordinates equal a reference call', () => {
  const s = TER_STOPS[0], choose = vi.fn(), open = vi.fn()
  render(<TransitMap location={null} routePoints={{}} pickingPoint="origin" recenterTo={null} zoomAction={null}
    onChoosePoint={choose} corridorLines={CORRIDOR_LINES} corridorStops={[s]} onSelectStop={open} onSelectCorridorStop={open}
    publishedStops={[{ snapshotId: 'édition-qa', stopId: s.id, stopName: 'Arrêt du flux QA', lat: s.lat, lon: s.lon, distanceM: null, locationType: null, parentStation: null }]} />)
  fireEvent.click(screen.getByRole('button', { name: 'Yoff' }))
  for (const name of ['Choisir ce point : TER — Dakar', 'Choisir ce point : Arrêt du flux QA']) {
    fireEvent.click(screen.getByRole('button', { name: /points sur la carte.*autour de Dakar$/ }))
    fireEvent.click(within(screen.getByRole('dialog')).getByRole('button', { name }))
  }
  expect(choose.mock.calls.map(([p]) => p)).toEqual([
    expect.objectContaining({ landmarkId: 'landmark:yoff', kind: 'map' }),
    { label: s.name, stopId: s.id, lat: s.lat, lng: s.lon },
    { label: 'Arrêt du flux QA', kind: 'stop', snapshotId: 'édition-qa', stopId: s.id, lat: s.lat, lng: s.lon },
  ])
  expect(open).not.toHaveBeenCalled()
})
