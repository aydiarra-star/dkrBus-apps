import { readFile, writeFile } from 'node:fs/promises'

const [osmPath, arcgisPath, outputPath = 'ddd-osm-arcgis-crosscheck.json'] = process.argv.slice(2)
if (!osmPath || !arcgisPath) {
  throw new Error('Usage: node scripts/compare_ddd_osm_arcgis_stops.mjs <osm-json> <ddd-arcgis-json> [output-json]')
}

const [osm, arcgis] = await Promise.all([
  readFile(osmPath, 'utf8').then(JSON.parse),
  readFile(arcgisPath, 'utf8').then(JSON.parse),
])

// ArcGIS stop-layer IDs in the public DDD urban FeatureServer.
const stopLayerByLine = {
  '1': 5, '6': 1, '7': 2, '8': 3, '9': 4, '10': 6, '121': 7, '13': 8, '18': 9, '23': 10, '4': 11,
}
const stopLayers = new Map(
  arcgis.layers
    .filter((layer) => layer.kind === 'stops')
    .map((layer) => [layer.layerId, layer]),
)

const radians = (degrees) => degrees * Math.PI / 180
function distanceMeters(a, b) {
  const earthRadius = 6_371_000
  const dLat = radians(b.lat - a.lat)
  const dLon = radians(b.lon - a.lon)
  const lat1 = radians(a.lat)
  const lat2 = radians(b.lat)
  const h = Math.sin(dLat / 2) ** 2
    + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2
  return 2 * earthRadius * Math.asin(Math.sqrt(h))
}

const comparisons = []
const unmatchedCandidateRoutes = []
for (const route of osm.routes) {
  if (route.scopeStatus !== 'DAKAR_CANDIDATE') continue
  const rawRef = String(route.ref ?? '').trim()
  const line = rawRef.replace(/^L\s*/i, '').trim()
  const layerId = stopLayerByLine[line]
  if (!layerId) {
    unmatchedCandidateRoutes.push({
      osmRelationId: route.osmRelationId,
      ref: rawRef || null,
      name: route.name,
      stopMemberCount: route.orderedStopMembers.length,
      reason: rawRef.includes(';')
        ? 'MULTIPLE_LINE_REFERENCES_REQUIRE_MANUAL_REVIEW'
        : 'NO_MATCHING_DDD_URBAN_STOP_LAYER',
    })
    continue
  }

  const layer = stopLayers.get(layerId)
  if (!layer) continue
  const arcgisStops = layer.features.flatMap((feature) => {
    const geometry = feature.geometry
    if (!Number.isFinite(geometry?.x) || !Number.isFinite(geometry?.y)) return []
    return [{
      name: feature.attributes?.Nom_Arret ?? null,
      lat: geometry.y,
      lon: geometry.x,
    }]
  })

  const comparisonsForRoute = route.orderedStopMembers.flatMap((member) => {
    const point = member.coordinates
    if (!Number.isFinite(point?.lat) || !Number.isFinite(point?.lon) || !arcgisStops.length) return []
    let nearest = null
    for (const stop of arcgisStops) {
      const distance = distanceMeters({ lat: point.lat, lon: point.lon }, stop)
      if (!nearest || distance < nearest.distanceMeters) {
        nearest = { distanceMeters: Number(distance.toFixed(1)), arcgisStopName: stop.name }
      }
    }
    return [{
      osmSequence: member.sequence,
      osmType: member.type,
      osmRef: member.ref,
      nearestArcgisStopName: nearest.arcgisStopName,
      nearestDistanceMeters: nearest.distanceMeters,
    }]
  })

  const distances = comparisonsForRoute.map((item) => item.nearestDistanceMeters)
  const countWithin = (threshold) => distances.filter((distance) => distance <= threshold).length
  comparisons.push({
    network: 'DDD',
    line,
    osmRelationId: route.osmRelationId,
    osmName: route.name,
    from: route.from,
    to: route.to,
    scopeStatus: route.scopeStatus,
    osmOrderedStopCount: route.orderedStopMembers.length,
    arcgisLayerId: layerId,
    arcgisLayerName: layer.layerName,
    arcgisStopCount: arcgisStops.length,
    method: 'For each OSM stop member, find the nearest point in the corresponding DDD ArcGIS stop layer; nearest-neighbour counts are not one-to-one matches.',
    nearestArcgisStopWithin25m: countWithin(25),
    nearestArcgisStopWithin50m: countWithin(50),
    nearestArcgisStopWithin100m: countWithin(100),
    nearestArcgisStopWithin200m: countWithin(200),
    stopComparisons: comparisonsForRoute,
  })
}

const report = {
  generatedAt: new Date().toISOString(),
  sources: {
    osm: osm.generatedAt,
    dddArcgis: arcgis.generatedAt,
  },
  attribution: '© OpenStreetMap contributors (ODbL); DDD public ArcGIS FeatureServer',
  policy: 'Read-only proximity cross-check. Spatial proximity is not proof of stop identity, current service, direction correctness, or official route validation. No stop IDs are merged and no passenger data is changed.',
  summary: {
    routeComparisons: comparisons.length,
    unmatchedCandidateRoutes: unmatchedCandidateRoutes.length,
    osmStopComparisons: comparisons.reduce((sum, item) => sum + item.stopComparisons.length, 0),
    comparisonsWithin50m: comparisons.reduce((sum, item) => sum + item.nearestArcgisStopWithin50m, 0),
    comparisonsWithin100m: comparisons.reduce((sum, item) => sum + item.nearestArcgisStopWithin100m, 0),
  },
  comparisons,
  unmatchedCandidateRoutes,
}
await writeFile(outputPath, JSON.stringify(report, null, 2) + '\n')
console.log(JSON.stringify(report.summary, null, 2))
