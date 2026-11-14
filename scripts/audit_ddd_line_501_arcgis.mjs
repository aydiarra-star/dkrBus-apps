import { readFile, writeFile } from "node:fs/promises";

const inputPath = process.argv[2] || "artifacts/arcgis/ddd-updated-service-candidates.json";
const outputPath = process.argv[3] || "artifacts/arcgis/ddd-line-501-targeted-audit.json";
const source = JSON.parse(await readFile(inputPath, "utf8"));

function lineKey(value) {
  return String(value ?? "")
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toUpperCase()
    .replace(/\bLIGNE\b/gu, " ")
    .replace(/[^A-Z0-9]/gu, "");
}

function candidateLine(value) {
  const key = lineKey(value);
  return key === "501" || /(^|[^0-9])501([^0-9]|$)/u.test(String(value ?? ""));
}

const stopLayer = source.layers.find((layer) => layer.kind === "stops");
const routeLayer = source.layers.find((layer) => layer.kind === "routes");
if (!stopLayer || !routeLayer) throw new Error("Expected both stop and route layers");

function summarizeStop(feature) {
  const attributes = feature.attributes ?? {};
  const geometry = feature.geometry ?? null;
  return {
    objectId: attributes.OBJECTID ?? attributes[stopLayer.objectIdField] ?? null,
    globalId: attributes.GlobalID ?? null,
    lineValue: attributes.Nom_Ligne ?? null,
    stopName: attributes.Nom_Arret ?? null,
    x: geometry?.x ?? null,
    y: geometry?.y ?? null,
    geometryPresent: Boolean(geometry),
    attributes,
  };
}

function summarizeRoute(feature) {
  const attributes = feature.attributes ?? {};
  const geometry = feature.geometry ?? null;
  const paths = geometry?.paths ?? [];
  return {
    objectId: attributes.OBJECTID ?? attributes[routeLayer.objectIdField] ?? null,
    globalId: attributes.GlobalID ?? null,
    lineValue: attributes.Nom_Ligne ?? null,
    geometryType: geometry ? "polyline" : null,
    pathCount: paths.length,
    vertexCount: paths.reduce((sum, path) => sum + path.length, 0),
    attributes,
  };
}

const stopCandidates = stopLayer.features.filter((feature) => candidateLine(feature.attributes?.Nom_Ligne));
const routeCandidates = routeLayer.features.filter((feature) => candidateLine(feature.attributes?.Nom_Ligne));
const stopExact = stopCandidates.filter((feature) => lineKey(feature.attributes?.Nom_Ligne) === "501");
const routeExact = routeCandidates.filter((feature) => lineKey(feature.attributes?.Nom_Ligne) === "501");

const report = {
  generatedAt: new Date().toISOString(),
  source: {
    service: source.service,
    generatedAt: source.generatedAt,
    stopLayerId: stopLayer.layerId,
    stopLayerName: stopLayer.layerName,
    stopLayerLastEditDate: stopLayer.lastEditDate,
    routeLayerId: routeLayer.layerId,
    routeLayerName: routeLayer.layerName,
    routeLayerLastEditDate: routeLayer.lastEditDate,
  },
  method: "Read-only exact normalized line-key filter for 501, plus a separate broader candidate capture for raw line labels containing 501. Coordinates and attributes are retained as source evidence; feature response order is not treated as passenger stop order.",
  counts: {
    exact501Stops: stopExact.length,
    broader501StopCandidates: stopCandidates.length,
    exact501Routes: routeExact.length,
    broader501RouteCandidates: routeCandidates.length,
  },
  stopLineValues: [...new Set(stopCandidates.map((feature) => String(feature.attributes?.Nom_Ligne ?? "")))].sort(),
  routeLineValues: [...new Set(routeCandidates.map((feature) => String(feature.attributes?.Nom_Ligne ?? "")))].sort(),
  stops: stopCandidates.map(summarizeStop),
  routes: routeCandidates.map(summarizeRoute),
  safeguards: [
    "No source feature is modified, deleted, merged, or reassigned.",
    "ArcGIS object order is not interpreted as passenger stop order.",
    "No return direction is inferred.",
    "No terminus equivalence is inferred between Gare de Dakar and Leclerc.",
    "No production route data, timetable, frequency, database, TER/BRT baseline, or deployment is changed.",
  ],
};

await writeFile(outputPath, JSON.stringify(report, null, 2) + "\n");
console.log(JSON.stringify({
  counts: report.counts,
  stopLineValues: report.stopLineValues,
  routeLineValues: report.routeLineValues,
  stops: report.stops.map(({ objectId, lineValue, stopName, x, y, geometryPresent }) => ({
    objectId, lineValue, stopName, x, y, geometryPresent,
  })),
  routes: report.routes.map(({ objectId, lineValue, pathCount, vertexCount }) => ({
    objectId, lineValue, pathCount, vertexCount,
  })),
}, null, 2));
