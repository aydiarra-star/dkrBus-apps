import test from 'node:test'
import assert from 'node:assert/strict'
import { loadPedestrianSource, OVERPASS_ENDPOINTS } from './pedestrianSource.mjs'

test('uses a local Geofabrik extract without starting any Overpass request', async () => {
  let networkCalls = 0
  const source = await loadPedestrianSource({
    pbfWaysPath: '/fixture/dakar-ways.json',
    readFileImpl: async (path, encoding) => {
      assert.equal(path, '/fixture/dakar-ways.json')
      assert.equal(encoding, 'utf8')
      return JSON.stringify({ elements: [{ type: 'way', id: 42 }], endpoint: 'Geofabrik fixture' })
    },
    fetchImpl: async () => { networkCalls += 1; throw new Error('network must not be called') },
  })
  assert.equal(networkCalls, 0)
  assert.equal(source.endpoint, 'Geofabrik fixture')
  assert.deepEqual(source.data.elements, [{ type: 'way', id: 42 }])
})

test('rejects a malformed local extract without falling back to Overpass', async () => {
  let networkCalls = 0
  await assert.rejects(
    loadPedestrianSource({
      pbfWaysPath: '/fixture/invalid.json',
      readFileImpl: async () => JSON.stringify({ elements: null }),
      fetchImpl: async () => { networkCalls += 1; throw new Error('must not fetch') },
    }),
    /ne contient pas de tableau elements/,
  )
  assert.equal(networkCalls, 0)
})

test('uses Overpass endpoints only when no local PBF extract is supplied', async () => {
  const requested = []
  const source = await loadPedestrianSource({
    fetchImpl: async endpoint => {
      requested.push(endpoint)
      if (endpoint !== OVERPASS_ENDPOINTS[1]) throw new Error('endpoint unavailable')
      return { ok: true, json: async () => ({ elements: [{ type: 'node', id: 7 }] }) }
    },
  })
  assert.deepEqual(requested, OVERPASS_ENDPOINTS)
  assert.equal(source.endpoint, OVERPASS_ENDPOINTS[1])
  assert.deepEqual(source.data.elements, [{ type: 'node', id: 7 }])
})
