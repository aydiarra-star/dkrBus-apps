import test from 'node:test';
import assert from 'node:assert/strict';
import { buildAftuTataOsmCrosswalk, normalizeStopName } from './build_aftu_tata_osm_stop_crosswalk.node.mjs';

test('normalizes accents and generic stop prefixes', () => {
  assert.equal(normalizeStopName('Arrêt Terminus UCAD'), 'ucad');
  assert.equal(normalizeStopName('Marché Tilène'), 'marche tilene');
});

test('keeps a single explicitly AFTU-tagged OSM feature as a coordinate candidate', () => {
  const report = buildAftuTataOsmCrosswalk({
    aftuRecords: [{ data: { code: '82', waypoints: ['Centre Social', 'Arrêt de bus'] } }],
    tataRecords: [],
    osmData: { elements: [
      { type: 'node', id: 12, lat: 14.72, lon: -17.45, tags: { name: 'Centre Social', network: 'AFTU', highway: 'bus_stop' } },
    ] },
  });
  const match = report.matches.find((x) => x.waypoint === 'Centre Social');
  assert.equal(match.status, 'EXACT_AFTU_TATA_OSM_FEATURE_CANDIDATE');
  assert.equal(match.candidateLocation.osmElementId, 12);
  assert.equal(report.summary.genericLabels, 1);
});

test('includes official AFTU corridor waypoints as a separate source', () => {
  const report = buildAftuTataOsmCrosswalk({
    aftuRecords: [],
    aftuOfficialRecords: [{ code: '37', waypoints: ['Terminus APIX', 'UCAD'] }],
    tataRecords: [],
    osmData: { elements: [] },
  });
  const match = report.matches.find((x) => x.waypoint === 'UCAD');
  assert.equal(match.occurrences[0].source, 'AFTU_OFFICIAL_CORRIDOR');
  assert.equal(match.occurrences[0].direction, 'corridor_published');
  assert.equal(report.summary.officialAftuCorridorLines, 1);
});

test('uses the centre of a named AFTU platform way as a coordinate candidate', () => {
  const report = buildAftuTataOsmCrosswalk({
    aftuRecords: [],
    aftuOfficialRecords: [{ code: '37', waypoints: ['Centre Social'] }],
    tataRecords: [],
    osmData: { elements: [
      { type: 'way', id: 81, geometry: [
        { lat: 14.7272, lon: -17.4567 },
        { lat: 14.7274, lon: -17.4565 },
      ], tags: { name: 'Centre Social', network: 'AFTU', public_transport: 'platform' } },
    ] },
  });
  const match = report.matches[0];
  assert.equal(match.status, 'EXACT_AFTU_TATA_OSM_FEATURE_CANDIDATE');
  assert.equal(match.candidateLocation.osmElementType, 'way');
  assert.equal(match.candidateLocation.osmElementId, 81);
  assert.equal(match.candidateLocation.lat, 14.7273);
});

test('does not promote DDD or BRT coordinates to AFTU/TATA stops', () => {
  const report = buildAftuTataOsmCrosswalk({
    aftuRecords: [{ data: { code: '30', waypoints: ['UCAD'] } }],
    tataRecords: [],
    osmData: { elements: [
      { type: 'node', id: 21, lat: 14.69, lon: -17.46, tags: { name: 'UCAD', operator: 'Dakar Dem Dikk', network: 'Dakar Dem Dikk', highway: 'bus_stop' } },
    ] },
  });
  const match = report.matches[0];
  assert.equal(match.status, 'CROSS_NETWORK_OSM_REFERENCE_ONLY');
  assert.equal(match.candidateLocation, null);
  assert.equal(match.candidateFeatures[0].network, 'DDD');
});

test('deduplicates repeated Overpass node records and recognizes DDD tag variants', () => {
  const node = { type: 'node', id: 41, lat: 14.69, lon: -17.46, tags: { name: 'UCAD', network: 'DAKAR DEM DIK', highway: 'bus_stop' } };
  const report = buildAftuTataOsmCrosswalk({
    aftuRecords: [{ data: { code: '58', waypoints: ['UCAD'] } }],
    tataRecords: [],
    osmData: { elements: [node, { ...node }] },
  });
  const match = report.matches[0];
  assert.equal(match.status, 'CROSS_NETWORK_OSM_REFERENCE_ONLY');
  assert.equal(match.osmCandidateCount, 1);
  assert.equal(match.candidateFeatures[0].network, 'DDD');
});

test('includes peripheral Dakar routes around Sangalkam and Toubab Dialaw', () => {
  const report = buildAftuTataOsmCrosswalk({
    aftuRecords: [{ data: { code: '79', waypoints: ['Terminus Sangalkam'] } }],
    tataRecords: [],
    osmData: { elements: [
      { type: 'node', id: 901, lat: 14.82, lon: -17.22, tags: { name: 'Terminus Sangalkam', network: 'AFTU', highway: 'bus_stop' } },
    ] },
  });
  assert.equal(report.matches[0].status, 'EXACT_AFTU_TATA_OSM_FEATURE_CANDIDATE');
  assert.equal(report.source.geographicBounds.north, 15.02);
  assert.equal(report.source.geographicBounds.south, 14.45);
});

test('marks distant exact-name locations as ambiguous', () => {
  const report = buildAftuTataOsmCrosswalk({
    aftuRecords: [{ data: { code: '30', waypoints: ['VDN'] } }],
    tataRecords: [],
    osmData: { elements: [
      { type: 'node', id: 1, lat: 14.69, lon: -17.46, tags: { name: 'VDN', network: 'AFTU', highway: 'bus_stop' } },
      { type: 'node', id: 2, lat: 14.75, lon: -17.40, tags: { name: 'VDN', network: 'AFTU', highway: 'bus_stop' } },
    ] },
  });
  assert.equal(report.matches[0].status, 'AMBIGUOUS_MULTIPLE_LOCATIONS');
  assert.equal(report.matches[0].candidateLocation, null);
});

test('ignores untagged objects and nodes outside Dakar bounds', () => {
  const report = buildAftuTataOsmCrosswalk({
    aftuRecords: [{ data: { code: '30', waypoints: ['UCAD'] } }],
    tataRecords: [],
    osmData: { elements: [
      { type: 'way', id: 1, tags: { name: 'UCAD', highway: 'bus_stop' } },
      { type: 'node', id: 2, lat: 40.7, lon: -74.0, tags: { name: 'UCAD', highway: 'bus_stop' } },
    ] },
  });
  assert.equal(report.matches[0].status, 'NO_EXACT_OSM_MATCH');
});
