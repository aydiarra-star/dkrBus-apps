import { readFile, writeFile } from 'node:fs/promises'
import { join } from 'node:path'

const root = 'artifacts/ddd-historical-arcgis'
const files = (await (await import('node:fs/promises')).readdir(root))
  .filter((name) => /^layer-\d+-stops-line-.*\.json$/.test(name))
const routeFiles = (await (await import('node:fs/promises')).readdir(root))
  .filter((name) => /^layer-\d+-route-line-.*\.json$/.test(name))

function projectPointOnSegment(point, a, b) {
  const dx = b[0] - a[0]
  const dy = b[1] - a[1]
  const lengthSquared = dx * dx + dy * dy
  const t = lengthSquared === 0 ? 0 : Math.max(0, Math.min(1,
    ((point[0] - a[0]) * dx + (point[1] - a[1]) * dy) / lengthSquared))
  const x = a[0] + t * dx
  const y = a[1] + t * dy
  return { x, y, distance: Math.hypot(point[0] - x, point[1] - y), t,
    segmentLength: Math.sqrt(lengthSquared) }
}

function projectOnRoute(point, paths) {
  let best = null
  let pathOffset = 0
  for (let pathIndex = 0; pathIndex < paths.length; pathIndex += 1) {
    const path = paths[pathIndex]
    let chainage = 0
    for (let i = 1; i < path.length; i += 1) {
      const hit = projectPointOnSegment(point, path[i - 1], path[i])
      const candidate = { ...hit, pathIndex, segmentIndex: i - 1,
        chainageMeters: pathOffset + chainage + hit.t * hit.segmentLength }
      if (!best || candidate.distance < best.distance) best = candidate
      chainage += hit.segmentLength
    }
    pathOffset += chainage
  }
  return best
}

const routeByLine = new Map()
for (const name of routeFiles) {
  const snapshot = JSON.parse(await readFile(join(root, name), 'utf8'))
  const line = snapshot.layer.line
  const paths = (snapshot.features ?? []).flatMap((feature) => feature.geometry?.paths ?? [])
    .filter((path) => path.length >= 2)
  routeByLine.set(line, { file: name, paths })
}

const report = []
for (const name of files) {
  const snapshot = JSON.parse(await readFile(join(root, name), 'utf8'))
  const { id: layerId, line } = snapshot.layer
  const route = routeByLine.get(line)
  const candidates = (snapshot.features ?? []).map((feature) => {
    const geometry = feature.geometry
    if (!geometry) return {
      sourceLayerId: layerId, sourceLine: line, objectId: feature.attributes.OBJECTID,
      attributes: feature.attributes, geometry: null, routeProjection: null,
      review: 'missing_stop_geometry',
    }
    const projection = route?.paths.length
      ? projectOnRoute([geometry.x, geometry.y], route.paths)
      : null
    return {
      sourceLayerId: layerId, sourceLine: line, objectId: feature.attributes.OBJECTID,
      attributes: feature.attributes, geometry,
      routeProjection: projection ? {
        pathIndex: projection.pathIndex, segmentIndex: projection.segmentIndex,
        chainageMeters: Number(projection.chainageMeters.toFixed(2)),
        distanceToRouteMeters: Number(projection.distance.toFixed(2)),
      } : null,
      review: !route?.paths.length ? 'route_geometry_unavailable'
        : !projection ? 'route_projection_unavailable'
        : projection.distance > 25 ? 'far_from_historical_route'
        : !feature.attributes.Nom_Arret ? 'stop_name_missing'
        : 'historical_candidate',
    }
  })
  const ordered = [...candidates].sort((a, b) =>
    (a.routeProjection?.chainageMeters ?? Number.POSITIVE_INFINITY)
      - (b.routeProjection?.chainageMeters ?? Number.POSITIVE_INFINITY)
      || a.objectId - b.objectId)
  const distances = candidates.map((x) => x.routeProjection?.distanceToRouteMeters).filter(Number.isFinite)
  const objectIdOrder = candidates.filter((x) => x.routeProjection)
    .sort((a, b) => a.objectId - b.objectId)
    .map((x) => x.routeProjection.chainageMeters)
  const reversals = objectIdOrder.slice(1).filter((value, i) => value < objectIdOrder[i]).length
  const result = {
    generatedAt: new Date().toISOString(),
    sourceService: snapshot.serviceUrl,
    sourceLayerId: layerId,
    line,
    routeSourceLayer: route?.file ?? null,
    rawFeatureCount: candidates.length,
    geocodedFeatureCount: candidates.filter((x) => x.geometry).length,
    missingGeometryCount: candidates.filter((x) => !x.geometry).length,
    namedStopCount: candidates.filter((x) => Boolean(x.attributes.Nom_Arret?.trim())).length,
    routeProjectionReversalsInObjectIdOrder: reversals,
    maxDistanceToHistoricalRouteMeters: distances.length ? Math.max(...distances) : null,
    ordering: 'historical route chainage candidate; not an operational Aller/Retour certification',
    candidates: ordered,
  }
  const out = join(root, `ordered-candidates-layer-${layerId}-line-${line}.json`)
  await writeFile(out, JSON.stringify(result, null, 2) + '\n')
  report.push({
    layerId, line, raw: candidates.length,
    mapped: result.geocodedFeatureCount, missingGeometry: result.missingGeometryCount,
    named: result.namedStopCount, chainageReversals: reversals,
    maxDistanceToRouteMeters: result.maxDistanceToHistoricalRouteMeters,
    output: out,
  })
  console.log(`DDD ${line} / couche ${layerId}: ${candidates.length} points, ${result.geocodedFeatureCount} géométriques, ${result.namedStopCount} nommés, ${reversals} rupture(s) d'ordre`)
}
await writeFile(join(root, 'ordered-candidates-summary.json'), JSON.stringify({
  generatedAt: new Date().toISOString(),
  note: 'Ordre géométrique historique uniquement. Ne prouve ni le sens actuel, ni le service actuel, ni l identité commerciale de chaque arrêt.',
  totals: {
    layers: report.length,
    rawFeatures: report.reduce((n, x) => n + x.raw, 0),
    mappedFeatures: report.reduce((n, x) => n + x.mapped, 0),
    missingGeometry: report.reduce((n, x) => n + x.missingGeometry, 0),
  },
  layers: report,
}, null, 2) + '\n')
