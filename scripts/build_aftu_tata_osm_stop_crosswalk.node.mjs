#!/usr/bin/env node
/**
 * Rapproche les noms de waypoints AFTU/TATA avec les arrêts OSM nommés.
 * Les correspondances restent des références cartographiques candidates :
 * elles ne sont jamais injectées dans le réseau passager.
 */
import fs from 'node:fs/promises';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const GENERIC = new Set(['arret','de','du','des','la','le','les','bus','stop','station','gare','terminus','a','au','aux']);
const BOUNDS = { south: 14.50, west: -17.60, north: 14.95, east: -17.05 };

export function normalizeStopName(value) {
  return String(value ?? '').normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim().split(/\s+/)
    .filter((token) => token && !GENERIC.has(token)).join(' ');
}

function haversine(a, b) {
  const rad = (n) => n * Math.PI / 180;
  const dLat = rad(b.lat - a.lat), dLon = rad(b.lon - a.lon);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLon / 2) ** 2;
  return 6371000 * 2 * Math.asin(Math.sqrt(h));
}

function getDirections(data) {
  return [
    ['aller', data.directions?.outbound?.waypoints ?? data.outboundWaypoints ?? data.waypoints ?? []],
    ['retour', data.directions?.inbound?.waypoints ?? data.inboundWaypoints ?? data.returnWaypoints ?? []],
  ];
}

function stopFeatureCoordinates(element) {
  if (element?.type === 'node' && Number.isFinite(element.lat) && Number.isFinite(element.lon)) {
    return { lat: element.lat, lon: element.lon };
  }
  if (element?.type === 'way' && Array.isArray(element.geometry)) {
    const points = element.geometry.filter((point) => Number.isFinite(point.lat) && Number.isFinite(point.lon));
    if (!points.length) return null;
    return {
      lat: points.reduce((sum, point) => sum + point.lat, 0) / points.length,
      lon: points.reduce((sum, point) => sum + point.lon, 0) / points.length,
    };
  }
  return null;
}

function isStopFeature(element) {
  const tags = element?.tags ?? {};
  const hasStopTag = tags.highway === 'bus_stop' ||
    tags.public_transport === 'platform' ||
    tags.public_transport === 'stop_position' ||
    tags.amenity === 'bus_station';
  if (!['node', 'way'].includes(element?.type) || !hasStopTag ||
      typeof tags.name !== 'string' || tags.name.trim() === '') return false;
  const point = stopFeatureCoordinates(element);
  return Boolean(point &&
    point.lat >= BOUNDS.south && point.lat <= BOUNDS.north &&
    point.lon >= BOUNDS.west && point.lon <= BOUNDS.east);
}

function sourceNetwork(tags = {}) {
  const value = [tags.network, tags.operator].filter(Boolean).join(' ').toLowerCase();
  if (/aftu|tata/.test(value)) return 'AFTU_TATA';
  if (/sunu.?brt|dakar mobilit/.test(value)) return 'BRT';
  if (/dakar.?dem.?dik+k?|dem.?dik+k?/.test(value)) return 'DDD';
  return 'UNATTRIBUTED';
}

export function buildAftuTataOsmCrosswalk({ aftuRecords, aftuOfficialRecords = [], tataRecords, osmData }) {
  const osmIndex = new Map();
  // Overpass peut renvoyer plusieurs fois un même nœud ou quai via l'union
  // (relation + objet autonome). Dédupliquer par type et identifiant OSM.
  const stopFeaturesById = new Map();
  for (const feature of (osmData.elements ?? []).filter(isStopFeature)) {
    stopFeaturesById.set(`${feature.type}:${feature.id}`, feature);
  }
  const stopFeatures = [...stopFeaturesById.values()];
  for (const feature of stopFeatures) {
    const point = stopFeatureCoordinates(feature);
    const key = normalizeStopName(feature.tags.name);
    if (!key) continue;
    const bucket = osmIndex.get(key) ?? [];
    bucket.push({
      osmElementId: feature.id,
      osmElementType: feature.type,
      name: feature.tags.name,
      lat: point.lat,
      lon: point.lon,
      network: sourceNetwork(feature.tags),
      operator: feature.tags.operator ?? null,
      sourceNetwork: feature.tags.network ?? null,
      highway: feature.tags.highway ?? null,
      publicTransport: feature.tags.public_transport ?? null,
      routeRef: feature.tags.route_ref ?? feature.tags.ref ?? null,
    });
    osmIndex.set(key, bucket);
  }

  const occurrences = new Map();
  const addRecord = (network, code, direction, points, source) => {
    for (let index = 0; index < points.length; index += 1) {
      const label = String(points[index]?.name ?? points[index]?.stopName ?? points[index]?.label ?? points[index] ?? '').trim();
      const key = normalizeStopName(label);
      const id = key || `generic:${label.toLowerCase()}`;
      const bucket = occurrences.get(id) ?? { key, label, generic: !key, occurrences: [] };
      bucket.occurrences.push({ network, line: code, direction, source, order: index });
      occurrences.set(id, bucket);
    }
  };

  for (const { data } of aftuRecords) {
    const code = String(data.code ?? 'unknown');
    for (const [direction, points] of getDirections(data)) addRecord('AFTU', code, direction, Array.isArray(points) ? points : [], 'MOOVIT_DIRECTIONAL_STOP_LIST');
  }
  for (const data of aftuOfficialRecords) {
    addRecord('AFTU', String(data.code ?? 'unknown'), 'corridor_published', Array.isArray(data.waypoints) ? data.waypoints : [], 'AFTU_OFFICIAL_CORRIDOR');
  }
  for (const data of tataRecords) {
    const code = String(data.code ?? 'unknown');
    for (const [direction, points] of getDirections(data)) addRecord('TATA', code, direction, Array.isArray(points) ? points : [], 'TATA_WAYPOINT_CATALOG');
  }

  const matches = [...occurrences.values()].map((item) => {
    const raw = item.generic ? [] : osmIndex.get(item.key) ?? [];
    const clusters = [];
    for (const candidate of raw) {
      let cluster = clusters.find((entry) => haversine(entry[0], candidate) <= 50);
      if (!cluster) clusters.push([candidate]);
      else cluster.push(candidate);
    }
    const networkFeatures = raw.filter((node) => node.network === 'AFTU_TATA');
    let status = 'NO_EXACT_OSM_MATCH';
    if (item.generic) status = 'GENERIC_LABEL_NO_GEOCODE';
    else if (clusters.length > 1) status = 'AMBIGUOUS_MULTIPLE_LOCATIONS';
    else if (clusters.length === 1 && clusters[0].length > 1) status = 'SINGLE_AREA_MULTIPLE_OSM_FEATURES';
    else if (clusters.length === 1 && networkFeatures.length === 1) status = 'EXACT_AFTU_TATA_OSM_FEATURE_CANDIDATE';
    else if (clusters.length === 1) status = 'CROSS_NETWORK_OSM_REFERENCE_ONLY';

    const candidateLocation = status === 'EXACT_AFTU_TATA_OSM_FEATURE_CANDIDATE'
      ? { lat: networkFeatures[0].lat, lon: networkFeatures[0].lon, osmElementId: networkFeatures[0].osmElementId, osmElementType: networkFeatures[0].osmElementType }
      : null;
    return {
      waypoint: item.label,
      normalizedName: item.key,
      status,
      candidateLocation,
      osmCandidateCount: raw.length,
      locationClusterCount: clusters.length,
      candidateFeatures: raw,
      occurrences: item.occurrences,
    };
  }).sort((a, b) => a.status.localeCompare(b.status) || a.waypoint.localeCompare(b.waypoint, 'fr'));

  const summary = {
    uniqueWaypointNames: matches.length,
    exactAftuTataOsmFeatureCandidates: matches.filter((x) => x.status === 'EXACT_AFTU_TATA_OSM_FEATURE_CANDIDATE').length,
    crossNetworkReferencesOnly: matches.filter((x) => x.status === 'CROSS_NETWORK_OSM_REFERENCE_ONLY').length,
    singleAreaMultipleFeatures: matches.filter((x) => x.status === 'SINGLE_AREA_MULTIPLE_OSM_FEATURES').length,
    ambiguousMultipleLocations: matches.filter((x) => x.status === 'AMBIGUOUS_MULTIPLE_LOCATIONS').length,
    noExactOsmMatch: matches.filter((x) => x.status === 'NO_EXACT_OSM_MATCH').length,
    genericLabels: matches.filter((x) => x.status === 'GENERIC_LABEL_NO_GEOCODE').length,
    namedOsmStopFeaturesInBounds: stopFeatures.length,
    officialAftuCorridorLines: aftuOfficialRecords.length,
    detailedAftuSourceFiles: aftuRecords.length,
    tataSourceLines: tataRecords.length,
    totalOccurrences: matches.reduce((sum, x) => sum + x.occurrences.length, 0),
  };

  return {
    generatedAt: new Date().toISOString(),
    source: {
      attribution: '© OpenStreetMap contributors, ODbL',
      sourceGeneratedAt: osmData.generatedAt ?? null,
      endpoint: osmData.endpoint ?? null,
      geographicBounds: BOUNDS,
    },
    purpose: 'Read-only crosswalk research. OSM name matches are candidate references, not verified AFTU/TATA stops.',
    policy: 'Exact normalized names only. AFTU/TATA coordinates are suggested only for a single OSM node or way explicitly tagged AFTU/TATA. DDD/BRT features remain cross-network references.',
    summary,
    matches,
  };
}

async function main() {
  const root = process.cwd();
  const dataDir = path.join(root, 'src/data');
  const files = (await fs.readdir(dataDir)).filter((file) => /^aftu-\d+-(?:directions|return)\.json$/i.test(file)).sort();
  const aftuRecords = await Promise.all(files.map(async (file) => ({ file, data: JSON.parse(await fs.readFile(path.join(dataDir, file), 'utf8')) })));
  const tataSource = JSON.parse(await fs.readFile(path.join(dataDir, 'tata-lines.json'), 'utf8'));
  const mobilityLines = JSON.parse(await fs.readFile(path.join(dataDir, 'mobility-lines.json'), 'utf8'));
  const aftuOfficialRecords = mobilityLines.filter((line) => line.network === 'aftu');
  const osmData = JSON.parse(await fs.readFile(path.join(root, 'artifacts/osm/dakar-osm-route-candidates.json'), 'utf8'));
  const report = buildAftuTataOsmCrosswalk({
    aftuRecords,
    aftuOfficialRecords,
    tataRecords: Array.isArray(tataSource) ? tataSource : tataSource.lines ?? [],
    osmData,
  });
  const outDir = path.join(root, 'artifacts/aftu-tata');
  await fs.mkdir(outDir, { recursive: true });
  await fs.writeFile(path.join(outDir, 'osm-stop-crosswalk.json'), JSON.stringify(report, null, 2) + '\n');
  await fs.writeFile(path.join(outDir, 'osm-stop-crosswalk-summary.json'), JSON.stringify(report.summary, null, 2) + '\n');
  process.stdout.write(JSON.stringify(report.summary) + '\n');
}

const isDirectRun = process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href;
if (isDirectRun) main().catch((error) => {
  process.stderr.write(String(error?.stack ?? error) + '\n');
  process.exitCode = 1;
});
