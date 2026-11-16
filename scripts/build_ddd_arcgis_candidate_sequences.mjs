#!/usr/bin/env node
/**
 * Produit un jeu de séquences DDD candidates à partir des seules preuves
 * ArcGIS 2024 : arrêts projetés à proximité de la géométrie de ligne.
 *
 * IMPORTANT : ce fichier est un artefact d'audit, pas un réseau passager.
 * Le chaînage géométrique ne prouve ni le sens commercial, ni le service
 * actuel, ni l'ordre officiel des arrêts. Les groupes ambigus sont exclus.
 */
import fs from 'node:fs/promises';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

export function parseCsv(source) {
  const rows = [];
  let row = [];
  let field = '';
  let quoted = false;
  for (let i = 0; i < source.length; i += 1) {
    const char = source[i];
    if (quoted) {
      if (char === '"' && source[i + 1] === '"') {
        field += '"';
        i += 1;
      } else if (char === '"') {
        quoted = false;
      } else {
        field += char;
      }
    } else if (char === '"') {
      quoted = true;
    } else if (char === ',') {
      row.push(field);
      field = '';
    } else if (char === '\n') {
      row.push(field.replace(/\r$/, ''));
      if (row.some((value) => value !== '')) rows.push(row);
      row = [];
      field = '';
    } else {
      field += char;
    }
  }
  if (field !== '' || row.length > 0) {
    row.push(field.replace(/\r$/, ''));
    if (row.some((value) => value !== '')) rows.push(row);
  }
  if (rows.length < 2) return [];
  const headers = rows[0];
  return rows.slice(1).map((values) => Object.fromEntries(headers.map((key, index) => [key, values[index] ?? ''])));
}

const finite = (value) => Number.isFinite(Number(value));
// ArcGIS IDs may be serialized as `18.0` in CSV and `18` in GeoJSON.
const routeIdKey = (value) => {
  const raw = String(value ?? '').trim();
  if (!raw) return '';
  const numeric = Number(raw);
  return Number.isInteger(numeric) ? String(numeric) : raw;
};
const normalize = (value) => String(value ?? '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
const slug = (value) => normalize(value).replace(/\s+/g, '-');

export function buildCandidateSequences({ rows, routes, metadata }) {
  const routeFeatures = routes.features ?? [];
  const routeById = new Map(routeFeatures.map((feature) => [routeIdKey(feature.properties?.OBJECTID_12 ?? feature.id), feature]));
  const grouped = new Map();
  for (const row of rows) {
    const key = row.stop_group_source || '';
    if (!grouped.has(key)) grouped.set(key, []);
    grouped.get(key).push(row);
  }

  const eligible = [];
  const excluded = [];
  for (const [sourceGroup, groupRows] of grouped) {
    const routeIds = [...new Set(groupRows.map((row) => routeIdKey(row.route_objectid_12)).filter(Boolean))];
    const routeNames = [...new Set(groupRows.map((row) => row.route_name_source).filter(Boolean))];
    const normalizedLines = [...new Set(groupRows.map((row) => row.normalized_line).filter(Boolean))];
    const allClose = groupRows.every((row) =>
      row.review_status === 'GEOMETRY_PROXIMITY_CANDIDATE' &&
      row.proximity_band === '<=25m' &&
      Number(row.identical_record_signature_count) === 1 &&
      finite(row.longitude) && finite(row.latitude) && finite(row.chainage_m) &&
      finite(row.nearest_distance_m) && Number(row.nearest_distance_m) <= 25,
    );
    if (!sourceGroup || !allClose || routeIds.length !== 1 || routeNames.length !== 1 || normalizedLines.length !== 1) {
      excluded.push({ sourceGroup, stopCount: groupRows.length, reason: !sourceGroup ? 'BLANK_SOURCE_GROUP' : !allClose ? 'STOP_GEOMETRY_REVIEW_REQUIRED' : 'AMBIGUOUS_ROUTE_ASSOCIATION' });
      continue;
    }
    const route = routeById.get(routeIds[0]);
    if (!route || route.geometry?.type !== 'LineString' || route.geometry.coordinates?.length < 2) {
      excluded.push({ sourceGroup, stopCount: groupRows.length, reason: 'ROUTE_GEOMETRY_MISSING_OR_UNSUPPORTED' });
      continue;
    }
    const routeName = String(route.properties?.Nom_Ligne ?? '').trim();
    if (normalize(routeName) !== normalize(routeNames[0]) || normalize(routeName) !== normalize(normalizedLines[0])) {
      excluded.push({ sourceGroup, stopCount: groupRows.length, reason: 'ROUTE_NAME_CROSSWALK_MISMATCH' });
      continue;
    }
    eligible.push({ sourceGroup, groupRows, route, routeId: routeIds[0], routeName, normalizedLine: normalizedLines[0] });
  }

  // Deux groupes source qui pointent vers la même géométrie (cas de la ligne
  // 13) restent tous deux exclus : on ne choisit pas arbitrairement une variante.
  const groupsByRoute = new Map();
  for (const item of eligible) {
    const bucket = groupsByRoute.get(item.routeId) ?? [];
    bucket.push(item);
    groupsByRoute.set(item.routeId, bucket);
  }
  const candidates = [];
  for (const [routeId, items] of groupsByRoute) {
    if (items.length !== 1) {
      for (const item of items) excluded.push({ sourceGroup: item.sourceGroup, stopCount: item.groupRows.length, reason: 'MULTIPLE_SOURCE_GROUPS_SHARE_ROUTE_GEOMETRY' });
      continue;
    }
    const item = items[0];
    const orderedRows = [...item.groupRows].sort((a, b) => Number(a.chainage_m) - Number(b.chainage_m));
    const distances = orderedRows.map((row) => Number(row.nearest_distance_m));
    candidates.push({
      id: `ddd-arcgis-${slug(item.normalizedLine)}`,
      network: 'ddd',
      line: item.normalizedLine,
      sourceGroup: item.sourceGroup,
      routeObjectId: Number(routeId),
      routeNameSource: item.routeName,
      stopCount: orderedRows.length,
      routeGeometryKm: Number(orderedRows[0].route_geometry_km),
      maxStopDistanceM: Math.max(...distances),
      sequenceMethod: 'ARC_GIS_POLYLINE_CHAINAGE_ASCENDING',
      directionStatus: 'UNVERIFIED',
      serviceStatus: 'HISTORICAL_CANDIDATE',
      routeGeometry: item.route.geometry,
      stops: orderedRows.map((row, index) => ({
        id: `ddd-arcgis-${slug(item.normalizedLine)}-${row.stop_objectid_12}`,
        sourceObjectId: Number(row.stop_objectid_12),
        sourceStopName: row.stop_name_source,
        lat: Number(row.latitude),
        lon: Number(row.longitude),
        orderByGeometry: index,
        chainageM: Number(row.chainage_m),
        distanceToRouteM: Number(row.nearest_distance_m),
      })),
    });
  }

  candidates.sort((a, b) => a.line.localeCompare(b.line, 'fr', { numeric: true }));
  excluded.sort((a, b) => String(a.sourceGroup).localeCompare(String(b.sourceGroup), 'fr'));
  return {
    generatedAt: new Date().toISOString(),
    source: metadata.service,
    sourceDates: {
      stopsLastEdited: new Date(metadata.layers.stops.dataLastEditDate).toISOString(),
      routeGeometryLastEdited: new Date(metadata.layers.routes.dataLastEditDate).toISOString(),
    },
    policy: {
      purpose: 'Research artifact only; not loaded into the passenger route planner or operational map.',
      inclusion: 'All stops in a source group must be geolocated, unique, and within 25 m of exactly one named ArcGIS route geometry.',
      ordering: 'Stops are sorted by geometric chainage along the ArcGIS polyline. This does not establish the operator direction.',
      directionStatus: 'UNVERIFIED',
      serviceStatus: 'HISTORICAL_CANDIDATE',
      restrictions: [
        'ArcGIS route geometries were last edited in 2019; stop points were last edited in 2024.',
        'No current service, commercial direction, timetable, frequency, or stop order is certified.',
        'Ambiguous source groups and route associations are excluded rather than guessed.',
      ],
    },
    summary: {
      sourceStopFeatures: metadata.layers.stops.extractedFeatureCount,
      sourceRouteFeatures: metadata.layers.routes.extractedFeatureCount,
      candidateLines: candidates.length,
      candidateStops: candidates.reduce((sum, line) => sum + line.stopCount, 0),
      excludedGroups: excluded.length,
    },
    candidates,
    excludedGroups: excluded,
  };
}

async function main() {
  const input = path.join(process.cwd(), 'artifacts/ddd');
  const [crosswalk, routes, metadata] = await Promise.all([
    fs.readFile(path.join(input, 'arcgis-2024-audit/ddd-arcgis-stop-to-route-proximity.csv'), 'utf8'),
    fs.readFile(path.join(input, 'arcgis-2024-extract/routes.geojson'), 'utf8'),
    fs.readFile(path.join(input, 'arcgis-2024-extract/metadata.json'), 'utf8'),
  ]);
  const result = buildCandidateSequences({
    rows: parseCsv(crosswalk),
    routes: JSON.parse(routes),
    metadata: JSON.parse(metadata),
  });
  const outputDir = path.join(input, 'arcgis-2024-candidate-sequences');
  await fs.mkdir(outputDir, { recursive: true });
  await fs.writeFile(path.join(outputDir, 'ddd-arcgis-candidate-sequences.json'), JSON.stringify(result, null, 2) + '\n');
  await fs.writeFile(path.join(outputDir, 'summary.json'), JSON.stringify(result.summary, null, 2) + '\n');
  process.stdout.write(JSON.stringify(result.summary) + '\n');
}

const isDirectRun = process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href;
if (isDirectRun) main().catch((error) => {
  process.stderr.write(String(error?.stack ?? error) + '\n');
  process.exitCode = 1;
});
