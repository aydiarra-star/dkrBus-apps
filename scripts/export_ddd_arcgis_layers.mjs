import { mkdir, writeFile } from "node:fs/promises";

const SERVICES = [
  {
    operator: "DDD",
    group: "urban_routes_and_stops",
    url: "https://services1.arcgis.com/tKMirJrirprCZbnf/ArcGIS/rest/services/Ligne_inter_urbain/FeatureServer",
    layers: [
      { id: 0, kind: "stops" }, { id: 1, kind: "stops" }, { id: 2, kind: "stops" },
      { id: 3, kind: "stops" }, { id: 4, kind: "stops" }, { id: 5, kind: "stops" },
      { id: 6, kind: "stops" }, { id: 7, kind: "stops" }, { id: 8, kind: "stops" },
      { id: 9, kind: "stops" }, { id: 10, kind: "stops" }, { id: 11, kind: "stops" },
      { id: 12, kind: "route" }, { id: 13, kind: "route" }, { id: 14, kind: "route" },
      { id: 15, kind: "route" }, { id: 16, kind: "route" }, { id: 17, kind: "route" },
      { id: 18, kind: "route" }, { id: 19, kind: "route" }, { id: 20, kind: "route" },
      { id: 21, kind: "route" }, { id: 22, kind: "route" }, { id: 23, kind: "route" },
    ],
  },
  {
    operator: "DDD",
    group: "suburban_routes",
    url: "https://services1.arcgis.com/tKMirJrirprCZbnf/ArcGIS/rest/services/Itin%C3%A9raire_ligne_de_Banlieue_Dakar_Dem_Dikk/FeatureServer",
    layers: Array.from({ length: 12 }, (_, id) => ({ id, kind: "route" })),
  },
];

const CONCURRENCY = 4;
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function json(url, label) {
  let error;
  for (let attempt = 1; attempt <= 4; attempt++) {
    try {
      const response = await fetch(url, {
        headers: { "User-Agent": "DakarBus-official-ArcGIS-audit/1.0" },
        signal: AbortSignal.timeout(45000),
      });
      if (response.status === 429 || response.status >= 500) {
        await sleep(1500 * attempt);
        continue;
      }
      if (!response.ok) throw new Error(`${label}: HTTP ${response.status}`);
      const body = await response.json();
      if (body.error) throw new Error(`${label}: ${JSON.stringify(body.error)}`);
      return body;
    } catch (e) {
      error = e;
      if (attempt < 4) await sleep(1000 * attempt);
    }
  }
  throw error;
}

async function main() {
  await mkdir("artifacts/arcgis", { recursive: true });
  const tasks = SERVICES.flatMap((service) =>
    service.layers.map((layer) => ({ service, layer })),
  );
  const results = new Array(tasks.length);
  let cursor = 0;

  async function worker() {
    while (true) {
      const index = cursor++;
      if (index >= tasks.length) return;
      const { service, layer } = tasks[index];
      const base = `${service.url}/${layer.id}`;
      try {
        const metadata = await json(`${base}?f=json`, `layer metadata ${layer.id}`);
        const params = new URLSearchParams({
          where: "1=1",
          outFields: "*",
          returnGeometry: "true",
          outSR: "4326",
          f: "json",
        });
        const data = await json(`${base}/query?${params}`, `layer query ${layer.id}`);
        results[index] = {
          layer: {
            operator: service.operator,
            group: service.group,
            kind: layer.kind,
            layerId: layer.id,
            layerName: metadata.name ?? null,
            geometryType: metadata.geometryType ?? null,
            spatialReference: metadata.extent?.spatialReference ?? null,
            lastEditDate: metadata.editingInfo?.lastEditDate ?? null,
            fields: (metadata.fields ?? []).map((f) => ({ name: f.name, alias: f.alias, type: f.type })),
            features: data.features ?? [],
            exceededTransferLimit: Boolean(data.exceededTransferLimit),
            sourceUrl: base,
          },
        };
      } catch (error) {
        results[index] = {
          error: { service: service.group, layerId: layer.id, error: error.message },
        };
      }
      await sleep(300);
    }
  }

  await Promise.all(Array.from({ length: CONCURRENCY }, () => worker()));
  const layers = results.flatMap((result) => result?.layer ? [result.layer] : []);
  const errors = results.flatMap((result) => result?.error ? [result.error] : []);
  const routeLayers = layers.filter((layer) => layer.kind === "route");
  const stopLayers = layers.filter((layer) => layer.kind === "stops");
  const summary = {
    routeLayersExpected: SERVICES.reduce((sum, service) => sum + service.layers.filter((l) => l.kind === "route").length, 0),
    stopLayersExpected: SERVICES.reduce((sum, service) => sum + service.layers.filter((l) => l.kind === "stops").length, 0),
    routeLayersFetched: routeLayers.length,
    stopLayersFetched: stopLayers.length,
    routeFeatures: routeLayers.reduce((sum, layer) => sum + layer.features.length, 0),
    stopFeatures: stopLayers.reduce((sum, layer) => sum + layer.features.length, 0),
    layersWithTransferLimit: layers.filter((layer) => layer.exceededTransferLimit).map((layer) => layer.layerName),
    errors: errors.length,
    extractionConcurrency: CONCURRENCY,
  };
  const report = {
    generatedAt: new Date().toISOString(),
    attribution: "ArcGIS FeatureServer public layers discovered from DDD transport mapping services",
    policy: "Read-only extraction. Geometry and published stop attributes are candidates for comparison; no service frequency or passenger countdown is inferred.",
    summary,
    layers,
    errors,
  };
  await writeFile("artifacts/arcgis/ddd-route-stop-candidates.json", JSON.stringify(report, null, 2) + "\n");
  console.log(JSON.stringify(summary, null, 2));
  if (errors.length) console.log(JSON.stringify(errors, null, 2));
}
await main();
