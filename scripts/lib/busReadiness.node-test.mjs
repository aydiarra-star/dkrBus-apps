import test from 'node:test'
import assert from 'node:assert/strict'
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { execFileSync } from 'node:child_process'
import { createServer } from 'vite'
import { admittedServices, journeyWitnesses } from './journeyWitness.mjs'
import { busReadiness, readinessTable } from './busReadiness.mjs'
import { busInventory } from '../bus_inventory.mjs'
const observations = JSON.parse(readFileSync('data/bus-review/sources-2026-11-19.json','utf8'))
const matrix = JSON.parse(readFileSync('data/bus-review/replay-calculateur-2026-11-19.json','utf8'))
const bindings = JSON.parse(readFileSync('data/bus-review/local-pattern-bindings.json','utf8'))

test('the published seven-column audit covers every family/code; the service-day test is separate from all geometry candidates', async () => {
  const server = await createServer({ configFile: false, appType:'custom', logLevel:'error', server:{middlewareMode:true,watch:null,hmr:false,ws:false} })
  try {
    const load = p => server.ssrLoadModule(p), inventory = await busInventory(load)
    const { dakarNetwork } = await load('/src/routing/dakar.ts'), { dakarTransferReport } = await load('/src/admin/dakarTransferDossiers.ts')
    const ds = dakarTransferReport(dakarNetwork, Date.parse(matrix.atDakar+'Z')/1000)
    const report = busReadiness(inventory,observations,ds,matrix,matrix.atDakar,bindings)
    assert.equal(report.rows.length,186); assert.equal(readinessTable(report),readFileSync('docs/etat-par-ligne-2026-11-19.md','utf8'))
    const get = (network,code) => report.rows.find(l=>l.network===network && l.code===code)
    assert.equal(get('aftu','55').map.orientation,null); assert.equal(get('tata','33').map,null)
    assert.equal(get('aftu','80').direction.inbound.unconfirmed,true)
    assert.equal(get('aftu','33').map.possible,true); assert.equal(get('aftu','33').direction.outbound.fullShape,false)
    assert.deepEqual(get('aftu','83').direction.outbound.textCounts,[93]); assert.equal(get('aftu','83').mapSide,null)
    assert.deepEqual(get('ddd','1').relations[0].outside,[[21,22.07]]); assert.equal(get('ddd','23').relations.length,0)
    const one = get('ddd','1')
    assert.deepEqual(one.active.map(p=>[p.scope,p.side,p.calls,p.physicalCallRanks,p.service]), [['section','outbound',8,[1,2,3,4,5,6,7,8],'frequency'],['section','inbound',2,[1,2],'frequency']])
    assert.equal(one.direction.outbound.fullShape,false); assert.equal(one.direction.outbound.physical,false)
    assert.deepEqual(one.calculation.map(w=>[w.odPairs,w.withChange]), [[28,0],[1,0]])
    assert.ok(report.rows.filter(l=>l!==one).every(l=>!l.calculation.length && !l.runs.length && l.blocker))
    assert.ok(get('ddd','501').transfers.every(t=>t.assessments.every(a=>a.timed.status==='BLOCKED_BEFORE_TIMETABLE')))
    assert.throws(()=>busReadiness(inventory,observations,ds,matrix,'2026-11-18T19:00'), /Matrice/)
    assert.throws(()=>busReadiness(inventory,observations,ds,{...matrix,wholeForm:false},matrix.atDakar), /Matrice/)
  } finally { await server.close() }
})

test('new form selections do not recategorize the 716 old complete journeys or their legs', () => {
  const read = name => JSON.parse(readFileSync(`data/bus-review/${name}-2026-11-19.json`,'utf8'))
  const before=read('replay-panneaux-v1'), after=read('replay-calculateur-144')
  for (const k of ['pointIds','atDakar','maxChanges','stepFreeOnly','includes','wholeJourneySha256','rideWitnesses']) assert.deepEqual(after[k],before[k],k)
  assert.equal(after.exclusive.whole,716); assert.equal(after.wholeForm,false)
  assert.equal(matrix.points,154); assert.deepEqual(matrix.pointIds.slice(0,144),after.pointIds)
  assert.ok(matrix.pointIds.slice(144).every(id=>id.startsWith('ref:ddd-1-medina-')))
  assert.deepEqual(matrix.rideWitnesses.filter(w=>w.mode!=='ddd'),before.rideWitnesses)
  const fixed=read('replay-calculateur-150')
  assert.deepEqual(fixed.pointIds,matrix.pointIds.slice(0,150)); assert.equal(fixed.wholeForm,false)
  assert.equal(fixed.exclusive.whole,731); assert.equal(fixed.includes.bus,15)
  assert.equal(fixed.movementSha256,'e52dea221c8b05d325f468aaee574a273a219b1e7d1a010ee7f0b8457842d63d')
  assert.equal(after.movementSha256,'f728e23c4c436225e508d2ed2b635f774ce65153a62cd2c4af636acc99f9327e')
  assert.equal(matrix.exclusive.whole,745); assert.equal(matrix.includes.bus,29); assert.equal(matrix.includes.anyChange,0)
})

test('the ledger can credit a dated bus and an actual transfer in a synthetic publication, not a whole line from a section', async () => {
  const pack = JSON.parse(execFileSync('python3',['tests/passenger_edition_fixture.py','--same-position'],{encoding:'utf8',env:{ ...process.env,PYTHONPATH:'.' }}))
  const s = await createServer({ configFile:false, logLevel:'error',server:{middlewareMode:true,watch:null,hmr:false,ws:false} })
  try {
    const load=p=>s.ssrLoadModule(p), { admitPassengerEdition }=await load('/src/routing/passengerEdition.ts'), { planDakarJourney,localPassengerData }=await load('/src/routing/dakar.ts'), { endpointOf }=await load('/src/routing/placeConnections.ts')
    const at=pack.date+'T08:20', epoch=Date.parse(at+'Z')/1000, sid=pack.snapshot_id, net=admitPassengerEdition(pack,sid,pack.date,localPassengerData)
    const point = id => endpointOf(net.places.get(`gtfs:${sid}:stop:${id}`),sid)
    const actual=planDakarJourney(point('A2'),point('B3'),{departAt:epoch},net); assert.ok(actual.ok)
    const { assessTransfer }=await load('/src/routing/transferReview.ts'), { transferWitness }=await load('/src/admin/transferWitness.ts')
    const change=pack.dataset.samePlatformChanges[0], binding=role=>pack.dataset.platformBindings.find(b=>b.role===role && b.lineId===change[role].lineId && b.stopId===change[role].stopId)
    const proof={samePosition:true,alight:binding('alight'),board:binding('board')}
    const assessment=assessTransfer(net,{from:change.alight,to:change.board,betweenSites:false},proof)
    const timed=transferWitness(net,assessment,proof,epoch)
    assert.equal(timed.status,'DATED_WITNESS'); assert.equal(timed.walkSeconds,0); assert.equal(timed.onwardWaitSeconds,300)
    assert.equal(transferWitness(net,assessment,proof,epoch+1).status,'NO_DATED_WITNESS')
    const w=journeyWitnesses(); w.record('published:A2','published:B3',[...actual.options,...actual.options])
    assert.ok(w.rows().every(v=>v.odPairs===1 && v.withChange===1 && v.changeExample && !v.directExample))
    const replay={atDakar:at,maxChanges:3,points:2,pointIds:['published:A2','published:B3'],wholeForm:true,exclusive:{whole:1,noProposal:1},includes:{bus:1,anyChange:1},admittedServices:admittedServices(net,Math.floor(epoch/86400)*86400,epoch),rideWitnesses:w.rows()}
    // Identities in this fixture are SYNTHETIC (no attribution to real Dakar codes).
    const synthetic=replay.admittedServices.filter(v=>v.lineId.startsWith(`gtfs:${sid}:`) && ['ddd','aftu','tata'].includes(v.mode)).map(p=>({...p,code:'QA',side:'outbound',scope:p.mode==='ddd'?'whole':'section',reference:'fixture'}))
    const links=[...synthetic,...bindings]
    const inv={lines:links.map(l=>({network:l.mode,code:l.code,evidence:[]}))}
    assert.throws(()=>busReadiness(inv,observations,[],replay,at),/attribution explicites/)
    const result=busReadiness(inv,observations,[],replay,at,links)
    const [ddd,aftu,tata,medina]=result.rows
    assert.equal(medina.code,'1'); assert.equal(medina.calculation.length,0); assert.equal(medina.active[0].scope,'section')
    assert.ok(ddd.direction.outbound.physical && ddd.direction.outbound.fullShape && !ddd.direction.inbound.fullShape)
    assert.ok(!aftu.direction.outbound.fullShape); assert.equal(aftu.runs[0].atOriginOnDay,1)
    assert.equal(aftu.calculation[0].changeExample.legs.at(-1).samePosition,`access:${sid}:pB2`)
    assert.equal(tata.calculation.length,0); assert.equal(tata.runs.length,1)
  } finally { await s.close() }
})


test('mode diagnosis counts a real mixed option on a dated test edition but not a missed onward boarding', () => {
  const dir = mkdtempSync(join(tmpdir(),'mode-witness-'))
  try {
    const pack = JSON.parse(execFileSync('python3',['tests/passenger_edition_fixture.py','--same-position'],{encoding:'utf8',env:{...process.env,PYTHONPATH:'.'}}))
    const edition = join(dir,'edition.json'), points = join(dir,'two.json')
    writeFileSync(edition,JSON.stringify(pack)); writeFileSync(points,JSON.stringify(['published:A2','published:B3']))
    const run = t => JSON.parse(execFileSync(process.execPath,['scripts/audit_place_connections.mjs','--matrix','--edition',edition,'--points',points,'--modes','ddd,aftu','--at',`${pack.date}T${t}`],{encoding:'utf8'}))
    const result = run('08:20'); assert.equal(result.wholeForm,false)
    assert.deepEqual(result.diagnosis.minimumChanges,{direct:0,one:1,multiple:0}); assert.equal(result.diagnosis.withAllRequiredModes,1)
    assert.equal(result.includes.samePositionChange,1); assert.equal(result.includes.transferWalk,0)
    assert.equal(run('08:21').diagnosis.withAllRequiredModes,0)
  } finally { rmSync(dir,{force:true,recursive:true}) }
})
