import test from 'node:test'
import assert from 'node:assert/strict'
import { inspectWaymark } from './waymarkLines.mjs'
const line = {geometry:{type:'LineString',coordinates:[[-17.44,14.7],[-17.43,14.7],[-17.4299,14.7]]}}
const marker = {properties:{type:'Finish',title:'fin ); du tracé'},geometry:{type:'Point',coordinates:line.geometry.coordinates[0]}}
const html = (features, encode = v => v) => `<script>waymark_viewer.load_json(${encode(JSON.stringify({type:'FeatureCollection',features}))});</script>`
test('reads the actual JSON overlay, not a basemap, and retains orientation conflicts', () => {
  for (const encode of [v => v, JSON.stringify, v => `'${v}'`]) {
    const m = inspectWaymark(html([line, marker], encode))
    assert.deepEqual(m.markers,['Finish']); assert.equal(m.lines[0].vertices,3)
    assert.deepEqual(m.lines[0].over300,[1]); assert.deepEqual(m.lines[0].markerOffsetsM,[[0,1086]])
  }
})
test('unknown, ambiguous and multipart maps are not complete lines', () => {
  assert.equal(inspectWaymark('<script>waymark_viewer.load_json(js());</script>').status,'NO_READABLE_OVERLAY')
  assert.equal(inspectWaymark(html([])+html([])).status,'MULTIPLE_MAPS')
  assert.deepEqual(inspectWaymark(html([{geometry:{type:'MultiLineString'}}])).lines,[])
  assert.equal(inspectWaymark(html([{geometry:{type:'LineString',coordinates:[[14,-17],[15,-17]]}}])).lines[0].status,'INVALID_LINE')
})

test('only hands a single valid drawing to the road check; reads Start at either end and leaves duplicate roles ambiguous', () => {
  const start = { properties: {type: 'start'}, geometry: {type: 'Point',coordinates: line.geometry.coordinates.at(-1)} }
  const seen = []
  inspectWaymark(html([line,start,marker]), v => seen.push(v))
  assert.deepEqual(seen[0].markers[1], { role:'Finish', name:'fin ); du tracé', position:line.geometry.coordinates[0] });
  assert.equal(seen[0].overlayHash, inspectWaymark(html([line,start,marker])).sha256)
  assert.equal(seen[0].orientation,'start-last'); assert.deepEqual(seen[0].positions,line.geometry.coordinates)
  inspectWaymark(html([line,start,start,marker]), v => seen.push(v)); assert.equal(seen[1].orientation,null)
  for (const h of [html([line,marker])+html([], () => 'invalid()'),html([line,null]),html([line,line]),html([{geometry:{type:'MultiLineString'}}])]) inspectWaymark(h, v => seen.push(v))
  assert.equal(seen.length,2)
})
