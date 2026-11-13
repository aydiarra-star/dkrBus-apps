import { readFile, writeFile } from "node:fs/promises";
import { DDD_SUBURBAN_PUBLISHED_ROUTE_SEQUENCES_B } from "../src/data/dddSuburbanPublishedRoutesB.ts";

const [arcgisPath = "artifacts/arcgis/ddd-updated-service-candidates.json",
  outputPath = "artifacts/arcgis/ddd-published-sequence-name-crosscheck.json"] = process.argv.slice(2);

const arcgis = JSON.parse(await readFile(arcgisPath, "utf8"));
const stopLayer = arcgis.layers.find((layer) => layer.kind === "stops");
if (!stopLayer) throw new Error("ArcGIS stop layer missing");
const routesToAudit = new Set(["217", "218", "219", "227", "228", "232"]);

function normalize(value) {
  return String(value ?? "")
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLocaleLowerCase("fr")
    .replace(/\b(arr[eê]t|terminus|station|gare)\b/gu, " ")
    .replace(/[^a-z0-9]+/gu, " ")
    .trim()
    .replace(/\s+/gu, " ");
}

function lineKey(value) {
  return String(value ?? "")
    .toUpperCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .replace(/^\s*LIGNE\s*[_-]?\s*/u, "")
    .replace(/^\s*L\s*[_-]?\s*(?=\d)/u, "")
    .replace(/[^A-Z0-9]/gu, "");
}

function lcs(left, right) {
  const rows = Array.from({ length: left.length + 1 }, () => new Uint16Array(right.length + 1));
  for (let i = 1; i <= left.length; i += 1) {
    for (let j = 1; j <= right.length; j += 1) {
      rows[i][j] = left[i - 1].key && left[i - 1].key === right[j - 1].key
        ? rows[i - 1][j - 1] + 1
        : Math.max(rows[i - 1][j], rows[i][j - 1]);
    }
  }
  const matches = [];
  let i = left.length;
  let j = right.length;
  while (i > 0 && j > 0) {
    if (left[i - 1].key && left[i - 1].key === right[j - 1].key
      && rows[i][j] === rows[i - 1][j - 1] + 1) {
      matches.push({
        arcgisIndex: left[i - 1].index,
        arcgisName: left[i - 1].name,
        publishedIndex: right[j - 1].index,
        publishedName: right[j - 1].name,
      });
      i -= 1;
      j -= 1;
    } else if (rows[i - 1][j] >= rows[i][j - 1]) i -= 1;
    else j -= 1;
  }
  return { count: rows[left.length][right.length], matches: matches.reverse() };
}

const sourceGroups = new Map();
for (const feature of stopLayer.features ?? []) {
  const attrs = feature.attributes ?? {};
  const key = lineKey(attrs.Nom_Ligne);
  if (!routesToAudit.has(key)) continue;
  const group = sourceGroups.get(key) ?? [];
  group.push({
    sourceGlobalId: attrs.GlobalID ?? null,
    sourceObjectId: attrs.OBJECTID ?? null,
    sourceLineValue: attrs.Nom_Ligne ?? null,
    name: String(attrs.Nom_Arret ?? "").trim() || null,
    key: normalize(attrs.Nom_Arret),
    geometryPresent: Boolean(feature.geometry),
    // Feature response order is retained only for reproducibility, not treated as bus order.
    responseIndex: group.length + 1,
  });
  sourceGroups.set(key, group);
}

// 218 contains two spatially duplicated 33-point blocks and a distinct 37-point block.
// Keep all 103 source records; report repeated names and GlobalIDs without deleting or merging.
const published = new Map(DDD_SUBURBAN_PUBLISHED_ROUTE_SEQUENCES_B
  .filter((route) => routesToAudit.has(route.line))
  .map((route) => [route.line, route]));

const comparisons = [];
for (const line of [...routesToAudit].sort()) {
  const rows = sourceGroups.get(line) ?? [];
  const route = published.get(line);
  if (!route) {
    comparisons.push({ line, sourceFeatureCount: rows.length, publishedSequenceFound: false });
    continue;
  }
  const named = rows.filter((row) => row.name).map((row) => ({
    index: row.responseIndex,
    name: row.name,
    key: row.key,
  }));
  const official = route.stops.map((name, index) => ({ index: index + 1, name, key: normalize(name) }));
  const ordered = lcs(named, official);
  const officialUniqueNames = new Set(official.map((item) => item.key).filter(Boolean));
  const sourceUniqueNames = new Set(named.map((item) => item.key).filter(Boolean));
  const sharedUniqueNames = [...sourceUniqueNames].filter((name) => officialUniqueNames.has(name));
  comparisons.push({
    line,
    sourceFeatureCount: rows.length,
    sourceNamedCount: named.length,
    sourceUnnamedCount: rows.length - named.length,
    publishedStopCount: official.length,
    sharedUniqueNormalizedNameCount: sharedUniqueNames.length,
    orderedLcsMatchCount: ordered.count,
    orderedMatches: ordered.matches,
    sourceNamesRepeated: [...new Set(named.filter((item, index) => named.findIndex((candidate) => candidate.key === item.key) !== index).map((item) => item.name))],
    sourceRecords: rows.map(({ sourceGlobalId, sourceObjectId, sourceLineValue, name, geometryPresent, responseIndex }) => ({
      sourceGlobalId, sourceObjectId, sourceLineValue, name, geometryPresent, responseIndex,
    })),
    interpretation: "Name-only ordered diagnostic over ArcGIS feature response order. It does not validate stop identity, operational direction, current service, or completeness. Repeated names remain separate occurrences.",
  });
}

const report = {
  generatedAt: new Date().toISOString(),
  source: {
    service: arcgis.service,
    generatedAt: arcgis.generatedAt,
    layerId: stopLayer.layerId,
    layerName: stopLayer.layerName,
  },
  publishedSource: "src/data/dddSuburbanPublishedRoutesB.ts",
  method: "Accent/case/punctuation normalization and generic stop-prefix removal, followed by one-to-one longest common subsequence. Source feature response order is not assumed to be operational stop order.",
  safeguards: [
    "No ArcGIS feature is modified, deleted, merged, or reassigned.",
    "Repeated names are matched one-to-one and retained as separate source records.",
    "No reverse direction is generated by reversing the published sequence.",
    "Name matching alone is not a validation; all outputs remain audit candidates.",
    "No timetable, interval, database write, passenger catalogue update, or deployment.",
  ],
  summary: {
    linesAudited: comparisons.length,
    sourceFeatures: comparisons.reduce((sum, row) => sum + row.sourceFeatureCount, 0),
    sourceNamedFeatures: comparisons.reduce((sum, row) => sum + (row.sourceNamedCount ?? 0), 0),
    orderedNameMatches: comparisons.reduce((sum, row) => sum + (row.orderedLcsMatchCount ?? 0), 0),
  },
  comparisons,
};
await writeFile(outputPath, JSON.stringify(report, null, 2) + "\n");
console.log(JSON.stringify(report.summary, null, 2));
