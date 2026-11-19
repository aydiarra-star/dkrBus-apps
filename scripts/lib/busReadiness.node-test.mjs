import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { execFileSync } from 'node:child_process'
import { createServer } from 'vite'
import { admittedServices, journeyWitnesses } from './journeyWitness.mjs'
import { busReadiness, readinessTable } from './busReadiness.mjs'
import { busInventory } from '../bus_inventory.mjs'
const observations = JSON.parse(readFileSync('data/bus-review/sources-2026-11-19.json','utf8'))
const matrix = JSON.parse(readFileSync('data/bus-review/replay-2026-11-19.json','utf8'))

test('the published seven-column audit covers every family/code; the service-day test is separate from all geometry candidates', async () => {
  const server = await createServer({ configFile: false, appType:'custom', logLevel:'error', server:{middlewareMode:true,watch:null,hmr:false,ws:false} })
  try {
    const load = p => server.ssrLoadModule(p), inventory = await busInventory(load)
    const { dakarNetwork } = await load('/src/routing/dakar.ts'), { dakarTransferReport } = await load('/src/admin/dakarTransferDossiers.ts')
    const ds = dakarTransferReport(dakarNetwork, Date.parse(matrix.atDakar+'Z')/1000)
    const report = busReadiness(inventory,observations,ds,matrix,matrix.atDakar)
    assert.equal(report.rows.length,186); assert.equal(readinessTable(report),readFileSync('docs/etat-par-ligne-2026-11-19.md','utf8'))
    const get = (network,code) => report.rows.find(l=>l.network===network && l.code===code)
    assert.equal(get('aftu','55').map.orientation,null); assert.equal(get('tata','33').map,null)
    assert.equal(get('aftu','80').direction.inbound.unconfirmed,true)
    assert.equal(get('aftu','33').map.possible,true); assert.equal(get('aftu','33').direction.outbound.fullShape,false)
    assert.deepEqual(get('aftu','83').direction.outbound.textCounts,[93]); assert.equal(get('aftu','83').mapSide,null)
    assert.deepEqual(get('ddd','1').relations[0].outside,[[21,22.07]]); assert.equal(get('ddd','23').relations.length,0)
    assert.ok(report.rows.every(l=>!l.calculation.length && !l.runs.length && l.blocker))
    assert.ok(get('ddd','501').transfers.every(t=>t.assessments.every(a=>a.timed.status==='BLOCKED_BEFORE_TIMETABLE')))
    assert.throws(()=>busReadiness(inventory,observations,ds,matrix,'2026-11-18T19:00'), /Matrice/)
    assert.throws(()=>busReadiness(inventory,observations,ds,{...matrix,wholeForm:false},matrix.atDakar), /Matrice/)
  } finally { await server.close() }
})

test('the ledger can credit a dated bus and an actual transfer in a synthetic publication, not a whole line from a section', async () => {
  const pack = JSON.parse(execFileSync('python3',['tests/passenger_edition_fixture.py','--same-position'],{encoding:'utf8',env:{ ...process.env,PYTHONPATH:'.' }}))
  const s = await createServer({ configFile:false, logLevel:'error',server:{middlewareMode:true,watch:null,hmr:false,ws:false} })
  try {
    const load=p=>s.ssrLoadModule(p), { admitPassengerEdition }=await load('/src/routing/passengerEdition.ts'), { planDakarJourney,localPassengerData }=await load('/src/routing/dakar.ts'), { endpointOf }=await load('/src/routing/placeConnections.ts')
    const at=pack.date+'T08:20', epoch=Date.parse(at+'Z')/1000, sid=pack.snapshot_id, net=admitPassengerEdition(pack,sid,pack.date,localPassengerData)
    const point = id => endpointOf(net.places.get(`gtfs:${sid}:stop:${id}`),sid)
    const actual=planDakarJourney(point('A2'),point('B3'),{departAt:epoch},net); assert.ok(actual.ok)
    const w=journeyWitnesses(); w.record('published:A2','published:B3',[...actual.options,...actual.options])
    assert.ok(w.rows().every(v=>v.odPairs===1 && v.withChange===1 && v.changeExample && !v.directExample))
    const replay={atDakar:at,points:2,pointIds:['published:A2','published:B3'],wholeForm:true,exclusive:{whole:1,noProposal:1},includes:{bus:1,anyChange:1},admittedServices:admittedServices(net,Math.floor(epoch/86400)*86400,epoch),rideWitnesses:w.rows()}
    // Identities in this fixture are SYNTHETIC (no attribution to real Dakar codes).
    const links=replay.admittedServices.filter(v=>['ddd','aftu','tata'].includes(v.mode)).map(p=>({...p,code:'QA',side:'outbound',scope:p.mode==='ddd'?'whole':'section',reference:'fixture'}))
    const inv={lines:links.map(l=>({network:l.mode,code:'QA',evidence:[]}))}
    assert.throws(()=>busReadiness(inv,observations,[],replay,at),/attribution explicites/)
    const result=busReadiness(inv,observations,[],replay,at,links)
    const [ddd,aftu,tata]=result.rows
    assert.ok(ddd.direction.outbound.physical && ddd.direction.outbound.fullShape && !ddd.direction.inbound.fullShape)
    assert.ok(!aftu.direction.outbound.fullShape); assert.equal(aftu.runs[0].atOriginOnDay,1)
    assert.equal(aftu.calculation[0].changeExample.legs.at(-1).samePosition,`access:${sid}:pB2`)
    assert.equal(tata.calculation.length,0); assert.equal(tata.runs.length,1)
  } finally { await s.close() }
})
