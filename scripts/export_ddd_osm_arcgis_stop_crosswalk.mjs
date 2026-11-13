import { readFile, writeFile } from 'node:fs/promises'

const [osmPath, arcgisPath, outputPath = 'ddd-osm-arcgis-stop-crosswalk.csv'] = process.argv.slice(2)
if (!osmPath || !arcgisPath) {
  throw new Error('Usage: node scripts/export_ddd_osm_arcgis_stop_crosswalk.mjs <osm-json> <ddd-arcgis-json> [output-csv]')
}

const [osm, arcgis] = await Promise.all([
  readFile(osmPath, 'utf8').then(JSON.parse),
  readFile(arcgisPath, 'utf8').then(JSON.parse),
])

const stopLayerByLine = {
  '1': 5, '6': 1, '7': 2, '8': 3, '9': 4, '10': 6,
  '121': 7, '13': 8, '18': 9, '23': 10, '4': 11,
}
const stopLayers = new Map(arcgis.layers
  .filter((layer) => layer.kind === 'stops')
  .map((layer) => [layer.layerId, layer]))
const radians = (degrees) => degrees * Math.PI / 180

function distanceMeters(a, b) {
  const radius = 6_371_000
  const dLat = radians(b.lat - a.lat)
  const dLon = radians(b.lon - a.lon)
  const lat1 = radians(a.lat)
  const lat2 = radians(b.lat)
  const h = Math.sin(dLat / 2) ** 2
    + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2
  return 2 * radius * Math.asin(Math.sqrt(h))
}

const columns = [
  'operator', 'line', 'osm_relation_id', 'osm_route_name',
  'osm_sequence', 'osm_member_type', 'osm_member_id', 'osm_member_role',
  'osm_stop_name', 'osm_lat', 'osm_lon', 'arcgis_layer_id',
  'arcgis_layer_name', 'arcgis_nearest_objectid', 'arcgis_nearest_stop_name',
  'arcgis_lat', 'arcgis_lon', 'distance_m', 'proximity_band', 'review_status',
]
const rows = []

for (const route of osm.routes) {
  if (route.scopeStatus !== 'DAKAR_CANDIDATE') continue
  const rawRef = String(route.ref ?? '').trim()
  const line = rawRef.replace(/^L\\s*/i, '').trim()
  const layerId = stopLayerByLine[line]
  if (!layerId) continue
  const layer = stopLayers.get(layerId)
  if (!layer) continue

  const stops = layer.features.flatMap((feature) => {
    const geometry = feature.geometry
    if (!Number.isFinite(geometry?.x) || !Number.isFinite(geometry?.y)) return []
    return [{
      objectId: feature.attributes?.OBJECTID ?? null,
      name: feature.attributes?.Nom_Arret ?? '',
      lat: geometry.y,
      lon: geometry.x,
    }]
  })

  for (const member of route.orderedStopMembers) {
    const point = member.coordinates ?? {}
    let nearest = null
    if (stops.length && Number.isFinite(point.lat) && Number.isFinite(point.lon)) {
      for (const stop of stops) {
        const distance = distanceMeters({ lat: point.lat, lon: point.lon }, stop)
        if (!nearest || distance < nearest.distance) nearest = { ...stop, distance }
      }
    }
    const distance = nearest?.distance
    const band = distance === undefined ? 'NO_COORDINATE'
      : distance <= 25 ? '<=25m'
        : distance <= 50 ? '<=50m'
          : distance <= 100 ? '<=100m' : '>100m'
    rows.push({
      operator: 'DDD',
      line,
      osm_relation_id: route.osmRelationId,
      osm_route_name: route.name ?? '',
      osm_sequence: member.sequence,
      osm_member_type: member.type,
      osm_member_id: member.ref,
      osm_member_role: member.role ?? '',
      osm_stop_name: member.name ?? '',
      osm_lat: point.lat ?? '',
      osm_lon: point.lon ?? '',
      arcgis_layer_id: layerId,
      arcgis_layer_name: layer.layerName,
      arcgis_nearest_objectid: nearest?.objectId ?? '',
      arcgis_nearest_stop_name: nearest?.name ?? '',
      arcgis_lat: nearest?.lat ?? '',
      arcgis_lon: nearest?.lon ?? '',
      distance_m: distance === undefined ? '' : distance.toFixed(1),
      proximity_band: band,
      review_status: 'UNVERIFIED_CANDIDATE',
    })
  }
}

const escapeCsv = (value) => {
  const text = String(value ?? '')
  return /[",\\n\\r]/.test(text) ? '"' + text.replaceAll('"', '""') + '"' : text
}
const csv = [
  columns.join(','),
  ...rows.map((row) => columns.map((column) => escapeCsv(row[column])).join(',')),
].join('\\n') + '\\n'
await writeFile(outputPath, csv, 'utf8')
console.log(JSON.stringify({
  generatedAt: new Date().toISOString(),
  osmSourceGeneratedAt: osm.generatedAt,
  arcgisSourceGeneratedAt: arcgis.generatedAt,
  relationsIncluded: new Set(rows.map((row) => row.osm_relation_id)).size,
  stopRows: rows.length,
  proximityBands: Object.fromEntries(['<=25m', '<=50m', '<=100m', '>100m', 'NO_COORDINATE']
    .map((band) => [band, rows.filter((row) => row.proximity_band === band).length])),
  outputPath,
}, null, 2))
