import { mkdir, writeFile } from "node:fs/promises";

const BBOX = "(14.55,-17.56,14.91,-17.12)";
const ENDPOINTS = [
  "https://overpass-api.de/api/interpreter",
  "https://overpass.kumi.systems/api/interpreter",
];
const OUTPUT = "artifacts/osm/dakar-osm-route-candidates.json";
const QUERY = `[out:json][timeout:180];
(
  relation["type"="route"]["route"="bus"]${BBOX};
  relation["type"="route_master"]["route_master"="bus"]${BBOX};
);
out body geom;
`;

async function fetchOverpass(endpoint) {
  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
      "User-Agent": "DakarBus-readonly-route-audit/1.1",
    },
    body: new URLSearchParams({ data: QUERY }),
    signal: AbortSignal.timeout(210000),
  });
  if (!response.ok) throw new Error(`${endpoint}: HTTP ${response.status}`);
  return response.json();
}

function centerOfWay(geometry = []) {
  if (!geometry.length) return null;
  const points = geometry.filter((p) => Number.isFinite(p.lat) && Number.isFinite(p.lon));
  if (!points.length) return null;
  return {
    lat: points.reduce((sum, p) => sum + p.lat, 0) / points.length,
    lon: points.reduce((sum, p) => sum + p.lon, 0) / points.length,
  };
}

async function main() {
  await mkdir("artifacts/osm", { recursive: true });
  let data;
  let usedEndpoint;
  const errors = [];
  for (const endpoint of ENDPOINTS) {
    try {
      console.log(`Querying OSM bus relations via ${endpoint}`);
      data = await fetchOverpass(endpoint);
      usedEndpoint = endpoint;
      break;
    } catch (error) {
      errors.push({ endpoint, error: error.message });
    }
  }
  if (!data) throw new Error(`All Overpass endpoints failed: ${JSON.stringify(errors)}`);

  const elements = data.elements ?? [];
  const relations = elements.filter((element) => element.type === "relation");
  const routeMasters = relations.filter((relation) => relation.tags?.type === "route_master");
  const routeRelations = relations.filter((relation) => relation.tags?.type === "route");
  const routeRows = routeRelations.map((relation) => {
    const members = (relation.members ?? []).map((member, index) => {
      const role = member.role ?? "";
      const isStop = /^(stop|platform|stop_entry_only|stop_exit_only|platform_entry_only|platform_exit_only)$/i.test(role);
      const coordinates = member.type === "node"
        ? { lat: member.lat ?? null, lon: member.lon ?? null }
        : member.type === "way" ? centerOfWay(member.geometry) : null;
      return {
        sequence: index + 1,
        type: member.type,
        ref: member.ref,
        role,
        isStopOrPlatform: isStop,
        name: member.tags?.name ?? null,
        coordinates,
        geometry: member.geometry ?? null,
      };
    });
    const stopMembers = members.filter((member) => member.isStopOrPlatform);
    const routeGeometry = members.filter((member) => member.type === "way" && member.geometry);
    return {
      osmRelationId: relation.id,
      name: relation.tags?.name ?? null,
      ref: relation.tags?.ref ?? null,
      operator: relation.tags?.operator ?? null,
      network: relation.tags?.network ?? null,
      from: relation.tags?.from ?? null,
      to: relation.tags?.to ?? null,
      via: relation.tags?.via ?? null,
      direction: relation.tags?.direction ?? null,
      route: relation.tags?.route ?? null,
      tags: relation.tags ?? {},
      orderedStopMembers: stopMembers,
      stopMemberCount: stopMembers.length,
      orderedWayMembers: routeGeometry,
      allMembers: members,
      source: "OpenStreetMap route relation via Overpass API",
    };
  });

  const report = {
    generatedAt: new Date().toISOString(),
    geographicBounds: BBOX,
    attribution: "© OpenStreetMap contributors, ODbL",
    endpoint: usedEndpoint,
    method: "Direct Overpass query for type=route + route=bus and type=route_master + route_master=bus; relation member order and roles preserved.",
    warnings: [
      "OSM is a community-maintained geographic source, not proof of current operator service.",
      "No timetable or frequency is inferred from OSM.",
      "Only mapped stop/platform relation members are extracted as ordered stop candidates.",
      "Missing directions are not fabricated; route masters and direction tags are retained for matching.",
      "The query is limited to the Dakar metropolitan bounding box.",
    ],
    elements,
    routeMasters: routeMasters.map((relation) => ({
      osmRelationId: relation.id,
      name: relation.tags?.name ?? null,
      ref: relation.tags?.ref ?? null,
      operator: relation.tags?.operator ?? null,
      tags: relation.tags ?? {},
      members: relation.members ?? [],
    })),
    routes: routeRows,
    endpointErrors: errors,
    summary: {
      totalOsmElements: elements.length,
      routeRelations: routeRows.length,
      routeMasterRelations: routeMasters.length,
      relationsWithOrderedStops: routeRows.filter((route) => route.stopMemberCount > 0).length,
      orderedStopMembers: routeRows.reduce((sum, route) => sum + route.stopMemberCount, 0),
      routeRelationsWithNoStops: routeRows.filter((route) => route.stopMemberCount === 0).length,
      distinctOperators: [...new Set(routeRows.map((route) => route.operator).filter(Boolean))],
      distinctNetworks: [...new Set(routeRows.map((route) => route.network).filter(Boolean))],
    },
  };
  await writeFile(OUTPUT, JSON.stringify(report, null, 2) + "\n");
  console.log(JSON.stringify(report.summary, null, 2));
  console.log(`Read-only OSM route audit saved to ${OUTPUT}`);
}
await main();
