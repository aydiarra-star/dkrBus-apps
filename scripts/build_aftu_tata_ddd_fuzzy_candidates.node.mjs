#!/usr/bin/env node
/**
 * Produit des suggestions de rapprochement de noms AFTU/TATA vers les arrêts
 * candidats DDD ArcGIS. Aucune suggestion floue n'est une coordonnée validée.
 */
import fs from 'node:fs/promises';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const GENERIC = new Set(['arret','de','du','des','la','le','les','bus','stop','station','gare','terminus','a','au','aux']);
export const DEFAULT_MIN_SIMILARITY = 0.92;

export function normalizeStopName(value) {
  return String(value ?? '').normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim().split(/\s+/)
    .filter((token) => token && !GENERIC.has(token)).join(' ');
}

export function levenshteinRatio(left, right) {
  if (left === right) return 1;
  const maxLength = Math.max(left.length, right.length);
  if (!maxLength) return 1;
  if (Math.abs(left.length - right.length) / maxLength > 1 - DEFAULT_MIN_SIMILARITY) return 0;
  let previous = Array.from({ length: right.length + 1 }, (_, index) => index);
  for (let i = 1; i <= left.length; i += 1) {
    const current = [i];
    for (let j = 1; j <= right.length; j += 1) {
      current[j] = Math.min(
        current[j - 1] + 1,
        previous[j] + 1,
        previous[j - 1] + (left[i - 1] === right[j - 1] ? 0 : 1),
      );
    }
    previous = current;
  }
  return 1 - previous[right.length] / maxLength;
}

function getDirections(data) {
  return [
    ['aller', data.directions?.outbound?.waypoints ?? data.outboundWaypoints ?? data.waypoints ?? []],
    ['retour', data.directions?.inbound?.waypoints ?? data.inboundWaypoints ?? data.returnWaypoints ?? []],
  ];
}

export function buildAftuTataDddFuzzyCandidates({
  aftuRecords,
  aftuOfficialRecords = [],
  tataRecords,
  dddCandidates,
  minSimilarity = DEFAULT_MIN_SIMILARITY,
}) {
  const occurrences = new Map();
  const addRecord = (network, code, direction, points, source) => {
    for (let index = 0; index < points.length; index += 1) {
      const raw = points[index];
      const label = String(raw?.name ?? raw?.stopName ?? raw?.label ?? raw ?? '').trim();
      const key = normalizeStopName(label);
      const id = key || `generic:${label.toLowerCase()}`;
      const bucket = occurrences.get(id) ?? { key, label, generic: !key, occurrences: [] };
      bucket.occurrences.push({ network, line: code, direction, source, order: index });
      occurrences.set(id, bucket);
    }
  };

  for (const { data } of aftuRecords) {
    const code = String(data.code ?? 'unknown');
    for (const [direction, points] of getDirections(data)) {
      addRecord('AFTU', code, direction, Array.isArray(points) ? points : [], 'MOOVIT_DIRECTIONAL_STOP_LIST');
    }
  }
  for (const data of aftuOfficialRecords) {
    addRecord('AFTU', String(data.code ?? 'unknown'), 'corridor_published', Array.isArray(data.waypoints) ? data.waypoints : [], 'AFTU_OFFICIAL_CORRIDOR');
  }
  for (const data of tataRecords) {
    const code = String(data.code ?? 'unknown');
    for (const [direction, points] of getDirections(data)) {
      addRecord('TATA', code, direction, Array.isArray(points) ? points : [], 'TATA_WAYPOINT_CATALOG');
    }
  }

  const dddByName = new Map();
  for (const line of dddCandidates.candidates ?? []) {
    for (const stop of line.stops ?? []) {
      const key = normalizeStopName(stop.sourceStopName ?? stop.name);
      if (!key) continue;
      const bucket = dddByName.get(key) ?? { normalizedName: key, sourceNames: new Set(), stops: [] };
      bucket.sourceNames.add(stop.sourceStopName ?? stop.name);
      bucket.stops.push({
        sourceStopName: stop.sourceStopName ?? stop.name,
        lat: stop.lat,
        lon: stop.lon,
        dddLine: line.line,
        sourceObjectId: stop.sourceObjectId,
      });
      dddByName.set(key, bucket);
    }
  }

  const dddNames = [...dddByName.keys()];
  const matches = [];
  for (const item of occurrences.values()) {
    if (item.generic || item.key.length < 4 || dddByName.has(item.key)) continue;
    const suggestions = [];
    for (const candidateName of dddNames) {
      const score = levenshteinRatio(item.key, candidateName);
      if (score < minSimilarity) continue;
      const group = dddByName.get(candidateName);
      const stops = group.stops;
      suggestions.push({
        normalizedCandidateName: candidateName,
        candidateNames: [...group.sourceNames],
        similarityPercent: Math.round(score * 10000) / 100,
        dddLines: [...new Set(stops.map((stop) => stop.dddLine))],
        sourceObjectIds: [...new Set(stops.map((stop) => stop.sourceObjectId))],
        candidateStops: stops,
      });
    }
    suggestions.sort((a, b) => b.similarityPercent - a.similarityPercent || a.normalizedCandidateName.localeCompare(b.normalizedCandidateName));
    if (!suggestions.length) continue;
    const ambiguousTop = suggestions.length > 1 && suggestions[0].similarityPercent - suggestions[1].similarityPercent <= 2;
    matches.push({
      waypoint: item.label,
      normalizedName: item.key,
      status: ambiguousTop ? 'AMBIGUOUS_FUZZY_REVIEW_ONLY' : 'FUZZY_REVIEW_ONLY',
      candidateLocation: null,
      suggestions: suggestions.slice(0, 3),
      occurrences: item.occurrences,
      warning: 'Similarity of names only. Do not use these coordinates in passenger routing without manual validation.',
    });
  }

  matches.sort((a, b) => b.suggestions[0].similarityPercent - a.suggestions[0].similarityPercent || a.waypoint.localeCompare(b.waypoint, 'fr'));
  return {
    generatedAt: new Date().toISOString(),
    source: 'AFTU official route corridors + Moovit stop lists + TATA waypoint catalogue cross-checked against DDD ArcGIS candidate stop names.',
    purpose: 'Human-review suggestions only. No fuzzy match is automatically accepted as a stop or coordinate.',
    policy: { minSimilarityPercent: minSimilarity * 100, maxSuggestionsPerWaypoint: 3, candidateLocationAlwaysNull: true },
    summary: {
      uniqueWaypointNames: occurrences.size,
      fuzzyWaypointNamesForReview: matches.length,
      suggestionPairs: matches.reduce((sum, item) => sum + item.suggestions.length, 0),
      ambiguousTopMatches: matches.filter((item) => item.status === 'AMBIGUOUS_FUZZY_REVIEW_ONLY').length,
      officialAftuCorridorLines: aftuOfficialRecords.length,
      detailedAftuSourceFiles: aftuRecords.length,
      tataSourceLines: tataRecords.length,
      genericLabels: [...occurrences.values()].filter((item) => item.generic).length,
      totalOccurrences: [...occurrences.values()].reduce((sum, item) => sum + item.occurrences.length, 0),
    },
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
  const report = buildAftuTataDddFuzzyCandidates({
    aftuRecords,
    aftuOfficialRecords,
    tataRecords: Array.isArray(tataSource) ? tataSource : tataSource.lines ?? [],
    dddCandidates,
  });
  const outDir = path.join(root, 'artifacts/aftu-tata');
  await fs.mkdir(outDir, { recursive: true });
  await fs.writeFile(path.join(outDir, 'ddd-fuzzy-review-candidates.json'), JSON.stringify(report, null, 2) + '\n');
  await fs.writeFile(path.join(outDir, 'ddd-fuzzy-review-summary.json'), JSON.stringify(report.summary, null, 2) + '\n');
  process.stdout.write(JSON.stringify(report.summary) + '\n');
}

const isDirectRun = process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href;
if (isDirectRun) main().catch((error) => {
  process.stderr.write(String(error?.stack ?? error) + '\n');
  process.exitCode = 1;
});
