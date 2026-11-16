import test from 'node:test';
import assert from 'node:assert/strict';
import { auditAftuTataCoverage } from './audit_aftu_tata_directional_coverage.mjs';

test('counts AFTU directions, schedules, generic labels and geocoding gaps', () => {
  const report = auditAftuTataCoverage([{
    file: 'aftu-30-directions.json',
    data: {
      code: '30',
      waypoints: ['Arrêt De Bus', 'Petersen'],
      inboundWaypoints: ['Petersen', 'Arrêt De Bus'],
      directions: { outbound: { schedule: { first: '06:00' } }, inbound: { schedule: { first: '06:10' } } },
    },
  }], []);
  assert.equal(report.summary.aftu.lineCount, 1);
  assert.equal(report.summary.aftu.bothDirectionsPresent, 1);
  assert.equal(report.summary.aftu.bothDirectionSchedulesPresent, 1);
  assert.equal(report.summary.aftu.genericStopLabels, 2);
  assert.equal(report.summary.aftu.geocodedWaypoints, 0);
});

test('keeps TATA return paths separate and does not infer a return sequence', () => {
  const report = auditAftuTataCoverage([], [
    { code: '39', origin: 'Lat-Dior', destination: 'Diamalaye', waypoints: ['Rue 6', 'Dior'] },
    { code: '40', origin: 'Grand Mbao', destination: 'Petersen', waypoints: ['Route Nationale 1', 'Petersen'], returnWaypoints: ['Petersen', 'Route Nationale 1'] },
  ]);
  assert.equal(report.summary.tata.lineCount, 2);
  assert.equal(report.summary.tata.returnSequencesPresent, 1);
  assert.equal(report.summary.tata.oneDirectionOnly, 1);
});
