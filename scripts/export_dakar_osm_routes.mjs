import { mkdir, writeFile } from "node:fs/promises";

const API = "https://openstreetmap.tools/public_transport_geojson/api";
const BBOX = { south: "14.55", west: "-17.56", north: "14.91", east: "-17.12" };
const SEARCH_TERMS = ["Dakar", "AFTU", "Dem Dikk", "TATA"];
const OUTPUT_DIR = "artifacts/osm";
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function getJson(url, label) {
  let lastError;
  for (let attempt = 1; attempt <= 4; attempt += 1) {
    try {
      const response = await fetch(url, {
        headers: { "User-Agent": "DakarBus-OSM-readonly-audit/1.0 (route research)" },
        signal: AbortSignal.timeout(45000),
      });
      if (response.status === 404) return { notFound: true };
      if (response.status === 429 || response.status >= 500) {
        await sleep(1500 * attempt);
        continue;
      }
      if (!response.ok) throw new Error(`${label}: HTTP ${response.status}`);
      return await response.json();
    } catch (error) {
      lastError = error;
      if (attempt < 4) await sleep(1000 * attempt);
    }
  }
  throw new Error(`${label}: ${lastError?.message ?? "request failed"}`);
}

async function search(term) {
  const params = new URLSearchParams({ q: term, mode: "bus", ...BBOX });
  const url = `${API}/search?${params}`;
  const result = await getJson(url, `OSM search ${term}`);
  return { term, url, ...(result ?? {}) };
}

async function main() {
  await mkdir(OUTPUT_DIR, { recursive: true });
  const searches = [];
  for (const term of SEARCH_TERMS) {
    console.log(`Searching OSM bus relations: ${term}`);
    searches.push(await search(term));
    await sleep(1100);
  }

  const discovered = new Map();
  for (const result of searches) {
    for (const route of result.routes ?? []) {
      if (Number.isSafeInteger(Number(route.id))) discovered.set(Number(route.id), route);
    }
  }

  const routeIds = new Set();
  const routeMasters = [];
  for (const item of discovered.values()) {
    if (item.type === "route_master") routeMasters.push(item);
    else if (item.type === "route") routeIds.add(Number(item.id));
  }

  // Expand route masters first so both directions/variants are included.
  const masterDetails = [];
  for (const master of routeMasters) {
    const detail = await getJson(`${API}/route_master/${master.id}`, `route_master ${master.id}`);
    masterDetails.push({ searchResult: master, detail });
    for (const route of detail.routes ?? []) {
      if (Number.isSafeInteger(Number(route.id))) routeIds.add(Number(route.id));
    }
    await sleep(250);
  }

  const routes = [];
  const routeErrors = [];
  const fetchedRouteIds = new Set();
  let pendingRouteIds = [...routeIds];
  while (pendingRouteIds.length) {
    const batch = pendingRouteIds.splice(0, 4).filter((id) => !fetchedRouteIds.has(id));
    if (!batch.length) continue;
    const results = await Promise.all(batch.map(async (id) => {
      fetchedRouteIds.add(id);
      try {
        const detail = await getJson(`${API}/route/${id}`, `route ${id}`);
        if (detail.notFound) return null;
        return {
          osmRelationId: id,
          name: detail.name ?? null,
          ref: detail.ref ?? null,
          from: detail.from ?? null,
          to: detail.to ?? null,
          stops: (detail.stops ?? []).map((stop, index) => ({
            sequence: index + 1,
            name: stop.name ?? null,
            lat: stop.lat ?? null,
            lon: stop.lon ?? null,
          })),
          stopCount: (detail.stops ?? []).length,
          geometry: detail.geojson?.features?.find((feature) => feature.geometry?.type === "LineString")?.geometry ?? null,
          siblingDirections: detail.other_directions ?? [],
          source: "OpenStreetMap relation via public_transport_geojson read-only API",
        };
      } catch (error) {
        routeErrors.push({ id, error: error.message });
        return null;
      }
    }));
    for (const route of results.filter(Boolean)) {
      routes.push(route);
      for (const sibling of route.siblingDirections) {
        const siblingId = Number(sibling.id);
        if (Number.isSafeInteger(siblingId) && !fetchedRouteIds.has(siblingId)) {
          routeIds.add(siblingId);
          pendingRouteIds.push(siblingId);
        }
      }
    }
    await sleep(500);
  }

  const report = {
    generatedAt: new Date().toISOString(),
    geographicBounds: BBOX,
    attribution: "© OpenStreetMap contributors, ODbL",
    method: "Read-only search of OSM route and route_master relations; stop order is preserved as returned by each relation.",
    warnings: [
      "OSM routes are community-mapped candidates, not proof of current operator service.",
      "No timetable or frequency is inferred from route geometry.",
      "A missing direction remains missing; no reverse route is fabricated.",
      "Search results are limited to the four metadata terms and the stated geographic bounds.",
    ],
    searches: searches.map(({ term, url, truncated, routes: found, error, message }) => ({
      term, url, resultCount: found?.length ?? 0, truncated: Boolean(truncated), error: error ?? null, message: message ?? null,
    })),
    discoveredRelations: [...discovered.values()],
    routeMasters: masterDetails,
    routes,
    routeErrors,
    summary: {
      searchTerms: SEARCH_TERMS.length,
      discoveredRelations: discovered.size,
      routeMasters: routeMasters.length,
      directionRelationsFetched: routes.length,
      totalOrderedStopEntries: routes.reduce((sum, route) => sum + route.stopCount, 0),
      routesWithNoStops: routes.filter((route) => route.stopCount === 0).length,
      failedRouteFetches: routeErrors.length,
      truncatedSearches: searches.filter((result) => result.truncated).map((result) => result.term),
    },
  };

  await writeFile(`${OUTPUT_DIR}/dakar-osm-route-candidates.json`, JSON.stringify(report, null, 2) + "\n");
  console.log(JSON.stringify(report.summary, null, 2));
  console.log(`Read-only OSM audit saved to ${OUTPUT_DIR}/dakar-osm-route-candidates.json`);
}

await main();
