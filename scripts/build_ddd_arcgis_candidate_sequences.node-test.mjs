import test from 'node:test';
import assert from 'node:assert/strict';
import { buildCandidateSequences, parseCsv } from './build_ddd_arcgis_candidate_sequences.mjs';

const metadata = {
  service: 'https://example.invalid/FeatureServer',
  layers: {
    stops: { extractedFeatureCount: 3, dataLastEditDate: 1727179206687 },
    routes: { extractedFeatureCount: 2, dataLastEditDate: 1547223442796 },
  },
};
const route = (id, name) => ({
  id,
  properties: { OBJECTID_12: id, Nom_Ligne: name },
  geometry: { type: 'LineString', coordinates: [[-17.4, 14.7], [-17.3, 14.7]] },
});
const row = (group, oid, chainage, extra = {}) => ({
  stop_group_source: group,
  normalized_line: 'Ligne 1',
  stop_objectid_12: String(oid),
  stop_name_source: `Arrêt ${oid}`,
  longitude: '-17.4',
  latitude: '14.7',
  route_objectid_12: '1',
  route_name_source: 'Ligne 1',
  route_geometry_km: '10.0',
  nearest_distance_m: '8.0',
  chainage_m: String(chainage),
  identical_record_signature_count: '1',
  proximity_band: '<=25m',
  review_status: 'GEOMETRY_PROXIMITY_CANDIDATE',
  ...extra,
});

test('parseCsv preserves commas inside quoted stop names', () => {
  const rows = parseCsv('name,value\n"Rue A, secteur B",12\n');
  assert.equal(rows[0].name, 'Rue A, secteur B');
  assert.equal(rows[0].value, '12');
});

test('joins CSV route IDs serialized as decimals to integer GeoJSON IDs', () => {
  const result = buildCandidateSequences({
    rows: [row('ligne_1', 1, 100, { route_objectid_12: '1.0' }), row('ligne_1', 2, 200, { route_objectid_12: '1.0' })],
    routes: { features: [route(1, 'Ligne 1')] },
    metadata,
  });
  assert.equal(result.summary.candidateLines, 1);
  assert.equal(result.candidates[0].routeObjectId, 1);
});

test('builds an ordered candidate only when the entire source group is spatially coherent', () => {
  const result = buildCandidateSequences({
    rows: [row('ligne_1', 1, 200), row('ligne_1', 2, 100)],
    routes: { features: [route(1, 'Ligne 1')] },
    metadata,
  });
  assert.equal(result.summary.candidateLines, 1);
  assert.equal(result.summary.candidateStops, 2);
  assert.deepEqual(result.candidates[0].stops.map((stop) => stop.sourceObjectId), [2, 1]);
  assert.equal(result.candidates[0].directionStatus, 'UNVERIFIED');
});

test('excludes a complete group when one stop requires geometric review', () => {
  const result = buildCandidateSequences({
    rows: [row('ligne_1', 1, 100), row('ligne_1', 2, 200, { review_status: 'GEOMETRY_PROXIMITY_REVIEW_REQUIRED', proximity_band: '50-100m', nearest_distance_m: '62.2' })],
    routes: { features: [route(1, 'Ligne 1')] },
    metadata,
  });
  assert.equal(result.summary.candidateLines, 0);
  assert.equal(result.excludedGroups[0].reason, 'STOP_GEOMETRY_REVIEW_REQUIRED');
});

test('excludes competing source groups that share the same route geometry', () => {
  const result = buildCandidateSequences({
    rows: [row('LIgne_13', 1, 100), row('ligne_13', 2, 200)],
    routes: { features: [route(1, 'Ligne 1')] },
    metadata,
  });
  assert.equal(result.summary.candidateLines, 0);
  assert.equal(result.excludedGroups.length, 2);
  assert.ok(result.excludedGroups.every((group) => group.reason === 'MULTIPLE_SOURCE_GROUPS_SHARE_ROUTE_GEOMETRY'));
});
