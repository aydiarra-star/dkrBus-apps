import { readFile, writeFile } from "node:fs/promises";

const [inputPath = "artifacts/arcgis/ddd-updated-service-candidates.json",
  outputPath = "artifacts/arcgis/ddd-stop-route-spatial-projection.json"] = process.argv.slice(2);

const source = JSON.parse(await readFile(inputPath, "utf8"));
const stopLayer = source.layers.find((layer) => layer.kind === "stops");
const routeLayer = source.layers.find((layer) => layer.kind === "routes");
if (!stopLayer || !routeLayer) throw new Error("ArcGIS stop or route layer missing");

const targetLines = ["217", "218", "219", "227", "228", "232"];

function lineKey(value) {
  return String(value ?? "")
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toUpperCase()
    .replace(/^\s*(?:LIGNE|L)\s*[_-]?\s*/u, "")
    .replace(/[^A-Z0-9]/gu, "");
}

function stopKey(value) {
  return String(value ?? "")
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLocaleLowerCase("fr")
    .replace(/^\s*(?:arret|arrêt|terminus)\s+/u, "")
    .replace(/[^a-z0-9]+/gu, " ")
    .trim()
    .replace(/\s+/gu, " ");
}

// The exporter converts both point and line geometries to WGS84 (longitude,
// latitude). A local equirectangular projection is adequate for metre-scale
// proximity screening inside Dakar; it is not used as a geodetic validation.
const referenceLatitude = 14.75;
const metresPerDegree = 111320;
const longitudeScale = Math.cos(referenceLatitude * Math.PI / 180);
const project = ([longitude, latitude]) => [
  longitude * metresPerDegree * longitudeScale,
  latitude * metresPerDegree,
];

function makeSegments(feature) {
  const segments = [];
  let chainage = 0;
  for (const path of feature.geometry?.paths ?? []) {
    for (let index = 1; index < path.length; index += 1) {
      const a = project(path[index - 1]);
      const b = project(path[index]);
      const length = Math.hypot(b[0] - a[0], b[1] - a[1]);
      if (!length) continue;
      segments.push({ a, b, chainage, length });
      chainage += length;
    }
  }
  return { segments, lengthMetres: chainage };
}

function projectStop(feature, segments) {
  const point = project([feature.geometry.x, feature.geometry.y]);
  let best = null;
  for (const segment of segments) {
    const dx = segment.b[0] - segment.a[0];
    const dy = segment.b[1] - segment.a[1];
    const t = Math.max(0, Math.min(1,
      ((point[0] - segment.a[0]) * dx + (point[1] - segment.a[1]) * dy)
      / (segment.length * segment.length)));
    const projected = [segment.a[0] + t * dx, segment.a[1] + t * dy];
    const distanceMetres = Math.hypot(point[0] - projected[0], point[1] - projected[1]);
    if (!best || distanceMetres < best.distanceMetres) {
      best = {
        distanceMetres,
        chainageMetres: segment.chainage + t * segment.length,
      };
    }
  }
  return best;
}

const routeByLine = new Map();
for (const feature of routeLayer.features ?? []) {
  const key = lineKey(feature.attributes?.Nom_Ligne);
  if (!key || !targetLines.includes(key)) continue;
  const geometry = makeSegments(feature);
  routeByLine.set(key, {
    line: key,
    sourceLineValue: feature.attributes?.Nom_Ligne ?? null,
    sourceRouteName: feature.attributes?.Itinérair ?? null,
    sourceGlobalId: feature.attributes?.GlobalID ?? null,
    sourceObjectId: feature.attributes?.OBJECTID ?? null,
    lengthMetres: geometry.lengthMetres,
    segments: geometry.segments,
  });
}

const stopRows = (stopLayer.features ?? []).map((feature, index) => ({
  sourceIndex: index + 1,
  sourceLineValue: feature.attributes?.Nom_Ligne ?? null,
  line: lineKey(feature.attributes?.Nom_Ligne),
  name: String(feature.attributes?.Nom_Arret ?? "").trim() || null,
  nameKey: stopKey(feature.attributes?.Nom_Arret),
  sourceGlobalId: feature.attributes?.GlobalID ?? null,
  sourceObjectId: feature.attributes?.OBJECTID ?? null,
  geometry: feature.geometry ?? null,
})).filter((row) => targetLines.includes(row.line) && row.geometry
  && Number.isFinite(row.geometry.x) && Number.isFinite(row.geometry.y));

const comparisons = [];
for (const line of targetLines) {
  const rows = stopRows.filter((row) => row.line === line);
  const sameLineRoute = routeByLine.get(line);
  const projectedRows = rows.map((row) => {
    const candidates = [...routeByLine.values()].map((route) => {
      const projected = projectStop({ geometry: row.geometry }, route.segments);
      return {
        routeLine: route.line,
        distanceMetres: projected?.distanceMetres ?? null,
        chainageMetres: projected?.chainageMetres ?? null,
      };
    }).filter((candidate) => candidate.distanceMetres !== null)
      .sort((a, b) => a.distanceMetres - b.distanceMetres);
    const ownRoute = sameLineRoute
      ? candidates.find((candidate) => candidate.routeLine === line) ?? null
      : null;
    return {
      sourceIndex: row.sourceIndex,
      sourceObjectId: row.sourceObjectId,
      sourceGlobalId: row.sourceGlobalId,
      sourceLineValue: row.sourceLineValue,
      stopName: row.name,
      ownRouteDistanceMetres: ownRoute?.distanceMetres ?? null,
      ownRouteChainageMetres: ownRoute?.chainageMetres ?? null,
      nearestRouteCandidates: candidates.slice(0, 3),
    };
  });

  const coordinateNameCounts = new Map();
  for (const row of rows) {
    const key = [
      row.nameKey,
      Number(row.geometry.x).toFixed(7),
      Number(row.geometry.y).toFixed(7),
    ].join("|");
    coordinateNameCounts.set(key, (coordinateNameCounts.get(key) ?? 0) + 1);
  }
  const repeatedCoordinateNameGroups = [...coordinateNameCounts.entries()]
    .filter(([, count]) => count > 1)
    .map(([key, count]) => ({ key, count }));

  const distances = projectedRows.map((row) => row.ownRouteDistanceMetres)
    .filter((value) => value !== null);
  const sortedDistances = [...distances].sort((a, b) => a - b);
  const nearestRouteCounts = {};
  for (const row of projectedRows) {
    const nearest = row.nearestRouteCandidates[0];
    if (nearest && nearest.distanceMetres <= 25) {
      nearestRouteCounts[nearest.routeLine] = (nearestRouteCounts[nearest.routeLine] ?? 0) + 1;
    }
  }

  comparisons.push({
    line,
    sourceFeatureCount: rows.length,
    namedFeatureCount: rows.filter((row) => row.name).length,
    routeGeometryFound: Boolean(sameLineRoute),
    routeGeometry: sameLineRoute ? {
      sourceLineValue: sameLineRoute.sourceLineValue,
      sourceRouteName: sameLineRoute.sourceRouteName,
      sourceGlobalId: sameLineRoute.sourceGlobalId,
      sourceObjectId: sameLineRoute.sourceObjectId,
      lengthMetres: sameLineRoute.lengthMetres,
    } : null,
    sameLineRouteProximity: {
      within25m: distances.filter((value) => value <= 25).length,
      within100m: distances.filter((value) => value <= 100).length,
      medianDistanceMetres: sortedDistances.length
        ? sortedDistances[Math.floor(sortedDistances.length / 2)] : null,
      maximumDistanceMetres: sortedDistances.length ? sortedDistances.at(-1) : null,
    },
    nearestRouteCountsWithin25m: nearestRouteCounts,
    repeatedNameCoordinateGroups: repeatedCoordinateNameGroups,
    stopsOrderedByRouteChainage: projectedRows
      .filter((row) => row.ownRouteChainageMetres !== null)
      .sort((a, b) => a.ownRouteChainageMetres - b.ownRouteChainageMetres),
    stopProjections: projectedRows,
    interpretation: "Projection and chainage are geometric diagnostics only. Chainage direction is not a validated passenger direction. Nearest-route counts are candidates, not automatic line reassignment. All source records and repeated records are retained.",
  });
}

const report = {
  generatedAt: new Date().toISOString(),
  source: {
    attribution: source.attribution ?? null,
    generatedAt: source.generatedAt,
    stopLayerId: stopLayer.layerId,
    routeLayerId: routeLayer.layerId,
    stopLayerName: stopLayer.layerName,
    routeLayerName: routeLayer.layerName,
  },
  method: "Each stop point is projected onto each available target route polyline in a local metre-scale projection. Per-route chainage sorts points along the geometry solely for audit. Distances are approximate and must not be interpreted as operator validation.",
  safeguards: [
    "No source stop or route is modified, deleted, merged, or reassigned.",
    "No direction is inferred from polyline orientation.",
    "No missing line 219 stops or line 228 route identity is fabricated.",
    "Duplicate source records remain separate and are reported.",
    "No timetable, frequency, passenger catalogue, Supabase write, or deployment.",
  ],
  summary: {
    linesAudited: comparisons.length,
    sourceStops: comparisons.reduce((sum, row) => sum + row.sourceFeatureCount, 0),
    linesWithMatchingNamedRouteGeometry: comparisons.filter((row) => row.routeGeometryFound).length,
    totalStopsWithin25mOfOwnLineGeometry: comparisons.reduce((sum, row) => sum + row.sameLineRouteProximity.within25m, 0),
    totalStopsWithin100mOfOwnLineGeometry: comparisons.reduce((sum, row) => sum + row.sameLineRouteProximity.within100m, 0),
  },
  comparisons,
};

await writeFile(outputPath, JSON.stringify(report, null, 2) + "\n");
console.log(JSON.stringify(report.summary, null, 2));
