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

export function inspectWaymark(html) {
  const collections = []
  for (const script of html.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script\s*>/gi)) {
    for (const call of script[1].matchAll(/\bwaymark_viewer\.load_json\(\s*/g)) {
      try {
        const fc = literal(script[1].slice(call.index + call[0].length))
        if (fc?.type === 'FeatureCollection' && Array.isArray(fc.features)) collections.push(fc)
      } catch { /* report a missing/unreadable overlay, not an empty route */ }
    }
  }
  if (collections.length !== 1) return { status: collections.length ? 'MULTIPLE_MAPS' : 'NO_READABLE_OVERLAY' }
  const fc = collections[0], lines = [], markers = [], other = []
  for (const { geometry: g, properties: p } of fc.features) {
    if (g?.type === 'LineString') lines.push(g.coordinates)
    else if (g?.type === 'Point' && xy(g.coordinates)) markers.push({ role: String(p?.type ?? ''), position: g.coordinates })
    else other.push(g?.type ?? 'missing') // do not stitch MultiLineStrings
  }
  return { status: 'MAP_READ', sha256: hash(fc), other, markers: markers.map(m => m.role), lines: lines.map(line => {
    if (!Array.isArray(line) || line.length < 2 || !line.every(xy)) return { status: 'INVALID_LINE' }
    const steps = line.slice(1).map((p, i) => meters(p, line[i]))
    const ends = [line[0], line.at(-1)]
    return { vertices: line.length, meters: Math.round(steps.reduce((a,b) => a+b, 0)), maxStepM: Math.round(Math.max(...steps)),
      // 1-based segment ranks. A long chord isn't necessarily a missing road;
      // it does need independent street-level evidence before vehicle use.
      over300: steps.flatMap((d, i) => d > 300 ? [i+1] : []),
      endpoints: ends.map(p => p.slice(0, 2)),
      // Retain BOTH distances; don't pick the nearest and declare an orientation.
      markerOffsetsM: markers.map(m => ends.map(p => Math.round(meters(m.position, p)))),
      shapeHash: hash(line), reverseHash: hash([...line].reverse()) }
  }) }
}
