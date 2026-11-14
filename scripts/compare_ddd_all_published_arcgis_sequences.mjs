import { readFile, writeFile } from "node:fs/promises";
import { DDD_PUBLISHED_ROUTES } from "../src/data/dddPublishedRoutes.ts";
import { DDD_SUBURBAN_PUBLISHED_ROUTE_SEQUENCES_A } from "../src/data/dddSuburbanPublishedRoutesA.ts";
import { DDD_SUBURBAN_PUBLISHED_ROUTE_SEQUENCES_B } from "../src/data/dddSuburbanPublishedRoutesB.ts";

const [arcgisPath = "artifacts/arcgis/ddd-updated-service-candidates.json",
  outputPath = "artifacts/arcgis/ddd-all-published-sequence-crosscheck.json"] = process.argv.slice(2);
const arcgis = JSON.parse(await readFile(arcgisPath, "utf8"));
const stopLayer = arcgis.layers.find((layer) => layer.kind === "stops");
if (!stopLayer) throw new Error("Updated DDD ArcGIS stop layer missing");

function lineKey(value) {
  return String(value ?? "").normalize("NFD").replace(/\p{Diacritic}/gu, "")
    .toUpperCase().replace(/^\s*(?:LIGNE|L)\s*[_-]?\s*/u, "")
    .replace(/[^A-Z0-9]/gu, "");
}
function normalize(value) {
  return String(value ?? "").normalize("NFD").replace(/\p{Diacritic}/gu, "")
    .toLocaleLowerCase("fr").replace(/\b(arr[eê]t|terminus|station|gare)\b/gu, " ")
    .replace(/[^a-z0-9]+/gu, " ").trim().replace(/\s+/gu, " ");
}
function lcs(left, right) {
  const dp = Array.from({ length: left.length + 1 }, () => new Uint16Array(right.length + 1));
  for (let i = 1; i <= left.length; i += 1) for (let j = 1; j <= right.length; j += 1) {
    dp[i][j] = left[i - 1].key && left[i - 1].key === right[j - 1].key
      ? dp[i - 1][j - 1] + 1 : Math.max(dp[i - 1][j], dp[i][j - 1]);
  }
  const matches = [];
  let i = left.length, j = right.length;
  while (i && j) {
    if (left[i - 1].key && left[i - 1].key === right[j - 1].key
      && dp[i][j] === dp[i - 1][j - 1] + 1) {
      matches.push({ arcgisResponseIndex: left[i - 1].index, arcgisName: left[i - 1].name,
        publishedIndex: right[j - 1].index, publishedName: right[j - 1].name });
      i--; j--;
    } else if (dp[i - 1][j] >= dp[i][j - 1]) i--; else j--;
  }
  return { count: dp[left.length][right.length], matches: matches.reverse() };
}

// Keep the operator's primary published list as canonical. Add suburban
// sequences only for line codes not already represented; never merge variants.
const routes = new Map();
for (const route of DDD_PUBLISHED_ROUTES) routes.set(lineKey(route.line), {
  line: route.line, origin: route.origin, destination: route.destination,
  kind: route.kind, stops: [...route.stops], source: "DDD_PUBLISHED_ROUTES",
  sourceConflict: route.sourceConflict ?? null,
});
for (const route of [...DDD_SUBURBAN_PUBLISHED_ROUTE_SEQUENCES_A, ...DDD_SUBURBAN_PUBLISHED_ROUTE_SEQUENCES_B]) {
  const key = lineKey(route.line);
  if (!routes.has(key)) routes.set(key, {
    line: route.line, origin: null, destination: null, kind: "published_suburban_sequence",
    stops: [...route.stops], source: "DDD_SUBURBAN_PUBLISHED_ROUTE_SEQUENCES",
    sourceConflict: route.conflictNote ?? null,
  });
}
const groups = new Map();
for (const feature of stopLayer.features ?? []) {
  const attrs = feature.attributes ?? {};
  const key = lineKey(attrs.Nom_Ligne);
  const rows = groups.get(key) ?? [];
  rows.push({
    globalId: attrs.GlobalID ?? null, objectId: attrs.OBJECTID ?? null,
    sourceLine: attrs.Nom_Ligne ?? null,
    name: String(attrs.Nom_Arret ?? "").trim() || null,
    key: normalize(attrs.Nom_Arret),
    hasGeometry: Boolean(feature.geometry),
    responseIndex: rows.length + 1,
  });
  groups.set(key, rows);
}

const comparisons = [];
for (const route of routes.values()) {
  const rows = groups.get(lineKey(route.line)) ?? [];
  const named = rows.filter((row) => row.name).map((row) => ({
    index: row.responseIndex, name: row.name, key: row.key,
  }));
  const published = route.stops.map((name, index) => ({ index: index + 1, name, key: normalize(name) }));
  const sourceSet = new Set(named.map((x) => x.key).filter(Boolean));
  const publishedSet = new Set(published.map((x) => x.key).filter(Boolean));
  const shared = [...sourceSet].filter((key) => publishedSet.has(key));
  const ordered = lcs(named, published);
  comparisons.push({
    line: route.line, origin: route.origin, destination: route.destination, kind: route.kind,
    source: route.source, sourceConflict: route.sourceConflict,
    arcgisFeatureCount: rows.length, arcgisNamedCount: named.length,
    arcgisUnnamedCount: rows.length - named.length, arcgisGeometryCount: rows.filter(x => x.hasGeometry).length,
    publishedReferenceCount: published.length, sharedUniqueNormalizedNameCount: shared.length,
    sharedNames: shared.map(key => ({
      normalized: key,
      arcgisOccurrences: named.filter(x => x.key === key).map(x => ({ index: x.index, name: x.name })),
      publishedOccurrences: published.filter(x => x.key === key).map(x => ({ index: x.index, name: x.name })),
    })),
    responseOrderLcsCount: ordered.count, responseOrderLcsMatches: ordered.matches,
    repeatedArcgisNames: [...new Set(named.filter((x, i) => named.findIndex(y => y.key === x.key) !== i).map(x => x.name))],
    status: rows.length ? "CANDIDATE_NAME_CROSSCHECK_ONLY" : "NO_MATCHING_ARCGIS_LINE_GROUP",
    interpretation: "ArcGIS feature response order is not assumed to be passenger stop order. Name overlap is diagnostic only; no stop identity, direction, or completeness is validated.",
  });
}
const report = {
  generatedAt: new Date().toISOString(),
  source: { service: arcgis.attribution ?? null, generatedAt: arcgis.generatedAt,
    layerId: stopLayer.layerId, layerName: stopLayer.layerName },
  publishedSources: ["src/data/dddPublishedRoutes.ts", "src/data/dddSuburbanPublishedRoutesA.ts", "src/data/dddSuburbanPublishedRoutesB.ts"],
  method: "Accent/case/punctuation normalization; generic prefixes removed; unique-name overlap and one-to-one LCS against ArcGIS response order. The latter is diagnostic only.",
  safeguards: [
    "All source GlobalIDs, OBJECTIDs, repeated names, and anonymous features are preserved.",
    "No route sequence is reversed or synthesized.",
    "Circuits remain circuits; published variants and conflict notes remain distinct.",
    "No database write, passenger-catalogue update, timetable, frequency, or deployment.",
  ],
  summary: {
    publishedSequencesCompared: comparisons.length,
    sequencesWithArcGisLineGroup: comparisons.filter(x => x.arcgisFeatureCount).length,
    sequencesWithoutArcGisLineGroup: comparisons.filter(x => !x.arcgisFeatureCount).length,
    arcgisFeaturesAcrossMatchedGroups: comparisons.reduce((n,x)=>n+x.arcgisFeatureCount,0),
    totalSharedUniqueNamePairs: comparisons.reduce((n,x)=>n+x.sharedUniqueNormalizedNameCount,0),
    totalResponseOrderLcsMatches: comparisons.reduce((n,x)=>n+x.responseOrderLcsCount,0),
  },
  comparisons,
};
await writeFile(outputPath, JSON.stringify(report, null, 2) + "\n");
console.log(JSON.stringify(report.summary, null, 2));
