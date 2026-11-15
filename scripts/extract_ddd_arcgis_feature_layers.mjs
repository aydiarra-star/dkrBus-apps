#!/usr/bin/env node
import { mkdir, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';

const BASE = 'https://services1.arcgis.com/tKMirJrirprCZbnf/ArcGIS/rest/services/Dem_dikk_mise_a_jour/FeatureServer';
const OUTPUT = 'artifacts/ddd/arcgis-2024-extract';
const BATCH_SIZE = 200;
const LAYERS = [
  { id: 0, key: 'stops', expectedCount: 777 },
  { id: 1, key: 'routes', expectedCount: 25 },
];

async function getJson(url, params = undefined) {
  const requestUrl = params ? `${url}?${params.toString()}` : url;
  const response = await fetch(requestUrl, {
    headers: { 'User-Agent': 'DakarBus-read-only-ArcGIS-audit/1.0' },
    signal: AbortSignal.timeout(45000),
  });
  if (!response.ok) throw new Error(`ArcGIS HTTP ${response.status}: ${requestUrl}`);
  const body = await response.json();
  if (body.error) throw new Error(`ArcGIS error ${body.error.code}: ${body.error.message}`);
  return body;
}

async function fetchLayerMetadata(id) {
  return getJson(`${BASE}/${id}`, new URLSearchParams({ f: 'pjson' }));
}

async function fetchAllFeatures(layer) {
  const endpoint = `${BASE}/${layer.id}/query`;
  const idResult = await getJson(endpoint, new URLSearchParams({
    where: '1=1',
    returnIdsOnly: 'true',
    returnGeometry: 'false',
    f: 'json',
  }));
  const objectIdField = idResult.objectIdFieldName;
  const ids = [...(idResult.objectIds ?? [])].sort((a, b) => a - b);
  if (!objectIdField || !ids.length) throw new Error(`Layer ${layer.id}: no object IDs returned`);

  const features = [];
  for (let offset = 0; offset < ids.length; offset += BATCH_SIZE) {
    const batch = ids.slice(offset, offset + BATCH_SIZE);
    const result = await getJson(endpoint, new URLSearchParams({
      objectIds: batch.join(','),
      outFields: '*',
      returnGeometry: 'true',
      outSR: '4326',
      returnZ: 'false',
      returnM: 'true',
      f: 'json',
    }));
    if (result.exceededTransferLimit) {
      throw new Error(`Layer ${layer.id}: ArcGIS truncated object-ID batch at offset ${offset}`);
    }
    features.push(...(result.features ?? []));
  }
  const received = new Set(features.map((feature) => feature.attributes?.[objectIdField]));
  const missing = ids.filter((id) => !received.has(id));
  if (missing.length) throw new Error(`Layer ${layer.id}: missing ${missing.length} feature(s), first IDs: ${missing.slice(0, 10).join(',')}`);
  return { objectIdField, ids, features };
}

function toGeoJson(layer, objectIdField, features) {
  const output = [];
  let missingGeometry = 0;
  let unsupportedGeometry = 0;
  for (const feature of features) {
    const geometry = feature.geometry;
    let geoGeometry = null;
    if (!geometry) {
      missingGeometry += 1;
    } else if (layer.key === 'stops' && Number.isFinite(geometry.x) && Number.isFinite(geometry.y)) {
      geoGeometry = { type: 'Point', coordinates: [geometry.x, geometry.y] };
    } else if (layer.key === 'routes' && Array.isArray(geometry.paths)) {
      const paths = geometry.paths
        .filter((path) => Array.isArray(path) && path.length >= 2)
        .map((path) => path.map((coordinate) => [coordinate[0], coordinate[1]]));
      if (paths.length === 1) geoGeometry = { type: 'LineString', coordinates: paths[0] };
      else if (paths.length > 1) geoGeometry = { type: 'MultiLineString', coordinates: paths };
      else unsupportedGeometry += 1;
    } else {
      unsupportedGeometry += 1;
    }
    output.push({
      type: 'Feature',
      id: feature.attributes?.[objectIdField],
      geometry: geoGeometry,
      properties: feature.attributes ?? {},
    });
  }
  return {
    collection: { type: 'FeatureCollection', features: output },
    missingGeometry,
    unsupportedGeometry,
    geometryCount: output.filter((feature) => feature.geometry !== null).length,
  };
}

async function main() {
  await mkdir(OUTPUT, { recursive: true });
  const summary = {
    generatedAt: new Date().toISOString(),
    service: BASE,
    extractionPolicy: 'Read-only extraction. Original ArcGIS attributes and object IDs are retained. Coordinates are requested in EPSG:4326. No route direction, current validity, stop identity, stop order, schedule or frequency is inferred.',
    layers: {},
    warnings: [
      'The unified route layer data geometry last-edit date is 2019-01-11, despite a 2024 layer/schema edit date.',
      'The stop layer data last-edit date is 2024-09-24; this does not certify that the linked route geometry is current.',
      'All extracted features remain source evidence only and are not passenger-app data.',
    ],
  };

  for (const layer of LAYERS) {
    const [metadata, extracted] = await Promise.all([
      fetchLayerMetadata(layer.id),
      fetchAllFeatures(layer),
    ]);
    const geo = toGeoJson(layer, extracted.objectIdField, extracted.features);
    if (geo.unsupportedGeometry) throw new Error(`Layer ${layer.id}: ${geo.unsupportedGeometry} unsupported geometries`);
    const raw = {
      layerId: layer.id,
      objectIdField: extracted.objectIdField,
      spatialReferenceRequested: 4326,
      objectIds: extracted.ids,
      features: extracted.features,
    };
    const rawText = JSON.stringify(raw, null, 2) + '\n';
    const geoText = JSON.stringify(geo.collection, null, 2) + '\n';
    await writeFile(`${OUTPUT}/${layer.key}.raw.json`, rawText);
    await writeFile(`${OUTPUT}/${layer.key}.geojson`, geoText);
    summary.layers[layer.key] = {
      layerId: layer.id,
      layerName: metadata.name,
      geometryType: metadata.geometryType,
      objectIdField: extracted.objectIdField,
      sourceFeatureCount: extracted.ids.length,
      extractedFeatureCount: extracted.features.length,
      geometryCount: geo.geometryCount,
      missingGeometry: geo.missingGeometry,
      expectedInventoryCount: layer.expectedCount,
      inventoryCountMatches: extracted.features.length === layer.expectedCount,
      dataLastEditDate: metadata.editingInfo?.dataLastEditDate ?? null,
      schemaLastEditDate: metadata.editingInfo?.schemaLastEditDate ?? null,
      fields: (metadata.fields ?? []).map((field) => ({
        name: field.name,
        alias: field.alias,
        type: field.type,
      })),
      rawSha256: createHash('sha256').update(rawText).digest('hex'),
      geojsonSha256: createHash('sha256').update(geoText).digest('hex'),
    };
  }

  await writeFile(`${OUTPUT}/metadata.json`, JSON.stringify(summary, null, 2) + '\n');
  console.log(JSON.stringify({
    generatedAt: summary.generatedAt,
    output: OUTPUT,
    layers: Object.fromEntries(Object.entries(summary.layers).map(([key, value]) => [key, {
      count: value.extractedFeatureCount,
      geometryCount: value.geometryCount,
      missingGeometry: value.missingGeometry,
      dataLastEditDate: value.dataLastEditDate,
    }])),
  }, null, 2));
}

await main();
