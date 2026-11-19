// Read only the public overlays already embedded in an AFTU detail page.
// Never run page JavaScript, fetch tiles or treat a map marker as a bus stop.
import { createHash } from 'node:crypto'

function literal(text) {
  // Older Waymark versions wrap the JSON in a JS single-quoted string.
  if (text.startsWith("'")) {
    const match = /^'((?:[^'\\]|\\.)*)'\s*\)/s.exec(text)
    return match && JSON.parse(match[1].replace(/\\(['\\])/g, '$1'))
  }
  // Accept a single JSON argument, not arbitrary JavaScript. A description can
  // contain a literal ');', so don't split the page at the first closing paren.
  for (const m of text.matchAll(/\)\s*;/g)) {
    try {
      const json = JSON.parse(text.slice(0, m.index))
      return typeof json === 'string' ? JSON.parse(json) : json
    } catch { /* might be inside a JSON string */ }
  }
}
const xy = v => Array.isArray(v) && v.length >= 2 && Number.isFinite(v[0]) && Number.isFinite(v[1]) && v[0] >= -17.7 && v[0] <= -16.9 && v[1] >= 14.4 && v[1] <= 15
const rad = n => n * Math.PI / 180
const meters = (a, b) => 12742000 * Math.asin(Math.sqrt(Math.sin(rad(b[1]-a[1])/2)**2 + Math.cos(rad(a[1]))*Math.cos(rad(b[1]))*Math.sin(rad(b[0]-a[0])/2)**2))
const hash = value => createHash('sha256').update(JSON.stringify(value)).digest('hex')

export function inspectWaymark(html, onLine) {
  const collections = []
  let calls = 0
  for (const script of html.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script\s*>/gi)) {
    for (const call of script[1].matchAll(/\bwaymark_viewer\.load_json\(\s*/g)) {
      if (++calls > 1) return { status: 'MULTIPLE_MAPS' } // even if one is unreadable
      try {
        const fc = literal(script[1].slice(call.index + call[0].length))
        if (fc?.type === 'FeatureCollection' && Array.isArray(fc.features)) collections.push(fc)
      } catch { /* report a missing/unreadable overlay, not an empty route */ }
    }
  }
  if (collections.length !== 1) return { status: collections.length ? 'MULTIPLE_MAPS' : 'NO_READABLE_OVERLAY' }
  const fc = collections[0], lines = [], markers = [], other = []
  for (const f of fc.features) {
    const g = f?.geometry, p = f?.properties
    if (g?.type === 'LineString') lines.push(g.coordinates)
    else if (g?.type === 'Point' && xy(g.coordinates)) markers.push({ role: String(p?.type ?? ''), position: g.coordinates, name: String(p?.title ?? '').slice(0,100) })
    else other.push(g?.type ?? 'missing') // do not stitch MultiLineStrings
  }
  return { status: 'MAP_READ', sha256: hash(fc), other, markers: markers.map(m => m.role), markerNames: markers.map(m => m.name), lines: lines.map(line => {
    if (!Array.isArray(line) || line.length < 2 || !line.every(xy)) return { status: 'INVALID_LINE' }
    const steps = line.slice(1).map((p, i) => meters(p, line[i]))
    const ends = [line[0], line.at(-1)]
    const offsets = markers.map(m => ends.map(p => meters(m.position, p)))
    const uniqueEnd = (role, i) => {
      const pins = markers.flatMap((m,j) => m.role.toLowerCase() === role ? [offsets[j]] : [])
      return pins.length === 1 && pins[0][i] <= 80 && pins[0][1-i] > 80
    }
    const orientation = uniqueEnd('start',0) && uniqueEnd('finish',1) ? 'start-first' : uniqueEnd('start',1) && uniqueEnd('finish',0) ? 'start-last' : null
    const shapeHash = hash(line)
    if (lines.length === 1 && !other.length) onLine?.({ positions: line, shapeHash, orientation })
    return { orientation, vertices: line.length, meters: Math.round(steps.reduce((a,b) => a+b, 0)), maxStepM: Math.round(steps.reduce((n,d) => Math.max(n,d), 0)),
      // 1-based segment ranks. A long chord isn't necessarily a missing road;
      // it does need independent street-level evidence before vehicle use.
      over300: steps.flatMap((d, i) => d > 300 ? [i+1] : []),
      endpoints: ends.map(p => p.slice(0, 2)),
      // Retain BOTH distances; don't pick the nearest and declare an orientation.
      markerOffsetsM: offsets.map(pair => pair.map(Math.round)),
      shapeHash, reverseHash: hash([...line].reverse()) }
  }) }
}
