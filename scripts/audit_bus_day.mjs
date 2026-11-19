#!/usr/bin/env node
// Offline audit, never activation. With no --replay, run the actual UI planner
// on every distinct pair of form selections. An edition is optional; its IDs
// need reviewed line/direction keys, not a guess from the vehicle's short name.
import { readFileSync, writeFileSync, statSync } from 'node:fs'
import { isDeepStrictEqual, parseArgs } from 'node:util'
import { execFileSync } from 'node:child_process'
import { createServer } from 'vite'
import { busInventory } from './bus_inventory.mjs'
import { busReadiness, readinessTable } from './lib/busReadiness.mjs'
import { admittedServices } from './lib/journeyWitness.mjs'

const { values: v } = parseArgs({ options: Object.fromEntries(['at','replay','observations','edition','bindings','output','markdown'].map(k => [k, { type: 'string' }])) })
const epoch = Date.parse(`${v.at}Z`) / 1000
if (!/^\d{4}-\d\d-\d\dT\d\d:\d\d$/.test(v.at ?? '') || !Number.isFinite(epoch) || new Date(epoch*1000).toISOString().slice(0,16) !== v.at) throw Error('--at AAAA-MM-JJTHH:MM (Dakar) requis.')
const json = f => JSON.parse(readFileSync(f, 'utf8'))
const replay = v.replay ? json(v.replay) : JSON.parse(execFileSync(process.execPath, ['scripts/audit_place_connections.mjs','--matrix','--at',v.at,...(v.edition ? ['--edition',v.edition] : [])], { encoding: 'utf8', maxBuffer: 32*1024*1024 }))
const observations = json(v.observations ?? 'data/bus-review/sources-2026-11-19.json')
const vite = await createServer({ configFile: false, appType: 'custom', logLevel: 'error', optimizeDeps: { noDiscovery: true, include: [] }, server: { middlewareMode: true, hmr: false, watch: null, ws: false } })
try {
  const load = p => vite.ssrLoadModule(p)
  const { dakarNetwork, localPassengerData } = await load('/src/routing/dakar.ts')
  const { buildStopIndex } = await load('/src/domain/stops.ts')
  let net = dakarNetwork, snapshot
  if (v.edition) {
    if (statSync(v.edition).size > 6_000_001) throw Error('Édition trop grande.')
    const pack = json(v.edition); snapshot = pack.snapshot_id
    const { admitPassengerEdition } = await load('/src/routing/passengerEdition.ts')
    net = admitPassengerEdition(pack,snapshot,v.at.slice(0,10),localPassengerData)
    if (!net) throw Error('Édition refusée pour ce jour.')
  }
  if (replay.snapshotId !== snapshot || net.rejected.length || !isDeepStrictEqual(replay.pointIds, buildStopIndex([],net.places.values(),snapshot).filter(o => o.selectable).map(o => o.value)) ||
      !isDeepStrictEqual(replay.admittedServices, admittedServices(net,Math.floor(epoch/86400)*86400,epoch))) throw Error('Le reçu ne correspond pas au graphe et aux sélections de cette version.')
  const { dakarTransferReport } = await load('/src/admin/dakarTransferDossiers.ts')
  const report = busReadiness(await busInventory(load), observations, dakarTransferReport(net,epoch), replay, v.at, [...json('data/bus-review/local-pattern-bindings.json'), ...(v.bindings ? json(v.bindings) : [])])
  if (v.output) writeFileSync(v.output, JSON.stringify(report,null,2)+'\n')
  if (v.markdown) writeFileSync(v.markdown, readinessTable(report))
  console.log(`${report.atDakar} (Dakar) · ${report.rows.length} identités · ${report.pairs} couples · ${report.includes.bus} avec bus DDD/AFTU/TATA · ${report.includes.anyChange} avec changement.`)
} finally { await vite.close() }
