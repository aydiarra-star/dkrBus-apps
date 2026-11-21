#!/usr/bin/env node
// Run from the root of each candidate tree, with that tree's dependencies.
// Read-only: hash the complete serialized board/journey, not just successes or durations.
import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { resolve } from 'node:path'
import { pathToFileURL } from 'node:url'
const { createServer } = await import(pathToFileURL(resolve('node_modules/vite/dist/node/index.js')))
const server = await createServer({configFile:false, logLevel:'error', server:{middlewareMode:true, hmr:false, ws:false, watch:null}, optimizeDeps:{noDiscovery:true, include:[]}})
const load = path => server.ssrLoadModule(`/src/${path}.ts`)
const hash = () => createHash('sha256')
const append = (h, obj) => h.update(JSON.stringify(obj, (_, v) => v instanceof Map ? [...v.entries()] : v instanceof Set ? [...v] : v) + '\n')

try {
  const { buildStationBoard, boardLinesForNetwork } = await load('domain/stationBoard')
  const { genererHorairesTerDakarDiamniadio } = await load('domain/terDakarDiamniadio')
  const { dakarNetwork, planDakarJourney } = await load('routing/dakar')
  const { buildStopIndex } = await load('domain/stops')
  const instants = ['2026-11-19T04:44:59','2026-11-19T06:00:00','2026-11-19T12:07:30','2026-11-19T19:00:00',
    '2026-11-19T23:59:59','2026-11-20T19:00:00','2026-11-21T19:00:00','2026-11-22T19:00:00']
  const panels = hash(), trainBoards = hash(), journeys = hash()
  let boards = 0, stationRows = 0, pairs = 0, ok = 0
  for (const i of instants) for (const net of ['ter','brt']) for (const line of boardLinesForNetwork(net)) {
    const board = buildStationBoard(line, Date.parse(i + 'Z'))
    assert.ok(board); append(panels, [i,net,line.id,board]); boards++; stationRows += board.rows.length
  }
  // Both directions of the separate 13-station board from main, not the AIBD board.
  for (const i of instants) for (const direction of ['aller', 'retour']) {
    const train = genererHorairesTerDakarDiamniadio(direction, Date.parse(i + 'Z'))
    assert.equal(train?.rows.length, 13)
    append(trainBoards, [i, direction, train])
  }
  const options = buildStopIndex([], dakarNetwork.places.values()).filter(o => o.selectable)
  assert.equal(options.length, new Set(options.map(o => o.value)).size)
  const point = o => ({label:o.label, lat:o.lat, lng:o.lon, ...(o.kind === 'landmark' ? {kind:'map', landmarkId:o.value} : {stopId:o.stopId})})
  const at = '2026-11-19T19:00:00Z', settings = {departAt:Date.parse(at)/1000, maxChanges:3, stepFreeOnly:false}
  for (const a of options) for (const b of options) {
    if (a === b) continue
    const response = planDakarJourney(point(a), point(b), settings, dakarNetwork)
    append(journeys, [a.value,b.value,response]); pairs++; if (response.ok) ok++
  }
  const result = {at, pairs, points:options.length, ok, allOutcomesSha256:journeys.digest('hex'), instants, boards, stationRows, allBoardsSha256:panels.digest('hex'), trainBoardsSha256:trainBoards.digest('hex')}
  console.log(JSON.stringify(result, null, 2))
  if (process.argv.includes('--check')) {
    // Independent parent witnesses (see docs/recette-275): journeys from Arena,
    // both kinds of rail board from main after the Diamniadio anchor correction.
    assert.equal(result.allOutcomesSha256, '507b06642798dfc72d62a475fb90a2b5071cc48d76561db220648149a37d5351', 'Arena journey responses changed')
    assert.equal(result.allBoardsSha256, 'b3e748f721a3eb8c5700a927c3de0272c375d56d6e301eedb93a273888bffbb9', 'TER/BRT reference boards changed')
    assert.equal(result.trainBoardsSha256, '06b4a54d0744b28e427e1ace866f5b5b8eb8722ab89a11aebe964fff32174d49', 'Dakar–Diamniadio train boards changed')
  }
} finally { await server.close() }
