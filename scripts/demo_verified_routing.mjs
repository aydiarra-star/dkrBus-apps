#!/usr/bin/env node
// Reproducible read-only demonstration using precisely the frontend's local
// modules (including Vite ?raw GeoJSON imports). No API, GPS or live service.
import { createServer } from 'vite'
import assert from 'node:assert/strict'
const server = await createServer({ configFile: false, appType: 'custom', server: { middlewareMode: true, hmr: false, watch: null } })
try {
  const { dakarNetwork } = await server.ssrLoadModule('/src/routing/dakar.ts')
  const { search } = await server.ssrLoadModule('/src/routing/search.ts')
  const { dakarClock } = await server.ssrLoadModule('/src/routing/presentation.ts')
  assert.deepEqual(dakarNetwork.rejected, [])
  const departAt = Date.parse('2026-11-18T08:01:00Z') / 1000
  for (const [origin, destination, expected] of [
    ['ter-dakar', 'ter-pikine', true], ['ter-colobane', 'ter-diamniadio', true],
    ['brt-prefecture-guediawaye', 'brt-petersen', true], ['brt-grand-medine', 'brt-liberte-6', true],
    ['brt-petersen', 'brt-gueule-tapee', true], ['brt-petersen', 'brt-prefecture-guediawaye', false], ['ter-pikine', 'ter-dakar', false],
    ['brt-prefecture-guediawaye', 'ter-rufisque', false],
  ]) {
    const result = search(dakarNetwork, { origin, destination, departAt })
    assert.equal(result.ok, expected, `${origin} → ${destination}`)
    if (!result.ok) { console.log(`${origin} → ${destination} : refus (${result.code})`); continue }
    const t = result.options[0], ride = t.legs[0]
    console.log(`${ride.from.name} → ${ride.to.name} | ${ride.lineName} | montée ${dakarClock(ride.start)}, arrivée ≈ ${dakarClock(t.end)} | attente ${t.waitSeconds} s, à bord ${t.rideSeconds} s | ${Math.round(t.meters)} m | ${ride.positions.length} sommets`)
  }
} finally { await server.close() }
