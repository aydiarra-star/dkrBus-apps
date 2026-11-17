import test from 'node:test'
import assert from 'node:assert/strict'
import { buildPedestrianGraph, isWalkableOsmWay } from './pedestrianNetwork.mjs'

test('keeps designated footways and pedestrian streets', () => {
  assert.equal(isWalkableOsmWay({ highway: 'footway' }), true)
  assert.equal(isWalkableOsmWay({ highway: 'pedestrian' }), true)
  assert.equal(isWalkableOsmWay({ highway: 'residential' }), true)
})

test('rejects prohibited/private foot access and motorway links', () => {
  assert.equal(isWalkableOsmWay({ highway: 'footway', foot: 'no' }), false)
  assert.equal(isWalkableOsmWay({ highway: 'residential', access: 'private' }), false)
  assert.equal(isWalkableOsmWay({ highway: 'motorway' }), false)
  for (const highway of ['tertiary', 'secondary', 'primary', 'trunk', 'trunk_link']) {
    assert.equal(isWalkableOsmWay({ highway }), false)
    assert.equal(isWalkableOsmWay({ highway, sidewalk: 'both' }), true)
    assert.equal(isWalkableOsmWay({ highway, sidewalk: 'no' }), false)
  }
  assert.equal(isWalkableOsmWay({ highway: 'primary', foot: 'designated' }), true)
  assert.equal(isWalkableOsmWay({ highway: 'primary', sidewalk: 'separate' }), false)
})

test('allows an explicit foot permission to override generic private access', () => {
  assert.equal(isWalkableOsmWay({ highway: 'path', access: 'private', foot: 'permissive' }), true)
})

test('builds connected directional edges with the actual OSM way segments', () => {
  const graph = buildPedestrianGraph([{
    type: 'way',
    id: 42,
    nodes: [100, 101, 102],
    tags: { highway: 'footway' },
    geometry: [
      { lat: 14.7, lon: -17.4 },
      { lat: 14.701, lon: -17.4 },
      { lat: 14.702, lon: -17.4 },
    ],
  }])
  assert.equal(graph.summary.nodeCount, 3)
  assert.equal(graph.summary.directedEdgeCount, 4)
  assert.equal(graph.status, 'CANDIDATE_GRAPH_NOT_YET_CONNECTED_TO_STOPS')
  assert.equal(graph.edges[0].wayId, 42)
  assert.equal(graph.edges[0].positions.length, 2)
})

test('honors an explicit pedestrian one-way without creating a reverse edge', () => {
  const graph = buildPedestrianGraph([{
    type: 'way', id: 7, nodes: [1, 2],
    tags: { highway: 'steps', 'oneway:foot': 'yes' },
    geometry: [{ lat: 14.7, lon: -17.4 }, { lat: 14.701, lon: -17.4 }],
  }])
  assert.equal(graph.summary.directedEdgeCount, 1)
  assert.equal(graph.edges[0].from, '1')
  assert.equal(graph.edges[0].to, '2')
})

test('does not invent edges when OSM geometry and node references disagree', () => {
  const graph = buildPedestrianGraph([{
    type: 'way', id: 9, nodes: [1, 2, 3],
    tags: { highway: 'footway' },
    geometry: [{ lat: 14.7, lon: -17.4 }, { lat: 14.701, lon: -17.4 }],
  }])
  assert.equal(graph.summary.directedEdgeCount, 0)
  assert.equal(graph.summary.skippedWays, 1)
})

test('respects foot:access restrictions on OSM nodes', () => {
  const blocked = buildPedestrianGraph([
    { type: 'node', id: 2, tags: { 'foot:access': 'no' } },
    { type: 'way', id: 13, nodes: [1, 2], tags: { highway: 'footway' }, geometry: [{ lat: 14.7, lon: -17.4 }, { lat: 14.701, lon: -17.4 }] },
  ])
  assert.equal(blocked.summary.directedEdgeCount, 0)
  const conditional = buildPedestrianGraph([
    { type: 'node', id: 2, tags: { 'foot:conditional': 'no @ (20:00-06:00)' } },
    { type: 'way', id: 14, nodes: [1, 2], tags: { highway: 'footway' }, geometry: [{ lat: 14.7, lon: -17.4 }, { lat: 14.701, lon: -17.4 }] },
  ])
  assert.equal(conditional.summary.directedEdgeCount, 0)
})

test('blocks private barriers and keeps explicitly passable pedestrian gates', () => {
  const graphWithGate = buildPedestrianGraph([
    { type: 'node', id: 2, tags: { barrier: 'gate' } },
    { type: 'way', id: 11, nodes: [1, 2], tags: { highway: 'footway' }, geometry: [{ lat: 14.7, lon: -17.4 }, { lat: 14.701, lon: -17.4 }] },
  ])
  assert.equal(graphWithGate.summary.directedEdgeCount, 0)
  const graphWithOpenGate = buildPedestrianGraph([
    { type: 'node', id: 2, tags: { barrier: 'gate', foot: 'yes' } },
    { type: 'way', id: 12, nodes: [1, 2], tags: { highway: 'footway' }, geometry: [{ lat: 14.7, lon: -17.4 }, { lat: 14.701, lon: -17.4 }] },
  ])
  assert.equal(graphWithOpenGate.summary.directedEdgeCount, 2)
})

test('does not route through a blocking barrier node shared by two ways', () => {
  const graph = buildPedestrianGraph([
    { type: 'node', id: 2, tags: { barrier: 'gate' } },
    { type: 'way', id: 11, nodes: [1, 2], tags: { highway: 'footway' }, geometry: [{ lat: 14.7, lon: -17.4 }, { lat: 14.701, lon: -17.4 }] },
    { type: 'way', id: 12, nodes: [2, 3], tags: { highway: 'footway' }, geometry: [{ lat: 14.701, lon: -17.4 }, { lat: 14.702, lon: -17.4 }] },
  ])
  assert.equal(graph.summary.directedEdgeCount, 0)
})
