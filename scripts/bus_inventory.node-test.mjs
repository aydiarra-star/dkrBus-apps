import test, { before, after } from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { createServer } from 'vite'
import { busInventory, coverageTable } from './bus_inventory.mjs'

let server, report
before(async () => {
  server = await createServer({ configFile: false, server: { middlewareMode: true, hmr: false, watch: null, ws: false } })
  report = await busInventory(p => server.ssrLoadModule(p))
})
after(async () => { await server?.close() })
const evidence = (network, code) => report.lines.find(r => r.network === network && r.code === code).evidence

test('the versioned table is generated from the source union, not a schedule-board or archive line count', async () => {
  assert.equal(coverageTable(report), await readFile(new URL('../docs/couverture-sources-bus.md', import.meta.url), 'utf8'))
  assert.deepEqual(['ddd','aftu','tata'].map(n => report.lines.filter(r => r.network === n).length), [48,73,65])
  for (const code of ['15','15A','15B','TO1','TAF_TAF','TAF_TAF_TO1']) assert.ok(evidence('ddd', code).length)
  assert.ok(!report.lines.some(r => r.code === 'TAF_TAF / TO1'))
  assert.ok(evidence('ddd','18').some(e => e.kind === 'circuit'))
  assert.ok(evidence('aftu','2').some(e => e.returnVariants?.length === 2))
  assert.ok(!evidence('tata','40').some(e => e.kind === 'cartographic-section'))
})
test('counts directional occurrences rather than distinct names and never lends 85 the unassigned sequence', () => {
  for (const [fam, code, source, counts] of [['ddd','501','bidirectionalBusLines',[9,9]], ['aftu','83','aftu-83-directions.json',[93,90]],
    ['aftu','84','aftu-84-directions.json',[73,73]], ['aftu','89','aftu-89-directions.json',[55,53]], ['aftu','66','aftu-66-return.json',[77,77]]]) {
    const entries = evidence(fam,code).filter(e => e.source === source && e.labels)
    assert.deepEqual(entries.map(e => e.labels.length), counts)
  }
  const back = evidence('aftu','84').find(e => e.source === 'aftu-84-directions.json' && e.side === 'inbound' && e.labels)
  assert.equal(back.sourceTimes.length, 73); assert.equal(back.frequency.intervalMinutes, 14)
  assert.deepEqual(back.sourceTimes.slice(6,9), ['05:54','05:55','05:56'])
  assert.equal(evidence('aftu','89').some(e => e.frequency), false)
  assert.ok(report.context.siteObservations.every(o => o.site && !o.line))
  assert.deepEqual(report.unassigned.filter(e => e.sourceCode === '85-unverified').map(e => e.labels.length), [89,95])
  assert.ok(!evidence('aftu','85').some(e => e.source === 'aftu-85-directions.json'))
  assert.ok(evidence('ddd','1').some(e => e.stopIdStrings?.includes('UCAD') && !e.resolvedPlatforms))
})
test('reports cartographic sections, dated patterns and footways separately', () => {
  const traces = report.lines.flatMap(r => r.evidence.filter(e => e.kind === 'cartographic-section'))
  assert.equal(traces.length, 35)
  assert.deepEqual(report.pinnedOsm.relations.map(r => [r.id,r.version]), [[19961937,4],[19961993,3],[17357331,4],[19961714,2]])
  assert.equal(traces.find(e => e.id === 'aftu-40-maristes').markerKind, 'road-limit')
  assert.deepEqual(report.staticRouting.patterns.map(p => p.mode).sort(), ['brt','brt','ddd','ter'])
  assert.deepEqual(report.staticRouting.rejected, []); assert.equal(report.staticRouting.footways, 4)
})

test('the passenger CLI distinguishes street limits, source-only directions and dated rides', async () => {
  const { execFileSync } = await import('node:child_process')
  const plan = (from, to, ...rest) => execFileSync(process.execPath, ['scripts/audit_place_connections.mjs', '--at','2026-11-18T19:00', '--from',from, '--to',to, ...rest], { encoding:'utf8' })
  const a = 'landmark:bus-osm-305375476', b = 'landmark:bus-osm-3403676386'
  assert.match(plan(a, b), /DOCUMENTED_SECTION_ONLY[^]*Carte uniquement : AFTU 40[^]*938 m/)
  assert.doesNotMatch(plan(b, a), /Carte uniquement/)
  assert.doesNotMatch(plan(a, b, '--step-free'), /Carte uniquement/)
  assert.match(plan('landmark:gorom-2', 'landmark:noflaye'), /UNVERIFIED_ACCESS[^]*Fiche uniquement : AFTU 90/)
})

test('retains sources of divergent 74 evidence without calling them the Bargny return or its timetable', () => {
  const e = evidence('aftu','74').filter(r => r.source === 'aftu-74-directions.json')
  assert.deepEqual(e.filter(r => r.kind === 'directional-sheet').map(r => [r.side, r.labels.length]), [['outbound',14]])
  assert.equal(e.find(r => r.kind === 'unconfirmed-return').labels.length, 14)
  assert.deepEqual(e.filter(r => r.kind === 'service-reference').map(r => [r.scope, r.termini]), [
    ['other-corridor', ['Rufisque','Tivaouane Peul']], ['other-corridor', ['Tivaouane Peul','Rufisque']]])
})

test('the Jaxaay attributions are specific six-occurrence slices of the pinned transcriptions, not stops on a timetable', () => {
  const a = ['Station Shell De Jaxaay 2','Devant Lycée Jaxaay','Senelec Jaxaay 1',"Restaurant Le Carré D'As",'Jaxaay Devant Equiprest','Cité Asecna En Face Un Magasin De Carreaux']
  const b = [a[5],a[4],a[3],'Diakhaye Asecna Devant Shima Multiservices','Jaxaay En Face Lycée Plan Jaxaay Et Allo Store','Sedima Almadies 2 Route De Sedima En Face La Station Shell']
  for (const code of ['83','84','90','91']) {
    const entries = evidence('aftu', code), maps = entries.filter(e => e.sourceSlice)
    assert.equal(maps.length, 2)
    for (const map of maps) {
      const { first, last, side } = map.sourceSlice
      const sheet = entries.find(e => e.source === `aftu-${code}-directions.json` && e.side === side && e.labels)
      assert.deepEqual(sheet.labels.slice(first - 1, last), map.ways[0] === 642083765 ? a : b)
      assert.equal(map.markerKind, 'road-limit'); assert.equal(map.markerIds.length, 4)
      assert.ok(!map.sourceTimes && !map.frequency && !map.relation)
    }
  }
  assert.deepEqual(evidence('ddd','233').filter(e => e.kind === 'cartographic-section'), [])
})
