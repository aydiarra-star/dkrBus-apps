#!/usr/bin/env node
/**
 * Audit de couverture des séquences AFTU/TATA déjà présentes dans le dépôt.
 * Lecture seule : aucun fichier de données voyageurs n'est modifié.
 */
import fs from 'node:fs/promises';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const normalize = (value) => String(value ?? '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
const isFiniteCoordinateValue = (value) =>
  value !== null && value !== undefined && value !== '' &&
  Number.isFinite(typeof value === 'number' ? value : Number(value));

const isCoordinate = (point) => point && typeof point === 'object' &&
  isFiniteCoordinateValue(point.lat ?? point.latitude) &&
  isFiniteCoordinateValue(point.lon ?? point.lng ?? point.longitude);

function countCoordinates(points) {
  return points.filter(isCoordinate).length;
}
function countGenericLabels(points) {
  return points.filter((point) => typeof point === 'string' &&
    ['arret de bus', 'arret', 'bus stop', 'stop'].includes(normalize(point))).length;
}
function outboundWaypoints(data) {
  return data.directions?.outbound?.waypoints ?? data.outboundWaypoints ?? data.waypoints ?? [];
}
function inboundWaypoints(data) {
  return data.directions?.inbound?.waypoints ?? data.inboundWaypoints ?? data.returnWaypoints ?? [];
}
function hasSchedule(data, direction) {
  return Boolean(data.directions?.[direction]?.schedule ?? data[direction + 'Schedule']);
}

export function auditAftuTataCoverage(aftuRecords, tataRecords) {
  const aftu = aftuRecords.map(({ file, data }) => {
    const outbound = outboundWaypoints(data);
    const inbound = inboundWaypoints(data);
    const code = String(data.code ?? file.match(/aftu-(\d+)/i)?.[1] ?? 'unknown');
    const unverified = /unverified/i.test(code) || /unverified/i.test(String(data.status ?? data.validationStatus ?? ''));
    return {
      code,
      file,
      outboundStops: outbound.length,
      inboundStops: inbound.length,
      bothDirectionsPresent: outbound.length > 0 && inbound.length > 0,
      outboundSchedulePresent: hasSchedule(data, 'outbound'),
      inboundSchedulePresent: hasSchedule(data, 'inbound'),
      geocodedWaypoints: countCoordinates([...outbound, ...inbound]),
      genericStopLabels: countGenericLabels([...outbound, ...inbound]),
      sourceUrl: data.detailSourceUrl ?? data.sourceUrl ?? null,
      sequenceStatus: unverified ? 'UNVERIFIED_SOURCE_SEQUENCE' : 'SOURCE_SEQUENCE_PRESENT',
    };
  }).sort((a, b) => a.code.localeCompare(b.code, 'fr', { numeric: true }));

  const tata = tataRecords.map((data) => {
    const outbound = data.waypoints ?? data.outboundWaypoints ?? [];
    const inbound = data.inboundWaypoints ?? data.returnWaypoints ?? data.directions?.inbound?.waypoints ?? [];
    return {
      code: String(data.code ?? 'unknown'),
      origin: data.origin ?? null,
      destination: data.destination ?? null,
      outboundStops: outbound.length,
      inboundStops: inbound.length,
      returnSequencePresent: inbound.length > 0,
      geocodedWaypoints: countCoordinates([...outbound, ...inbound]),
      sourceUrl: data.detailSourceUrl ?? data.sourceUrl ?? null,
      publishedAt: data.publishedAt ?? null,
    };
  }).sort((a, b) => a.code.localeCompare(b.code, 'fr', { numeric: true }));

  const summary = {
    aftu: {
      lineCount: aftu.length,
      bothDirectionsPresent: aftu.filter((line) => line.bothDirectionsPresent).length,
      bothDirectionSchedulesPresent: aftu.filter((line) => line.outboundSchedulePresent && line.inboundSchedulePresent).length,
      linesMissingOneOrBothSchedules: aftu.filter((line) => !line.outboundSchedulePresent || !line.inboundSchedulePresent).map((line) => line.code),
      geocodedWaypoints: aftu.reduce((sum, line) => sum + line.geocodedWaypoints, 0),
      genericStopLabels: aftu.reduce((sum, line) => sum + line.genericStopLabels, 0),
      unverifiedLines: aftu.filter((line) => line.sequenceStatus === 'UNVERIFIED_SOURCE_SEQUENCE').map((line) => line.code),
    },
    tata: {
      lineCount: tata.length,
      returnSequencesPresent: tata.filter((line) => line.returnSequencePresent).length,
      oneDirectionOnly: tata.filter((line) => !line.returnSequencePresent).length,
      geocodedWaypoints: tata.reduce((sum, line) => sum + line.geocodedWaypoints, 0),
    },
  };
  return {
    generatedAt: new Date().toISOString(),
    purpose: 'Source coverage audit only; these waypoint names are not yet geocoded and are not activated as passenger routes.',
    summary,
    readiness: {
      aftu: 'GEOCODING_REQUIRED; inspect generic stop labels and missing schedules before activation.',
      tata: 'GEOCODING_AND_RETURN_SEQUENCE_REQUIRED before bidirectional routing.',
    },
    limitations: [
      'AFTU and TATA waypoint strings do not provide reliable latitude/longitude in these source files.',
      'Generic labels such as “Arrêt de bus” cannot be geocoded as individual stops without additional evidence.',
      'A TATA outbound sequence is not proof of the return path.',
      'An unverified AFTU source sequence is retained for audit but must not be activated.',
    ],
    aftu,
    tata,
  };
}

async function main() {
  const dataDir = path.join(process.cwd(), 'src/data');
  const files = (await fs.readdir(dataDir)).filter((file) => /^aftu-\d+-(?:directions|return)\.json$/i.test(file)).sort();
  const aftuRecords = await Promise.all(files.map(async (file) => ({
    file,
    data: JSON.parse(await fs.readFile(path.join(dataDir, file), 'utf8')),
  })));
  const tata = JSON.parse(await fs.readFile(path.join(dataDir, 'tata-lines.json'), 'utf8'));
  const report = auditAftuTataCoverage(aftuRecords, Array.isArray(tata) ? tata : tata.lines ?? []);
  const outDir = path.join(process.cwd(), 'artifacts/aftu-tata');
  await fs.mkdir(outDir, { recursive: true });
  await fs.writeFile(path.join(outDir, 'source-coverage.json'), JSON.stringify(report, null, 2) + '\n');
  await fs.writeFile(path.join(outDir, 'summary.json'), JSON.stringify(report.summary, null, 2) + '\n');
  process.stdout.write(JSON.stringify(report.summary) + '\n');
}

const isDirectRun = process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href;
if (isDirectRun) main().catch((error) => {
  process.stderr.write(String(error?.stack ?? error) + '\n');
  process.exitCode = 1;
});
