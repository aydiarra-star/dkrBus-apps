const WALKABLE_HIGHWAYS = new Set([
  'footway', 'pedestrian', 'path', 'steps', 'living_street',
  'residential', 'service', 'unclassified', 'tertiary', 'secondary', 'primary', 'trunk', 'trunk_link',
])
const ALWAYS_MOTOR_ONLY = new Set(['motorway', 'motorway_link'])

export function isWalkableOsmWay(tags = {}) {
  const highway = String(tags.highway ?? '')
  if (!WALKABLE_HIGHWAYS.has(highway)) return false
  const foot = String(tags.foot ?? tags['foot:access'] ?? '').toLowerCase()
  const access = String(tags.access ?? '').toLowerCase()
  if (['no', 'private'].includes(foot)) return false
  if (['no', 'private'].includes(access) && !['yes', 'designated', 'permissive', 'destination'].includes(foot)) return false
  if (ALWAYS_MOTOR_ONLY.has(highway)) return false
  const sidewalk = String(tags.sidewalk ?? '').toLowerCase()
  const hasSidewalk = ['yes', 'both', 'left', 'right'].includes(sidewalk)
    || ['yes', 'designated'].includes(String(tags['sidewalk:left'] ?? '').toLowerCase())
    || ['yes', 'designated'].includes(String(tags['sidewalk:right'] ?? '').toLowerCase())
  const majorRoad = ['tertiary', 'secondary', 'primary', 'trunk', 'trunk_link'].includes(highway)
  if (majorRoad && !hasSidewalk && !['yes', 'designated', 'permissive'].includes(foot)) return false
  if (highway === 'service' && ['driveway', 'parking_aisle', 'private'].includes(String(tags.service ?? '')) && !['yes', 'designated', 'permissive'].includes(foot)) return false
  return true
}

function distanceMeters(a, b) {
  const rad = Math.PI / 180
  const dLat = (b.lat - a.lat) * rad
  const dLon = (b.lon - a.lon) * rad
  const lat1 = a.lat * rad
  const lat2 = b.lat * rad
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2
  return 6371000 * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(Math.max(0, 1 - h)))
}

/**
 * Build a pedestrian-only candidate graph from OSM ways. The graph preserves
 * OSM node IDs and way segment geometry. It does not invent stop entrances or
 * connect a stop to its nearest road; those links require separate evidence.
 */
export function buildPedestrianGraph(elements = []) {
  const nodes = new Map()
  const edges = []
  let skippedWays = 0
  for (const way of elements) {
    if (way.type !== 'way' || !isWalkableOsmWay(way.tags)) continue
    const refs = Array.isArray(way.nodes) ? way.nodes : []
    const geometry = Array.isArray(way.geometry) ? way.geometry : []
    if (refs.length < 2 || geometry.length !== refs.length) {
      skippedWays += 1
      continue
    }
    const valid = geometry.every(point =>
      Number.isFinite(point?.lat) && Number.isFinite(point?.lon)
      && point.lat >= 14.4 && point.lat <= 15.0
      && point.lon >= -17.7 && point.lon <= -16.9
    )
    if (!valid) {
      skippedWays += 1
      continue
    }
    geometry.forEach((point, index) => nodes.set(String(refs[index]), { id: String(refs[index]), lat: point.lat, lon: point.lon }))
    const footOneWay = String(way.tags?.['oneway:foot'] ?? way.tags?.['foot:oneway'] ?? '').toLowerCase()
    for (let index = 0; index < refs.length - 1; index += 1) {
      const from = String(refs[index])
      const to = String(refs[index + 1])
      const a = geometry[index]
      const b = geometry[index + 1]
      const meters = distanceMeters(a, b)
      if (!Number.isFinite(meters) || meters <= 0) continue
      const positions = [{ lat: a.lat, lon: a.lon }, { lat: b.lat, lon: b.lon }]
      if (footOneWay !== '-1') edges.push({ from, to, meters, mode: 'walk', positions, wayId: way.id })
      if (!['yes', '1', 'true'].includes(footOneWay)) edges.push({ from: to, to: from, meters, mode: 'walk', positions: [...positions].reverse(), wayId: way.id })
    }
  }
  return {
    schemaVersion: 1,
    source: 'OpenStreetMap ways',
    attribution: '© OpenStreetMap contributors',
    license: 'ODbL-1.0',
    status: 'CANDIDATE_GRAPH_NOT_YET_CONNECTED_TO_STOPS',
    nodes: [...nodes.values()],
    edges,
    summary: {
      nodeCount: nodes.size,
      directedEdgeCount: edges.length,
      walkableWayCount: new Set(edges.map(edge => edge.wayId)).size,
      skippedWays,
    },
  }
}
