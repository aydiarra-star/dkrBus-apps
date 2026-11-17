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
  assert.equal(isWalkableOsmWay({ highway: 'trunk' }), false)
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
