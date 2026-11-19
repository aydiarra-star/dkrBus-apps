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
