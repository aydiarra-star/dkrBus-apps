import test from 'node:test';
import assert from 'node:assert/strict';
import { compareCandidateSequences, parsePublishedRouteModule } from './audit_ddd_arcgis_official_sequence_alignment.mjs';

test('parses the published DDD route module without changing its source', () => {
  const routes = parsePublishedRouteModule("export const ROUTES = [{ line: '1', stops: ['A', 'B'] }] as const", 'ROUTES');
  assert.deepEqual(JSON.parse(JSON.stringify(routes)), [{ line: '1', stops: ['A', 'B'] }]);
});

test('detects when geometric order is compatible with the published stop order', () => {
  const candidates = [{
    line: 'Ligne 1',
    stops: [
      { sourceStopName: 'Arret terminus Parcelles Assainies' },
      { sourceStopName: 'Arret Caserne Sapeur Pompiers' },
      { sourceStopName: 'Arret Terrain Acapes' },
      { sourceStopName: 'Arret UCAD' },
    ],
  }];
  const published = [{
    line: '1',
    stops: ['Terminus Parcelles Assainies', 'Sapeur Pompiers', 'Terrain Acapes', 'UCAD'],
  }];
  const [result] = compareCandidateSequences(candidates, published);
  assert.equal(result.status, 'FORWARD_ORDER_COMPATIBLE');
  assert.equal(result.forwardMatches, 4);
  assert.equal(result.directionCertification, 'NONE');
});

test('does not certify a direction when no ordered anchors can be matched', () => {
  const candidates = [{ line: 'Ligne 2', stops: [{ sourceStopName: 'Arrêt X' }, { sourceStopName: 'Arrêt Y' }] }];
  const published = [{ line: '2', stops: ['Aéroport', 'Plage'] }];
  const [result] = compareCandidateSequences(candidates, published);
  assert.equal(result.status, 'ORDER_UNRESOLVED');
  assert.equal(result.directionCertification, 'NONE');
});
