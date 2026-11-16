#!/usr/bin/env node
/**
 * Recherche des points AFTU/TATA qui correspondent exactement à un nom d'arrêt
 * géolocalisé DDD ArcGIS. Les coordonnées proposées restent à valider.
 */
import fs from 'node:fs/promises';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const GENERIC = new Set(['arret','de','du','des','la','le','les','bus','stop','a','au','aux']);
export function normalizeStopName(value) {
  return String(value ?? '').normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim().split(/\s+/)
    .filter((token) => token && !GENERIC.has(token)).join(' ');
}
function labelOf(point) {
  if (typeof point === 'string') return point;
  if (point && typeof point === 'object') return point.name ?? point.stopName ?? point.label ?? point.waypoint ?? point.address ?? '';
  return '';
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

export function buildAftuTataDddCrosswalk({ aftuRecords, aftuOfficialRecords = [], tataRecords, dddCandidates }) {
  const dddIndex = new Map();
  for (const line of dddCandidates.candidates ?? []) {
    for (const stop of line.stops ?? []) {
      const key = normalizeStopName(stop.sourceStopName);
      if (!key) continue;
      const bucket = dddIndex.get(key) ?? [];
      bucket.push({ line: line.line, stopName: stop.sourceStopName, lat: stop.lat, lon: stop.lon, sourceObjectId: stop.sourceObjectId });
      dddIndex.set(key, bucket);
    }
  }

  const occurrences = new Map();
  const addRecord = (network, code, direction, points, source) => {
    for (let index = 0; index < points.length; index += 1) {
      const label = labelOf(points[index]).trim();
      const key = normalizeStopName(label);
      const id = key || `generic:${label.toLowerCase()}`;
      const bucket = occurrences.get(id) ?? { key, label, generic: !key, occurrences: [] };
      bucket.occurrences.push({ network, line: code, direction, source, order: index });
      occurrences.set(id, bucket);
    }
  };

  for (const { data } of aftuRecords) {
    const code = String(data.code ?? 'unknown');
    for (const [direction, points] of getDirections(data)) addRecord('AFTU', code, direction, points, 'MOOVIT_DIRECTIONAL_STOP_LIST');
  }
  for (const data of aftuOfficialRecords) {
    addRecord('AFTU', String(data.code ?? 'unknown'), 'corridor_published', Array.isArray(data.waypoints) ? data.waypoints : [], 'AFTU_OFFICIAL_CORRIDOR');
  }
  for (const data of tataRecords) {
    const code = String(data.code ?? 'unknown');
    for (const [direction, points] of getDirections(data)) addRecord('TATA', code, direction, points, 'TATA_WAYPOINT_CATALOG');
  }

  const matches = [...occurrences.values()].map((item) => {
    const raw = item.generic ? [] : dddIndex.get(item.key) ?? [];
    const clusters = [];
    for (const candidate of raw) {
      let cluster = clusters.find((entry) => haversine(entry[0], candidate) <= 50);
      if (!cluster) clusters.push([candidate]);
      else cluster.push(candidate);
    }
    const status = item.generic ? 'GENERIC_LABEL_NO_GEOCODE' :
      clusters.length === 1 ? 'EXACT_NAME_SINGLE_LOCATION_CANDIDATE' :
      clusters.length > 1 ? 'AMBIGUOUS_MULTIPLE_LOCATIONS' : 'NO_EXACT_DDD_MATCH';
    const location = clusters.length === 1 ? {
      lat: Number((clusters[0].reduce((sum, x) => sum + x.lat, 0) / clusters[0].length).toFixed(6)),
      lon: Number((clusters[0].reduce((sum, x) => sum + x.lon, 0) / clusters[0].length).toFixed(6)),
      supportingDddStops: clusters[0].length,
      dddLines: [...new Set(clusters[0].map((x) => x.line))],
      sourceObjectIds: [...new Set(clusters[0].map((x) => x.sourceObjectId))],
    } : null;
    return { waypoint: item.label, normalizedName: item.key, status, candidateLocation: location, dddCandidates: raw.length, occurrences: item.occurrences };
  }).sort((a, b) => a.status.localeCompare(b.status) || a.waypoint.localeCompare(b.waypoint, 'fr'));

  const summary = {
    uniqueWaypointNames: matches.length,
    exactNameSingleLocationCandidates: matches.filter((x) => x.status === 'EXACT_NAME_SINGLE_LOCATION_CANDIDATE').length,
    ambiguousMultipleLocations: matches.filter((x) => x.status === 'AMBIGUOUS_MULTIPLE_LOCATIONS').length,
    noExactDddMatch: matches.filter((x) => x.status === 'NO_EXACT_DDD_MATCH').length,
    genericLabels: matches.filter((x) => x.status === 'GENERIC_LABEL_NO_GEOCODE').length,
    officialAftuCorridorLines: aftuOfficialRecords.length,
    detailedAftuSourceFiles: aftuRecords.length,
    tataSourceLines: tataRecords.length,
    totalOccurrences: matches.reduce((sum, x) => sum + x.occurrences.length, 0),
  };
  return {
    generatedAt: new Date().toISOString(),
    purpose: 'Crosswalk research only. Exact name matches are coordinate candidates, not verified AFTU/TATA stop locations.',
    policy: 'Only exact normalized stop-name matches are considered. Multiple distant DDD locations are marked ambiguous; no fuzzy geocoding is performed.',
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
  const dddCandidates = JSON.parse(await fs.readFile(path.join(root, 'artifacts/ddd/arcgis-2024-candidate-sequences/ddd-arcgis-candidate-sequences.json'), 'utf8'));
  const report = buildAftuTataDddCrosswalk({ aftuRecords, aftuOfficialRecords, tataRecords: Array.isArray(tataSource) ? tataSource : tataSource.lines ?? [], dddCandidates });
  const outDir = path.join(root, 'artifacts/aftu-tata');
  await fs.mkdir(outDir, { recursive: true });
  await fs.writeFile(path.join(outDir, 'ddd-stop-name-crosswalk.json'), JSON.stringify(report, null, 2) + '\n');
  await fs.writeFile(path.join(outDir, 'ddd-stop-name-crosswalk-summary.json'), JSON.stringify(report.summary, null, 2) + '\n');
  process.stdout.write(JSON.stringify(report.summary) + '\n');
}

const isDirectRun = process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href;
if (isDirectRun) main().catch((error) => {
  process.stderr.write(String(error?.stack ?? error) + '\n');
  process.exitCode = 1;
});
