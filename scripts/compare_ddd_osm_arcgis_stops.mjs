import { readFile, writeFile } from 'node:fs/promises'

const [osmPath, arcgisPath, outputPath = 'ddd-osm-arcgis-crosscheck.json'] = process.argv.slice(2)
if (!osmPath || !arcgisPath) {
  throw new Error('Usage: node scripts/compare_ddd_osm_arcgis_stops.mjs <osm-json> <ddd-arcgis-json> [output-json]')
}

const [osm, arcgis] = await Promise.all([
  readFile(osmPath, 'utf8').then(JSON.parse),
  readFile(arcgisPath, 'utf8').then(JSON.parse),
])

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

function parseRouteRefs(route) {
  const rawValues = [route.ref, route.tags?.ref].filter(Boolean)
  const refs = []
  for (const rawValue of rawValues) {
    for (const token of String(rawValue).split(/[;,]/)) {
      const compact = token.trim().toUpperCase().replace(/\s+/g, '').replace(/^L/, '')
      if (/^[A-Z]?\d{1,3}[A-Z]?$/.test(compact) && !refs.includes(compact)) refs.push(compact)
    }
  }
  return refs
}

function orderedOneToOneMatches(osmMembers, arcgisStops, thresholdMeters, reverseArcgis = false) {
  const orderedStops = reverseArcgis ? [...arcgisStops].reverse() : arcgisStops
  const rows = Array.from({ length: osmMembers.length + 1 }, () => new Uint16Array(orderedStops.length + 1))
  for (let i = 1; i <= osmMembers.length; i++) {
    const point = osmMembers[i - 1].coordinates
    for (let j = 1; j <= orderedStops.length; j++) {
      const stop = orderedStops[j - 1]
      const distance = point && stop
        ? distanceMeters({ lat: point.lat, lon: point.lon }, stop)
        : Number.POSITIVE_INFINITY
      const match = distance <= thresholdMeters ? rows[i - 1][j - 1] + 1 : 0
      rows[i][j] = Math.max(rows[i - 1][j], rows[i][j - 1], match)
    }
  }
  return rows[osmMembers.length][orderedStops.length]
}

const comparisons = []
const unmatchedCandidateRoutes = []
for (const route of osm.routes) {
  if (route.scopeStatus !== 'DAKAR_CANDIDATE') continue
  const rawRef = String(route.ref ?? route.tags?.ref ?? '').trim()
  const refs = parseRouteRefs(route)
  const matchedRefs = refs.filter((line) => stopLayerByLine[line])
  const missingLayerRefs = refs.filter((line) => !stopLayerByLine[line])

  if (!matchedRefs.length) {
    unmatchedCandidateRoutes.push({
      osmRelationId: route.osmRelationId,
      ref: rawRef || null,
      parsedRefs: refs,
      name: route.name,
      stopMemberCount: route.orderedStopMembers.length,
      reason: refs.length > 1
        ? 'MULTIPLE_LINE_REFERENCES_WITHOUT_MATCHING_STOP_LAYER'
        : 'NO_MATCHING_DDD_URBAN_STOP_LAYER',
    })
    continue
  }

  // A multi-ref relation is compared against each available layer but remains
  // explicitly ambiguous; it is never silently assigned to one line.
  for (const line of matchedRefs) {
    const layerId = stopLayerByLine[line]
    const layer = stopLayers.get(layerId)
    if (!layer) continue
    const arcgisStops = layer.features.flatMap((feature) => {
      const geometry = feature.geometry
      if (!Number.isFinite(geometry?.x) || !Number.isFinite(geometry?.y)) return []
      return [{
        objectId: feature.attributes?.OBJECTID ?? null,
        name: feature.attributes?.Nom_Arret ?? null,
        lat: geometry.y,
        lon: geometry.x,
      }]
    })

    const stopComparisons = route.orderedStopMembers.flatMap((member, index) => {
      const point = member.coordinates
      if (!Number.isFinite(point?.lat) || !Number.isFinite(point?.lon) || !arcgisStops.length) return []
      let nearest = null
      for (const stop of arcgisStops) {
        const distance = distanceMeters({ lat: point.lat, lon: point.lon }, stop)
        if (!nearest || distance < nearest.distanceMeters) {
          nearest = {
            objectId: stop.objectId,
            name: stop.name,
            distanceMeters: distance,
          }
        }
      }
      return [{
        osmSequence: member.sequence ?? index + 1,
        osmType: member.type,
        osmRef: member.ref,
        osmRole: member.role ?? null,
        osmName: member.name ?? null,
        nearestArcgisObjectId: nearest.objectId,
        nearestArcgisStopName: nearest.name,
        nearestDistanceMeters: Number(nearest.distanceMeters.toFixed(1)),
      }]
    })

    const distances = stopComparisons.map((item) => item.nearestDistanceMeters)
    const nearestObjectIds = stopComparisons
      .map((item) => item.nearestArcgisObjectId)
      .filter((value) => Number.isFinite(value))
    const countWithin = (threshold) => distances.filter((distance) => distance <= threshold).length
    const sortedDistances = [...distances].sort((a, b) => a - b)
    const medianDistanceMeters = sortedDistances.length
      ? Number(sortedDistances[Math.floor(sortedDistances.length / 2)].toFixed(1))
      : null
    const meanDistanceMeters = distances.length
      ? Number((distances.reduce((sum, distance) => sum + distance, 0) / distances.length).toFixed(1))
      : null
    const nondecreasingObjectIdTransitions = nearestObjectIds.slice(1)
      .filter((id, index) => id >= nearestObjectIds[index]).length
    const strictlyIncreasingObjectIdTransitions = nearestObjectIds.slice(1)
      .filter((id, index) => id > nearestObjectIds[index]).length

    comparisons.push({
      network: 'DDD',
      line,
      rawRef: rawRef || null,
      parsedRefs: refs,
      referenceAmbiguous: refs.length > 1,
      missingLayerRefs,
      osmRelationId: route.osmRelationId,
      osmName: route.name,
      from: route.from,
      to: route.to,
      scopeStatus: route.scopeStatus,
      osmOrderedStopCount: route.orderedStopMembers.length,
      arcgisLayerId: layerId,
      arcgisLayerName: layer.layerName,
      arcgisStopCount: arcgisStops.length,
      method: 'Nearest-neighbour proximity plus ordered one-to-one diagnostic. ArcGIS OBJECTID progression is measured separately and is not assumed to be an official operational sequence.',
      nearestArcgisStopWithin15m: countWithin(15),
      nearestArcgisStopWithin25m: countWithin(25),
      nearestArcgisStopWithin50m: countWithin(50),
      nearestArcgisStopWithin100m: countWithin(100),
      nearestArcgisStopWithin200m: countWithin(200),
      medianNearestDistanceMeters: medianDistanceMeters,
      meanNearestDistanceMeters: meanDistanceMeters,
      nondecreasingNearestObjectIdTransitions: nondecreasingObjectIdTransitions,
      strictlyIncreasingNearestObjectIdTransitions: strictlyIncreasingObjectIdTransitions,
      nearestObjectIdTransitions: Math.max(0, nearestObjectIds.length - 1),
      orderedOneToOneWithin50mForward: orderedOneToOneMatches(route.orderedStopMembers, arcgisStops, 50, false),
      orderedOneToOneWithin50mReverse: orderedOneToOneMatches(route.orderedStopMembers, arcgisStops, 50, true),
      orderedOneToOneWithin100mForward: orderedOneToOneMatches(route.orderedStopMembers, arcgisStops, 100, false),
      orderedOneToOneWithin100mReverse: orderedOneToOneMatches(route.orderedStopMembers, arcgisStops, 100, true),
      stopComparisons,
    })
  }
}

const report = {
  generatedAt: new Date().toISOString(),
  sources: {
    osm: osm.generatedAt,
    dddArcgis: arcgis.generatedAt,
  },
  attribution: '© OpenStreetMap contributors (ODbL); DDD public ArcGIS FeatureServer',
  policy: 'Read-only proximity and ordered one-to-one diagnostic. Multi-reference OSM relations are compared against all available candidate layers but remain explicitly ambiguous. ArcGIS response order and OBJECTID are not certified as operational stop order; spatial proximity is not proof of stop identity, current service, direction correctness, or official route validation. No stop IDs are merged and no passenger data is changed.',
  summary: {
    routeLayerComparisons: comparisons.length,
    ambiguousReferenceComparisons: comparisons.filter((item) => item.referenceAmbiguous).length,
    unmatchedCandidateRoutes: unmatchedCandidateRoutes.length,
    osmStopComparisons: comparisons.reduce((sum, item) => sum + item.stopComparisons.length, 0),
    comparisonsWithin15m: comparisons.reduce((sum, item) => sum + item.nearestArcgisStopWithin15m, 0),
    comparisonsWithin50m: comparisons.reduce((sum, item) => sum + item.nearestArcgisStopWithin50m, 0),
    comparisonsWithin100m: comparisons.reduce((sum, item) => sum + item.nearestArcgisStopWithin100m, 0),
  },
  comparisons,
  unmatchedCandidateRoutes,
}
await writeFile(outputPath, JSON.stringify(report, null, 2) + '\n')
console.log(JSON.stringify(report.summary, null, 2))
