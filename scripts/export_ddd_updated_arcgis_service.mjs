import { mkdir, writeFile } from "node:fs/promises";

const SERVICE_URL =
  "https://services1.arcgis.com/tKMirJrirprCZbnf/ArcGIS/rest/services/Dem_dikk_mise_a_jour/FeatureServer";
const LAYERS = [
  { id: 0, kind: "stops", expectedGeometry: "esriGeometryPoint" },
  { id: 1, kind: "routes", expectedGeometry: "esriGeometryPolyline" },
];
const OUTPUT = "artifacts/arcgis/ddd-updated-service-candidates.json";
const USER_AGENT = "DakarBus-readonly-updated-ArcGIS-audit/1.0";

async function fetchJson(url, label) {
  const response = await fetch(url, {
    headers: { "User-Agent": USER_AGENT },
    signal: AbortSignal.timeout(45000),
  });
  if (!response.ok) throw new Error(label + ": HTTP " + response.status);
  const body = await response.json();
  if (body.error) throw new Error(label + ": " + JSON.stringify(body.error));
  return body;
}

async function fetchLayer(layer) {
  const layerUrl = SERVICE_URL + "/" + layer.id;
  const metadata = await fetchJson(layerUrl + "?f=json", "metadata layer " + layer.id);
  if (metadata.geometryType !== layer.expectedGeometry) {
    throw new Error("Unexpected geometry type for layer " + layer.id + ": " + metadata.geometryType);
  }
  const objectIdField = metadata.objectIdField || metadata.objectIdFieldName;
  if (!objectIdField) throw new Error("Missing object ID field for layer " + layer.id);

  const pageSize = Math.min(Number(metadata.maxRecordCount) || 500, 1000);
  const features = [];
  let offset = 0;
  let page = 0;
  while (true) {
    page += 1;
    const params = new URLSearchParams({
      where: "1=1",
      outFields: "*",
      returnGeometry: "true",
      outSR: "4326",
      orderByFields: objectIdField + " ASC",
      resultOffset: String(offset),
      resultRecordCount: String(pageSize),
      f: "json",
    });
    const data = await fetchJson(layerUrl + "/query?" + params.toString(), "query layer " + layer.id + " page " + page);
    const rows = data.features || [];
    features.push(...rows);
    if (!data.exceededTransferLimit && rows.length < pageSize) break;
    if (!rows.length) throw new Error("Pagination stalled on layer " + layer.id + " at offset " + offset);
    offset += rows.length;
    if (page > 100) throw new Error("Pagination safety limit reached on layer " + layer.id);
  }

  const ids = new Set();
  for (const feature of features) {
    const id = feature.attributes?.[objectIdField];
    if (id == null) throw new Error("Feature missing object ID in layer " + layer.id);
    if (ids.has(String(id))) throw new Error("Duplicate object ID in layer " + layer.id + ": " + id);
    ids.add(String(id));
  }

  return {
    layerId: layer.id,
    kind: layer.kind,
    layerName: metadata.name || null,
    geometryType: metadata.geometryType,
    spatialReference: metadata.extent?.spatialReference || null,
    objectIdField,
    globalIdField: metadata.globalIdField || null,
    maxRecordCount: metadata.maxRecordCount || null,
    lastEditDate: metadata.editingInfo?.lastEditDate
      ? new Date(metadata.editingInfo.lastEditDate).toISOString()
      : null,
    schemaLastEditDate: metadata.editingInfo?.schemaLastEditDate
      ? new Date(metadata.editingInfo.schemaLastEditDate).toISOString()
      : null,
    fields: (metadata.fields || []).map((field) => ({
      name: field.name,
      alias: field.alias,
      type: field.type,
    })),
    featureCount: features.length,
    features,
    sourceUrl: layerUrl,
  };
}

await mkdir("artifacts/arcgis", { recursive: true });
const layers = [];
for (const layer of LAYERS) layers.push(await fetchLayer(layer));

const stops = layers.find((layer) => layer.kind === "stops");
const routes = layers.find((layer) => layer.kind === "routes");
const summary = {
  service: SERVICE_URL,
  stopFeatures: stops.featureCount,
  routeFeatures: routes.featureCount,
  stopFeaturesWithName: stops.features.filter((feature) => String(feature.attributes?.Nom_Arret || "").trim()).length,
  stopFeaturesWithLine: stops.features.filter((feature) => String(feature.attributes?.Nom_Ligne || "").trim()).length,
  routeFeaturesWithName: routes.features.filter((feature) => String(feature.attributes?.Nom_Ligne || "").trim()).length,
  stopFeaturesWithGeometry: stops.features.filter((feature) => feature.geometry).length,
  routeFeaturesWithGeometry: routes.features.filter((feature) => feature.geometry).length,
};

const report = {
  generatedAt: new Date().toISOString(),
  attribution: "Public ArcGIS FeatureServer: Dem_dikk_mise_a_jour",
  policy: "Read-only extraction. This 2024-edited service is kept separate from the older DDD ArcGIS services. No stop identity, direction, timetable, frequency, or passenger route is validated by extraction alone. No database writes.",
  summary,
  layers,
};
await writeFile(OUTPUT, JSON.stringify(report, null, 2) + "\n");
console.log(JSON.stringify(summary, null, 2));
