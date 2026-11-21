import { expect, it } from 'vitest'
import { BUS_SECTION_WAYS } from '../data/busSectionWays'
import { BUS_SECTION_REVIEWS } from '../data/busSectionReview'
import { extractJourneyRequest } from '../domain/assistant'
import { projectStopToLine } from '../domain/roadNetworkRouting'
import { sliceVerifiedRouteSegment } from '../domain/routeGeometrySlice'
import { PASSENGER_LINE_SHEETS } from '../domain/passengerLineSheets'
import { buildStopIndex, searchStopIndex } from '../domain/stops'
import { busMapPoints, busScopes, compileBusScope, findBusMapSections, type BusMapMarker } from './busGeography'
import { dakarNetwork, planDakarJourney } from './dakar'
import { mapBusSection } from './presentation'
import { passengerLookup } from './answers'
import { selectedVertex } from './placeConnections'

const settings = { departAt: Date.parse('2026-11-18T19:00Z') / 1000 }
const pin = (p: BusMapMarker) => ({ kind: 'map' as const, lat: p.lat, lng: p.lon, label: p.name })
const at = (p: BusMapMarker) => ({ ...pin(p), landmarkId: p.id })
const scope = (id: string) => busScopes.find(s => s.review.id === id)!

it('uses only the reviewed documentary scopes, 43 distinct OSM nodes, and no fabricated service or walk', () => {
  expect(busScopes.map(s => s.review.id)).toEqual(BUS_SECTION_REVIEWS.map(r => r.id))
  expect(busMapPoints).toHaveLength(43)
  expect(busScopes).toHaveLength(35)
  const length = (id: string) => Math.round(scope(id).parts.reduce((n,p) => n + p.meters, 0))
  expect(['ddd-1-vdn','ddd-1-sahm','ddd-1-medina-retour','ddd-220-jaxaay','aftu-40-maristes','aftu-40-maristes-mbao','ddd-232-maristes'].map(length))
    .toEqual([2705,3934,911,441,938,941,917])
  for (const { marker } of busMapPoints) {
    expect(selectedVertex(dakarNetwork, at(marker))).toBeUndefined()
    expect(dakarNetwork.places.has(marker.id)).toBe(false)
  }
})

it('checks every ordered pair across all bus scopes; no crossing scopes, return, or transfer by shared name', () => {
  const exact = new Set<string>()
  for (const { marker: a } of busMapPoints) for (const { marker: b } of busMapPoints) {
    // Shared platforms occur in two scopes as different JS objects but keep their OSM identity.
    const ids = busScopes.filter(s => {
      const i = s.markers.findIndex(m => m.id === a.id), j = s.markers.findIndex(m => m.id === b.id)
      return i >= 0 && j > i
    }).map(s => s.review.id).sort()
    const r = planDakarJourney(at(a), at(b), settings)
    if (r.ok) throw Error('A drawing is not a dated trip')
    expect((r.mapSections ?? []).map(s => s.review.id).sort()).toEqual(ids)
    if (ids.length) {
      expect(r.code).toBe('DOCUMENTED_SECTION_ONLY'); exact.add(`${a.id}:${b.id}`)
      for (const s of r.mapSections!) {
        expect(s.fromGapM).toBeNull(); expect(s.toGapM).toBeNull()
        expect(s.markers[0].id).toBe(a.id); expect(s.markers.at(-1)?.id).toBe(b.id)
        const overlay = mapBusSection(s)
        expect(overlay.segments).toHaveLength(1); expect(overlay.segments[0].geographyOnly).toBe(true)
        expect(overlay.changes).toEqual([]); expect(overlay.calls.every(c => c.role === 'Repère cartographique')).toBe(true)
      }
    }
  }
  expect(exact.size).toBe(108)
})

it('keeps the pinned OSM members on the right line, carriageway and side of each discontinuity', () => {
  const point = (id: number) => at(busMapPoints.find(p => p.marker.id === `landmark:bus-osm-${id}`)!.marker)
  const matches = (a: number, b: number) => findBusMapSections(point(a), point(b), settings).map(s => s.review.id).sort()
  // Only Médina–Stade is shared with the 4. Manguiers is NOT a call of this DDD 4 scope.
  expect(matches(4666430955, 4666430950)).toEqual(['ddd-1-sahm','ddd-4-medina','ddd-7-sahm'])
  expect(matches(4666430960, 4666430950)).toEqual(['ddd-1-sahm','ddd-7-sahm'])
  expect(matches(4666430949, 4754647805)).toEqual(['ddd-4-gueule-tapee'])
  expect(matches(4666430953, 4666430954)).toEqual([]) // opposite sides at Tilène
  expect(matches(4363242544, 4666430950)).toEqual([]) // missing Mermoz platform, never bridge the gap
  expect(matches(4323838512, 4363241823)).toEqual(['ddd-1-vdn'])
  expect(matches(4363241798, 4666430950)).toEqual(['ddd-1-sahm'])
  expect(matches(4363241823, 4363241798)).toEqual([])
  expect(matches(282071200, 6413208889)).toEqual(['ddd-1-medina-retour']) // two road vertices, not 4/7 platforms
  expect(matches(299640615,1247665267)).toEqual(['aftu-3-medina','aftu-4-medina','ddd-12-medina','ddd-8-medina','tata-3-medina','tata-4-medina'])
  expect(matches(1247665267,299640615)).toEqual([])
  expect(matches(299640615,4666430950)).toEqual([]) // never switch from the street to a DDD platform
  expect(matches(6413208889, 282071200)).toEqual([])
  expect(matches(4666430949, 4666430963)).toEqual(['ddd-7-ucad']) // Ouakam, not the DDD 4's boulevard
  expect(matches(4666430964, 4666430963)).toEqual([]) // UCAD on opposite carriageways
  expect(matches(1745835667, 297238941)).toEqual(['aftu-1-fass','tata-1-fass']) // two sheets, same road, no vehicles
  const east = ['aftu-45-jaxaay','aftu-74-keur-massar','aftu-83-jax-a','aftu-84-jax-a','aftu-90-jax-a','aftu-91-jax-a','tata-45-jaxaay']
  expect(matches(6047705119, 4873880717)).toEqual(east)
  expect(matches(3445856553, 7468722800)).toEqual([...east,'ddd-220-jaxaay'].sort()) // 220 is more narrowly bounded
  expect(matches(4873881075, 2415437588)).toEqual(['aftu-74-rufisque','aftu-83-jax-s','aftu-84-jax-s','aftu-90-jax-s','aftu-91-jax-s'])
  expect(matches(4873880717, 6047705119)).toEqual([]) // not the other carriageway
  expect(matches(4873881075, 6047705119)).toEqual([]) // no cross-carriageway substitution
  expect(matches(3403676386, 305375476)).toEqual([]) // not the inbound branch
  expect(matches(3403676386, 5563118327)).toEqual(['aftu-40-maristes-mbao'])
  expect(matches(5563118329, 3403676386)).toEqual(['aftu-37-maristes-s','aftu-40-maristes','aftu-75-maristes-s','ddd-232-maristes'])
  expect(matches(3403676386, 5563118329)).toEqual(['aftu-37-maristes-n','aftu-40-maristes-mbao','aftu-75-maristes-n'])
})

it('rejects missing, discontinuous or reversed ways, wrong markers and even a same-coordinate join with different node IDs', () => {
  const r = scope('ddd-1-sahm').review
  for (const bad of [{ ...r, ways: [] }, { ...r, ways: [1] }, { ...r, ways: r.ways.slice(1) },
    { ...r, ways: [r.ways[0], r.ways.at(-1)!] }, { ...r, ways: [-r.ways[0], ...r.ways.slice(1)] },
    { ...r, markers: [...r.markers].reverse() }, { ...r, markers: [r.markers[0], r.markers[0]] }, { ...r, markers: [0,r.markers[0]] }]) {
    expect(compileBusScope(bad)).toBeNull()
  }
  const w = BUS_SECTION_WAYS[411081524], [,lat,lon] = w.vertices[0]
  expect(compileBusScope(r, { ...BUS_SECTION_WAYS, 411081524: { ...w, vertices: [[123, lat, lon], ...w.vertices.slice(1)] } })).toBeNull()
  const a = scope('aftu-40-maristes').review
  expect(compileBusScope({ ...a, markers: [4666430950, a.markers[1]] })).toBeNull() // quay is not a road limit
  const street = BUS_SECTION_WAYS[27811399]
  expect(compileBusScope(a, { ...BUS_SECTION_WAYS, 27811399: { ...street, vertices: [street.vertices[0], street.vertices.at(-1)!] } })).toBeNull() // overlong jump
  expect(compileBusScope(a, { ...BUS_SECTION_WAYS, 27811399: { ...BUS_SECTION_WAYS[27811399], oneWay: true } })).toBeNull()
})

it('keeps the actual VDN rank 21 outside the 20 m map guard', () => {
  // © OSM contributors: node 4363241816 v3, way 962601272 v1. QA only.
  const positions = [[14.7108323,-17.4714975],[14.7095377,-17.4711931],[14.7074477,-17.4707168]].map(([lat,lon]) => ({ lat,lon }))
  const rejected = { lat: 14.7090432, lon: -17.4712905 }
  expect(projectStopToLine(rejected, positions)!.offsetM).toBeCloseTo(22.07, 2)
  expect(sliceVerifiedRouteSegment({ verified: true, network: 'ddd', lineId: '1', directionId: 'ddd-1-vdn',
    source: 'OSM_ROUTE_RELATION', sourceId: '6951328/v28', positions }, positions[0], rejected, 20)).toBeNull()
  expect(busMapPoints.some(x => x.marker.id === 'landmark:bus-osm-4363241816')).toBe(false)
})

it('uses explicit identity for exact matches; map-pin gaps (even 0 m) are never access or boarding', () => {
  const [a,,b] = scope('aftu-40-maristes').markers
  const r = findBusMapSections(pin(a), pin(b), settings)[0]
  expect(r).toMatchObject({ fromGapM: 0, toGapM: 0, review: { family: 'aftu', landmarkKind: 'road-limit' } })
  expect(r).not.toHaveProperty('boardAt')
  for (const modes of [['tata'], ['ddd'], ['ter'], []] as const) expect(findBusMapSections(at(a), at(b), { ...settings, modes })).toEqual([])
  for (const modes of [['aftu'], ['aftu_tata']] as const) expect(findBusMapSections(at(a), at(b), { ...settings, modes })).toHaveLength(1)
  expect(findBusMapSections(at(a), at(b), { ...settings, stepFreeOnly: true })).toEqual([])
  for (const bad of [{ ...at(a), lng: a.lon + 0.00001 }, { ...at(a), stopId: 'other' }, { ...at(a), kind: 'stop' as const },
    { ...pin(a), stopId: 'brt-petersen' }, { ...at(a), snapshotId: 'stale' }, { ...pin(a), lat: 14.4 }]) expect(findBusMapSections(bad, at(b), settings)).toEqual([])
  expect(findBusMapSections({ ...pin(a), lng: a.lon + 0.0001 }, at(b), { ...settings, maxWalkPerLegM: 1 })).toEqual([])
})

it('offers the same scoped reference in Trajet and passenger text; does not alter the historical planner', () => {
  const index = buildStopIndex([])
  const maristes = scope('aftu-40-maristes').markers
  expect(searchStopIndex(index, 'aftu 40').map(p => p.value)).toEqual(expect.arrayContaining(maristes.map(m => m.id)))
  const req = extractJourneyRequest(`De ${maristes[0].name} à ${maristes[2].name}`, 'passenger')!
  expect(req.origin.landmarkId).toBe(maristes[0].id); expect(req.destination.landmarkId).toBe(maristes[2].id)
  const reply = passengerLookup(settings)(req.origin, req.destination, 'trajet', 'fr')
  expect(reply.memory).toBeNull(); expect(reply.text).toMatch(/Carte uniquement : AFTU 40/)
})


it('retains source-only directional sheets: no boarding time, fictitious return or union of variants', () => {
  const sheets = (n: string, code: string) => PASSENGER_LINE_SHEETS.filter(s => s.network === n && s.line === code)
  for (const [code, lens] of [['83',[93,90]],['84',[73,73]],['88',[78,81]],['89',[55,53]],['90',[82,82]],['91',[70,70]]] as const) {
    const transcriptions = sheets('aftu', code).filter(s => s.source.startsWith('Transcription'))
    expect(transcriptions.map(s => s.labels.length)).toEqual(lens)
    expect(transcriptions.every(s => !s.schedule && s.url.endsWith(`aftu-${code}-directions.json`))).toBe(true)
  }
  expect(sheets('ddd','501').map(s => [s.labels[0],s.labels.at(-1)])).toEqual([['Port De Dakar','Terminus Palais 2'],['Terminus Palais 2','Port De Dakar']])
  expect(sheets('aftu','85')).toHaveLength(0); expect(sheets('aftu','85-unverified')).toHaveLength(0)
  const operator = sheets('aftu','40').find(s => s.url.startsWith('https://aftu-senegal.org/'))!
  expect(operator.labels).toHaveLength(11); expect(operator.labels.slice(-2)).toEqual(['Colobane','Terminus Petersen'])
  expect(operator.schedule).toBeUndefined()
})
