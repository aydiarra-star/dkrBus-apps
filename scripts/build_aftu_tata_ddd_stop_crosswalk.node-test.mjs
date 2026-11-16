import test from 'node:test';
import assert from 'node:assert/strict';
import { buildAftuTataDddCrosswalk, normalizeStopName } from './build_aftu_tata_ddd_stop_crosswalk.node.mjs';

test('normalizes accented and generic stop prefixes', () => {
  assert.equal(normalizeStopName('Arrêt Terminus UCAD'), 'terminus ucad');
  assert.equal(normalizeStopName('Marché Tilène'), 'marche tilene');
});

test('suggests a coordinate only for one exact-name location cluster', () => {
  const report = buildAftuTataDddCrosswalk({
    aftuRecords: [{ data: { code: '30', waypoints: ['UCAD', 'Arrêt de bus'] } }],
    tataRecords: [],
    dddCandidates: { candidates: [{ line: 'Ligne 1', stops: [{ sourceStopName: 'Arrêt UCAD', lat: 14.69, lon: -17.46, sourceObjectId: 7 }] }] },
  });
  const match = report.matches.find((x) => x.waypoint === 'UCAD');
  assert.equal(match.status, 'EXACT_NAME_SINGLE_LOCATION_CANDIDATE');
  assert.equal(match.candidateLocation.lat, 14.69);
  assert.equal(report.summary.genericLabels, 1);
});

test('includes official AFTU corridor waypoints without inventing a return direction', () => {
  const report = buildAftuTataDddCrosswalk({
    aftuRecords: [],
    aftuOfficialRecords: [{ code: '37', waypoints: ['UCAD'] }],
    tataRecords: [],
    dddCandidates: { candidates: [{ line: 'Ligne 1', stops: [{ sourceStopName: 'Arrêt UCAD', lat: 14.69, lon: -17.46, sourceObjectId: 7 }] }] },
  });
  const match = report.matches[0];
  assert.equal(match.occurrences[0].source, 'AFTU_OFFICIAL_CORRIDOR');
  assert.equal(match.occurrences[0].direction, 'corridor_published');
  assert.equal(report.summary.officialAftuCorridorLines, 1);
});

test('marks repeated names at distant locations ambiguous', () => {
  const report = buildAftuTataDddCrosswalk({
    aftuRecords: [{ data: { code: '30', waypoints: ['VDN'] } }],
    tataRecords: [],
    dddCandidates: { candidates: [
      { line: 'Ligne 1', stops: [{ sourceStopName: 'Arrêt VDN', lat: 14.69, lon: -17.46, sourceObjectId: 1 }] },
      { line: 'Ligne 4', stops: [{ sourceStopName: 'Arrêt VDN', lat: 14.75, lon: -17.40, sourceObjectId: 2 }] },
    ] },
  });
  assert.equal(report.matches[0].status, 'AMBIGUOUS_MULTIPLE_LOCATIONS');
  assert.equal(report.matches[0].candidateLocation, null);
});


test('keeps Gare and Terminus distinct when matching Keur Massar hubs', () => {
  assert.equal(normalizeStopName('Gare de Keur Massar'), 'gare keur massar');
  assert.equal(normalizeStopName('Terminus Keur Massar'), 'terminus keur massar');
  const report = buildAftuTataDddCrosswalk({
    aftuRecords: [{ data: { code: '60', waypoints: ['Gare de Keur Massar'] } }],
    tataRecords: [],
    dddCandidates: { candidates: [{
      line: 'DDD 227',
      stops: [{ sourceStopName: 'Terminus Keur Massar', lat: 14.78542, lon: -17.30922, sourceObjectId: 22701 }],
    }] },
  });
  assert.equal(report.matches[0].status, 'NO_EXACT_DDD_MATCH');
  assert.equal(report.matches[0].candidateLocation, null);
});
