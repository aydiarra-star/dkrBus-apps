import { mkdir, writeFile } from 'node:fs/promises'
import { join } from 'node:path'

const service = 'https://services1.arcgis.com/tKMirJrirprCZbnf/ArcGIS/rest/services/Ligne_inter_urbain/FeatureServer'
const layers = [
  { id: 0, kind: 'stops', line: '13' },
  { id: 1, kind: 'stops', line: '6' },
  { id: 2, kind: 'stops', line: '7' },
  { id: 3, kind: 'stops', line: '8' },
  { id: 4, kind: 'stops', line: '9' },
  { id: 5, kind: 'stops', line: '1' },
  { id: 6, kind: 'stops', line: '10' },
  { id: 7, kind: 'stops', line: '121' },
  { id: 8, kind: 'stops', line: '13' },
  { id: 9, kind: 'stops', line: '18' },
  { id: 10, kind: 'stops', line: '23' },
  { id: 11, kind: 'stops', line: '4' },
  { id: 12, kind: 'route', line: '121' },
  { id: 13, kind: 'route', line: '13' },
  { id: 14, kind: 'route', line: '18' },
  { id: 15, kind: 'route', line: '20' },
  { id: 16, kind: 'route', line: '23' },
  { id: 17, kind: 'route', line: '4' },
  { id: 18, kind: 'route', line: '6' },
  { id: 19, kind: 'route', line: '7' },
  { id: 20, kind: 'route', line: '8' },
  { id: 21, kind: 'route', line: '9' },
  { id: 22, kind: 'route', line: '10' },
  { id: 23, kind: 'route', line: '1' },
]

async function arcgis(path, params = {}) {
  const url = new URL(`${service}/${path}`)
  for (const [key, value] of Object.entries({ f: 'json', ...params })) {
    url.searchParams.set(key, String(value))
  }
  const response = await fetch(url, { headers: { accept: 'application/json' } })
  if (!response.ok) throw new Error(`ArcGIS HTTP ${response.status}: ${url}`)
  const payload = await response.json()
  if (payload.error) throw new Error(`ArcGIS ${payload.error.code}: ${payload.error.message}`)
  return payload
}

await mkdir('artifacts/ddd-historical-arcgis', { recursive: true })
const summary = []
for (const layer of layers) {
  const metadata = await arcgis(String(layer.id))
  const idsResult = await arcgis(`${layer.id}/query`, {
    where: '1=1', returnIdsOnly: true, returnGeometry: false,
  })
  const ids = idsResult.objectIds ?? []
  const max = Math.max(1, Math.min(metadata.maxRecordCount ?? 500, 500))
  const features = []
  for (let offset = 0; offset < ids.length; offset += max) {
    const batch = ids.slice(offset, offset + max)
    const result = await arcgis(`${layer.id}/query`, {
      objectIds: batch.join(','), outFields: '*', returnGeometry: true,
      outSR: 32628,
    })
    features.push(...(result.features ?? []))
  }
  const snapshot = {
    retrievedAt: new Date().toISOString(),
    serviceUrl: service,
    layer,
    metadata,
    objectIds: ids,
    featureCount: features.length,
    features,
  }
  const file = join('artifacts/ddd-historical-arcgis', `layer-${layer.id}-${layer.kind}-line-${layer.line}.json`)
  await writeFile(file, JSON.stringify(snapshot, null, 2) + '\n')
  summary.push({ ...layer, featureCount: features.length, expectedIds: ids.length, fields: metadata.fields?.map(f => f.name) ?? [] })
  console.log(`Layer ${layer.id}: ${features.length} features (${layer.kind}, line ${layer.line})`)
}
await writeFile('artifacts/ddd-historical-arcgis/summary.json', JSON.stringify({
  retrievedAt: new Date().toISOString(), serviceUrl: service, layers: summary,
}, null, 2) + '\n')
console.log(`Extracted ${summary.reduce((n, x) => n + x.featureCount, 0)} features across ${summary.length} layers.`)
