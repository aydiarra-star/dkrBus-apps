import test from 'node:test'
import assert from 'node:assert/strict'
import { fromPbf } from './dddOsmEvidence.mjs'

const extract = { sourceUrl:'https://example.org/test.osm.pbf', sourceSha256:'a'.repeat(64), generatedAt:'2026-01-01T00:00:00Z',
  geographicBounds:{south:14.5, north:14.95, west:-17.6, east:-17.05}, attribution:'© OpenStreetMap contributors', license:'ODbL-1.0', relations:[] }
const relation = (id, ref, type) => ({ id, tags:{ type, ref }, memberCount:2, membersInRelationOrder:[{ref:9,role:'backward'},{ref:3,role:'stop_exit_only'}] })

test('PBF fallback matches reference tokens, retains source, order and roles; no operator inferred', () => {
  const relations = [relation(1,'217','route'),relation(2,'218;219','route_master'),relation(3,'2217','route'),relation(4,'228','site')]
  const r = fromPbf({...extract,relations})
  assert.equal(r.status,'PBF_FALLBACK'); assert.equal(r.sourceSha256,extract.sourceSha256)
  assert.deepEqual(r.geographicBounds,extract.geographicBounds); assert.deepEqual(r.relations,relations.slice(0,2))
})
test('distinguishes a read extract with no matches from missing or malformed evidence', () => {
  assert.equal(fromPbf(extract).relationCount,0)
  for (const bad of [{relations:null},{sourceSha256:null},{geographicBounds:{}},
    {relations:[{...relation(9,'228','route'),memberCount:3}]}]) assert.throws(() => fromPbf({...extract,...bad}))
})

test('collector preserves an outage diagnostic and fails on corrupt fallback (never presents either as zero relations)', async t => {
  const { mkdtemp, writeFile, readFile, readdir, rm } = await import('node:fs/promises')
  const { tmpdir } = await import('node:os'), { join } = await import('node:path')
  const { fileURLToPath } = await import('node:url'), { spawnSync } = await import('node:child_process')
  const cwd = await mkdtemp(join(tmpdir(),'ddd-evidence-')); t.after(() => rm(cwd,{recursive:true,force:true}))
  const pre = join(cwd,'fetch.mjs'), fallback = join(cwd,'pbf.json'), out = join(cwd,'artifacts/ddd/osm-217-218-219-228')
  const script = fileURLToPath(new URL('../extract_ddd_osm_directional_relations.mjs',import.meta.url))
  const run = path => spawnSync(process.execPath,['--import',pre,script], {cwd,encoding:'utf8', env:{...process.env,DAKAR_OSM_RELATIONS_JSON:path}})
  await writeFile(pre, 'globalThis.fetch = async () => new Response(JSON.stringify({elements:[]}))')
  assert.equal(run('').status,0); assert.ok((await readdir(out)).includes('overpass-217-218-219-228.raw.json'))
  await writeFile(pre, 'globalThis.fetch = async () => new Response(null,{status:503})')
  assert.equal(run('').status,75); assert.deepEqual(await readdir(out),['source-unavailable.json'])
  const unavailable = JSON.parse(await readFile(join(out,'source-unavailable.json')))
  assert.equal(unavailable.status,'SOURCE_UNAVAILABLE'); assert.equal(unavailable.attempts.length,3); assert.equal(unavailable.relationCount,undefined)
  await writeFile(fallback, JSON.stringify(extract)); assert.equal(run(fallback).status,0)
  assert.deepEqual(await readdir(out),['pbf-217-218-219-228-report.json'])
  await writeFile(fallback,'{}'); assert.equal(run(fallback).status,1)
})
