#!/usr/bin/env node
/**
 * Compare les séquences ArcGIS candidates aux séquences publiées DDD.
 * Le résultat indique seulement une compatibilité d'ordre des repères nommés ;
 * il ne certifie ni la direction commerciale ni l'exploitation actuelle.
 */
import fs from 'node:fs/promises';
import path from 'node:path';
import vm from 'node:vm';
import { pathToFileURL } from 'node:url';

const STOP_WORDS = new Set([
  'arret','terminus','station','gare','rue','avenue','av','route','boulevard',
  'bd','de','du','des','la','le','les','d','l','a','au','aux','et','place',
  'marche','marche','croisement','rond','point',
]);

function normalize(value) {
  return String(value ?? '').normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
}

function tokens(value) {
  return normalize(value).split(/\s+/).filter((token) => token && !STOP_WORDS.has(token))
    .map((token) => token.length > 4 && token.endsWith('s') ? token.slice(0, -1) : token);
}

function similarity(left, right) {
  const a = tokens(left);
  const b = tokens(right);
  if (!a.length || !b.length) return 0;
  const as = new Set(a);
  const bs = new Set(b);
  const intersection = [...as].filter((token) => bs.has(token)).length;
  if (intersection === 0) return 0;
  const jaccard = intersection / new Set([...as, ...bs]).size;
  const containment = intersection / Math.min(as.size, bs.size);
  return Math.max(jaccard, containment * 0.82);
}

export function parsePublishedRouteModule(source, variableName) {
  const prefix = new RegExp('^export\\s+const\\s+' + variableName + '\\s*=', 'm');
  if (!prefix.test(source)) throw new Error('Séquence publiée introuvable : ' + variableName);
  const executable = source.replace(prefix, 'globalThis.__routes =').replace(/\\]\\s+as\\s+const\\s*$/, ']');
  const sandbox = {};
  vm.runInNewContext(executable, sandbox, { timeout: 1000 });
  if (!Array.isArray(sandbox.__routes)) throw new Error('Séquence publiée invalide : ' + variableName);
  return sandbox.__routes;
}

function weightedAlignment(officialStops, candidateStops) {
  const rows = officialStops.length + 1;
  const cols = candidateStops.length + 1;
  const dp = Array.from({ length: rows }, () => Array.from({ length: cols }, () => ({ score: 0, pairs: [] })));
  for (let i = 1; i < rows; i += 1) {
    for (let j = 1; j < cols; j += 1) {
      let best = dp[i - 1][j].score >= dp[i][j - 1].score ? dp[i - 1][j] : dp[i][j - 1];
      const match = similarity(officialStops[i - 1], candidateStops[j - 1]);
      if (match >= 0.45) {
        const matched = {
          score: dp[i - 1][j - 1].score + match,
          pairs: [...dp[i - 1][j - 1].pairs, {
            officialStop: officialStops[i - 1],
            arcgisStop: candidateStops[j - 1],
            similarity: Number(match.toFixed(3)),
          }],
        };
        if (matched.score > best.score) best = matched;
      }
      dp[i][j] = best;
    }
  }
  return { score: Number(dp[rows - 1][cols - 1].score.toFixed(3)), pairs: dp[rows - 1][cols - 1].pairs };
}

export function compareCandidateSequences(candidates, publishedRoutes) {
  const publishedByLine = new Map(publishedRoutes.map((route) => [String(route.line).toUpperCase(), route]));
  return candidates.map((candidate) => {
    const number = candidate.line.replace(/^Ligne\\s+/i, '').toUpperCase();
    const official = publishedByLine.get(number);
    if (!official || !Array.isArray(official.stops)) {
      return { line: candidate.line, officialStopCount: 0, arcgisStopCount: candidate.stops.length, status: 'NO_PUBLISHED_SEQUENCE', forwardMatches: 0, reverseMatches: 0 };
    }
    const names = candidate.stops.map((stop) => stop.sourceStopName);
    const forward = weightedAlignment(official.stops, names);
    const reverse = weightedAlignment(official.stops, [...names].reverse());
    let status = 'ORDER_UNRESOLVED';
    if (forward.pairs.length >= 3 && forward.score >= reverse.score + 0.75) status = 'FORWARD_ORDER_COMPATIBLE';
    else if (reverse.pairs.length >= 3 && reverse.score >= forward.score + 0.75) status = 'REVERSE_ORDER_COMPATIBLE';
    return {
      line: candidate.line,
      officialStopCount: official.stops.length,
      arcgisStopCount: names.length,
      status,
      forwardScore: forward.score,
      reverseScore: reverse.score,
      forwardMatches: forward.pairs.length,
      reverseMatches: reverse.pairs.length,
      matchedAnchors: status === 'REVERSE_ORDER_COMPATIBLE' ? reverse.pairs : forward.pairs,
      directionCertification: 'NONE',
    };
  });
}

async function main() {
  const root = process.cwd();
  const candidatePath = path.join(root, 'artifacts/ddd/arcgis-2024-candidate-sequences/ddd-arcgis-candidate-sequences.json');
  const [candidateText, urban, suburbanA, suburbanB] = await Promise.all([
    fs.readFile(candidatePath, 'utf8'),
    fs.readFile(path.join(root, 'src/data/dddOfficialUrbanPublishedRoutes.ts'), 'utf8'),
    fs.readFile(path.join(root, 'src/data/dddSuburbanPublishedRoutesA.ts'), 'utf8'),
    fs.readFile(path.join(root, 'src/data/dddSuburbanPublishedRoutesB.ts'), 'utf8'),
  ]);
  const published = [
    ...parsePublishedRouteModule(urban, 'DDD_URBAN_PUBLISHED_ROUTE_SEQUENCES'),
    ...parsePublishedRouteModule(suburbanA, 'DDD_SUBURBAN_PUBLISHED_ROUTE_SEQUENCES_A'),
    ...parsePublishedRouteModule(suburbanB, 'DDD_SUBURBAN_PUBLISHED_ROUTE_SEQUENCES_B'),
  ];
  const candidates = JSON.parse(candidateText);
  const comparisons = compareCandidateSequences(candidates.candidates, published);
  const summary = {
    candidateLinesCompared: comparisons.length,
    forwardOrderCompatible: comparisons.filter((item) => item.status === 'FORWARD_ORDER_COMPATIBLE').length,
    reverseOrderCompatible: comparisons.filter((item) => item.status === 'REVERSE_ORDER_COMPATIBLE').length,
    unresolved: comparisons.filter((item) => item.status === 'ORDER_UNRESOLVED').length,
    noPublishedSequence: comparisons.filter((item) => item.status === 'NO_PUBLISHED_SEQUENCE').length,
    directionCertification: 'NONE',
  };
  const output = {
    generatedAt: new Date().toISOString(),
    policy: 'Name-and-order corroboration only. Similarity matches are candidate anchors, not proof of stop identity or commercial direction.',
    summary,
    comparisons,
  };
  const outDir = path.join(root, 'artifacts/ddd/arcgis-2024-candidate-sequences');
  await fs.writeFile(path.join(outDir, 'official-sequence-crosscheck.json'), JSON.stringify(output, null, 2) + '\n');
  process.stdout.write(JSON.stringify(summary) + '\n');
}

const isDirectRun = process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href;
if (isDirectRun) main().catch((error) => {
  process.stderr.write(String(error?.stack ?? error) + '\n');
  process.exitCode = 1;
});
