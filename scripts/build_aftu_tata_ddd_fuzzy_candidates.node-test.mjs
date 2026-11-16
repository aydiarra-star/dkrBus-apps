import test from 'node:test';
import assert from 'node:assert/strict';
import { buildAftuTataDddFuzzyCandidates, normalizeStopName, levenshteinRatio } from './build_aftu_tata_ddd_fuzzy_candidates.node.mjs';

test('normalizes accented names before comparing them', () => {
  assert.equal(normalizeStopName('École Élémentaire HLM Grand Médine'), 'ecole elementaire hlm grand medine');
  assert.ok(levenshteinRatio('ecole elementaire hlm grand medine', 'ecole elementaire hl grand medine') > 0.95);
});

test('keeps fuzzy suggestions for human review and never assigns coordinates', () => {
  const report = buildAftuTataDddFuzzyCandidates({
    aftuRecords: [],
    aftuOfficialRecords: [{ code: '2', waypoints: ['École Élémentaire HLM Grand Médine'] }],
    tataRecords: [],
    dddCandidates: { candidates: [{ line: 'Ligne 23', stops: [{ sourceStopName: 'Arrêt École Élémentaire HL Grand Médine', lat: 14.76, lon: -17.44, sourceObjectId: 34 }] }] },
  });
  assert.equal(report.matches.length, 1);
  assert.equal(report.matches[0].status, 'FUZZY_REVIEW_ONLY');
  assert.equal(report.matches[0].candidateLocation, null);
  assert.equal(report.matches[0].suggestions[0].locationClusterCount, 1);
  assert.ok(report.matches[0].suggestions[0].candidateLocationForReview);
  assert.equal(report.matches[0].suggestions[0].dddLines[0], 'Ligne 23');
  assert.equal(report.matches[0].occurrences[0].source, 'AFTU_OFFICIAL_CORRIDOR');
});

test('does not duplicate exact-name matches in the fuzzy review list', () => {
  const report = buildAftuTataDddFuzzyCandidates({
    aftuRecords: [{ data: { code: '30', waypoints: ['UCAD'] } }],
    tataRecords: [],
    dddCandidates: { candidates: [{ line: 'Ligne 1', stops: [{ sourceStopName: 'Arrêt UCAD', lat: 14.69, lon: -17.46, sourceObjectId: 7 }] }] },
  });
  assert.equal(report.matches.length, 0);
});

test('ignores generic stop labels', () => {
  const report = buildAftuTataDddFuzzyCandidates({
    aftuRecords: [{ data: { code: '82', waypoints: ['Arrêt de bus'] } }],
    tataRecords: [],
    dddCandidates: { candidates: [{ line: 'Ligne 1', stops: [{ sourceStopName: 'Arrêt bus', lat: 14.69, lon: -17.46, sourceObjectId: 7 }] }] },
  });
  assert.equal(report.matches.length, 0);
  assert.equal(report.summary.genericLabels, 1);
});

test('does not provide a single review location when DDD candidates are geographically separated', () => {
  const report = buildAftuTataDddFuzzyCandidates({
    aftuRecords: [{ data: { code: '2', waypoints: ['Stade Léopold Sédar Sengor'] } }],
    tataRecords: [],
    dddCandidates: { candidates: [{ line: 'Ligne 1', stops: [
      { sourceStopName: 'Arrêt Stade Léopold Sédar Senghor', lat: 14.7504, lon: -17.4496, sourceObjectId: 1 },
      { sourceStopName: 'Arrêt Stade Léopold Sédar Senghor', lat: 14.7510, lon: -17.4523, sourceObjectId: 2 },
    ] }] },
  });
  const suggestion = report.matches[0].suggestions[0];
  assert.equal(suggestion.locationClusterCount, 2);
  assert.equal(suggestion.candidateLocationForReview, null);
  assert.equal(report.summary.topSuggestionsWithMultipleLocationClusters, 1);
});

test('marks close top fuzzy scores as ambiguous', () => {
  const report = buildAftuTataDddFuzzyCandidates({
    aftuRecords: [{ data: { code: '2', waypoints: ['Avenue Jean Jaures 4'] } }],
    tataRecords: [],
    dddCandidates: { candidates: [
      { line: 'Ligne 1', stops: [{ sourceStopName: 'Arrêt Avenue Jean Jaurès 5', lat: 14.67, lon: -17.44, sourceObjectId: 1 }] },
      { line: 'Ligne 4', stops: [{ sourceStopName: 'Arrêt Avenue Jean Jaurès 3', lat: 14.68, lon: -17.44, sourceObjectId: 2 }] },
    ] },
  });
  assert.equal(report.matches[0].status, 'AMBIGUOUS_FUZZY_REVIEW_ONLY');
  assert.equal(report.matches[0].candidateLocation, null);
});
