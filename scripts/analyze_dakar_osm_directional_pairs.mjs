import { readFile, writeFile, mkdir } from "node:fs/promises";

const input = "artifacts/osm/dakar-osm-route-candidates.json";
const output = "artifacts/osm/dakar-osm-directional-pairs.json";
const report = JSON.parse(await readFile(input, "utf8"));

function normalize(value) {
  return String(value ?? "")
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}
function routeRef(route) {
  const values = [route.ref, route.tags?.ref].filter(Boolean);
  for (const value of values) {
    const match = String(value).match(/(?:^|[^0-9])(\d{1,3})(?:$|[^0-9])/);
    if (match) return match[1];
  }
  return null;
}
function stopSequence(route) {
  return (route.orderedStopMembers ?? []).map((stop, index) => ({
    order: index + 1,
    osmType: stop.type,
    osmId: stop.ref,
    name: stop.name ?? null,
    normalizedName: normalize(stop.name),
    role: stop.role,
    coordinates: stop.coordinates ?? null,
  }));
}
function normalizeEndpoint(value) {
  // OSM uses "Terminus", "Termibus" and bare place names inconsistently.
  // Remove only these leading transport-label prefixes; retain place qualifiers
  // such as Palais 1 vs Palais 2 so genuine terminal conflicts remain visible.
  return normalize(value).replace(/^(?:terminus|termibus)\\s+/, "").trim();
}
function sameEndpointsReversed(a, b) {
  const aFrom = normalizeEndpoint(a.from), aTo = normalizeEndpoint(a.to);
  const bFrom = normalizeEndpoint(b.from), bTo = normalizeEndpoint(b.to);
  return Boolean(aFrom && aTo && bFrom && bTo && aFrom === bTo && aTo === bFrom);
}
function commonStopIds(a, b) {
  const idsA = new Set(a.map((s) => s.osmType + ":" + s.osmId));
  return b.filter((s) => idsA.has(s.osmType + ":" + s.osmId))
    .map((s) => s.osmType + ":" + s.osmId);
}

const routes = (report.routes ?? []).filter((r) => r.scopeStatus === "DAKAR_CANDIDATE");
const groups = new Map();
for (const route of routes) {
  const ref = routeRef(route);
  if (!ref) continue;
  const group = groups.get(ref) ?? [];
  group.push(route);
  groups.set(ref, group);
}

const pairs = [];
for (const [ref, members] of groups) {
  for (let i = 0; i < members.length; i += 1) {
    for (let j = i + 1; j < members.length; j += 1) {
      const a = members[i], b = members[j];
      const aStops = stopSequence(a), bStops = stopSequence(b);
      const reversedEndpoints = sameEndpointsReversed(a, b);
      const sharedMasterIds = (a.routeMasterRelations ?? [])
        .map((m) => m.osmRelationId)
        .filter((id) => (b.routeMasterRelations ?? []).some((m) => m.osmRelationId === id));
      const sharedStopIds = commonStopIds(aStops, bStops);
      if (!reversedEndpoints && !sharedMasterIds.length) continue;
      pairs.push({
        lineRef: ref,
        relationA: {
          osmRelationId: a.osmRelationId, name: a.name, from: a.from, to: a.to,
          operator: a.operator, network: a.network, stopCount: aStops.length,
          orderedStops: aStops,
        },
        relationB: {
          osmRelationId: b.osmRelationId, name: b.name, from: b.from, to: b.to,
          operator: b.operator, network: b.network, stopCount: bStops.length,
          orderedStops: bStops,
        },
        evidence: {
          reversedEndpoints,
          sharedRouteMasterRelationIds: sharedMasterIds,
          sharedStopMemberIds: sharedStopIds,
          sameOperator: normalize(a.operator) !== "" && normalize(a.operator) === normalize(b.operator),
        },
        assessment: reversedEndpoints
          ? "REVERSED_ENDPOINT_CANDIDATE"
          : "SHARED_ROUTE_MASTER_CANDIDATE",
        warning: "OSM directional evidence only; not operator validation, current service confirmation, or timetable evidence.",
      });
    }
  }
}
pairs.sort((a, b) => Number(b.evidence.reversedEndpoints) - Number(a.evidence.reversedEndpoints)
  || Number(b.evidence.sharedRouteMasterRelationIds.length > 0) - Number(a.evidence.sharedRouteMasterRelationIds.length > 0)
  || Number(a.lineRef) - Number(b.lineRef));

const summary = {
  source: "OpenStreetMap contributors via Overpass; © OSM contributors, ODbL",
  sourceGeneratedAt: report.generatedAt,
  dakarCandidateRelations: routes.length,
  candidateDirectionalPairs: pairs.length,
  reversedEndpointPairs: pairs.filter((p) => p.evidence.reversedEndpoints).length,
  sharedRouteMasterPairs: pairs.filter((p) => p.evidence.sharedRouteMasterRelationIds.length).length,
  lineRefsWithPairs: [...new Set(pairs.map((p) => p.lineRef))],
  explicitWarnings: [
    "A pair is a candidate, not a validated operator route.",
    "Relation member order is preserved independently for each direction.",
    "No missing direction, stop, frequency, or timetable is invented.",
    "No OSM relation is merged, reassigned, or used to overwrite DDD operator data.",
  ],
};
await mkdir("artifacts/osm", { recursive: true });
await writeFile(output, JSON.stringify({ summary, pairs }, null, 2) + "\n");
console.log(JSON.stringify(summary, null, 2));
console.log("Directional pair audit saved to " + output);
