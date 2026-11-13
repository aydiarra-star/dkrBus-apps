import { readFile, writeFile, mkdir } from "node:fs/promises";

const input = "artifacts/osm/dakar-osm-route-candidates.json";
const output = "artifacts/osm/dakar-osm-directional-pairs.json";
const report = JSON.parse(await readFile(input, "utf8"));

function normalize(value) {
  return String(value ?? "")
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}
function routeRefs(route) {
  const values = [route.ref, route.tags?.ref].filter(Boolean);
  const refs = [];
  for (const value of values) {
    for (const token of String(value).split(/[;,]/)) {
      const compact = token.trim().toUpperCase().replace(/\s+/g, "");
      const match = compact.match(/^L?([A-Z]?\d{1,3}[A-Z]?)$/);
      if (match && !refs.includes(match[1])) refs.push(match[1]);
    }
  }
  return refs;
}
function leadingNameRef(route) {
  const match = String(route.name ?? "").match(/^\s*(?:ligne\s*)?(\d{1,3}[A-Z]?)\b/i);
  return match?.[1]?.toUpperCase() ?? null;
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
function haversineMeters(a, b) {
  const radians = (value) => value * Math.PI / 180;
  const dLat = radians(b.lat - a.lat);
  const dLon = radians(b.lon - a.lon);
  const lat1 = radians(a.lat), lat2 = radians(b.lat);
  const h = Math.sin(dLat / 2) ** 2
    + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;
  return 6371000 * 2 * Math.asin(Math.sqrt(h));
}
function stopPlatformPairs(stops) {
  const pairs = [];
  for (let index = 0; index < stops.length - 1; index += 1) {
    const stop = stops[index], platform = stops[index + 1];
    if (stop.role !== "stop" || platform.role !== "platform") continue;
    if (!stop.normalizedName || stop.normalizedName !== platform.normalizedName) continue;
    const a = stop.coordinates, b = platform.coordinates;
    if (![a?.lat, a?.lon, b?.lat, b?.lon].every(Number.isFinite)) continue;
    const distanceMeters = haversineMeters(a, b);
    if (distanceMeters > 30) continue;
    pairs.push({
      sequence: pairs.length + 1,
      name: stop.name,
      stopMember: { order: stop.order, osmType: stop.osmType, osmId: stop.osmId },
      platformMember: { order: platform.order, osmType: platform.osmType, osmId: platform.osmId },
      distanceMeters: Math.round(distanceMeters * 100) / 100,
    });
    index += 1;
  }
  return pairs;
}
function normalizeEndpoint(value) {
  return normalize(value).replace(/^(?:terminus|termibus)\s+/, "").replace(/\s+/g, "").trim();
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
function nameOverlap(a, b) {
  const namesA = [...new Set(a.map((s) => s.normalizedName).filter(Boolean))];
  const namesB = [...new Set(b.map((s) => s.normalizedName).filter(Boolean))];
  const setB = new Set(namesB);
  const shared = namesA.filter((name) => setB.has(name)).sort();
  const union = new Set([...namesA, ...namesB]);
  return {
    distinctNamedStopsA: namesA.length,
    distinctNamedStopsB: namesB.length,
    sharedDistinctNormalizedNames: shared,
    sharedDistinctNormalizedNameCount: shared.length,
    jaccardSimilarity: union.size ? Math.round(shared.length / union.size * 1000) / 1000 : 0,
  };
}

const routes = (report.routes ?? []).filter((r) => r.scopeStatus === "DAKAR_CANDIDATE");
const groups = new Map();
for (const route of routes) {
  for (const ref of routeRefs(route)) {
    const group = groups.get(ref) ?? [];
    group.push(route);
    groups.set(ref, group);
  }
}

const pairs = [];
const pairedRelationIds = new Set();
for (const [ref, members] of groups) {
  for (let i = 0; i < members.length; i += 1) {
    for (let j = i + 1; j < members.length; j += 1) {
      const a = members[i], b = members[j];
      const aStops = stopSequence(a), bStops = stopSequence(b);
      const aStopPlatformPairs = stopPlatformPairs(aStops);
      const bStopPlatformPairs = stopPlatformPairs(bStops);
      const reversedEndpoints = sameEndpointsReversed(a, b);
      const sharedMasterIds = (a.routeMasterRelations ?? [])
        .map((m) => m.osmRelationId)
        .filter((id) => (b.routeMasterRelations ?? []).some((m) => m.osmRelationId === id));
      const sharedStopIds = commonStopIds(aStops, bStops);
      if (!reversedEndpoints && !sharedMasterIds.length) continue;
      pairedRelationIds.add(a.osmRelationId);
      pairedRelationIds.add(b.osmRelationId);
      pairs.push({
        lineRef: ref,
        relationA: {
          osmRelationId: a.osmRelationId, name: a.name, from: a.from, to: a.to,
          operator: a.operator, network: a.network,
          stopMemberCount: aStops.length,
          stopPlatformPairCount: aStopPlatformPairs.length,
          orderedStops: aStops,
          orderedStopPlatformPairs: aStopPlatformPairs,
        },
        relationB: {
          osmRelationId: b.osmRelationId, name: b.name, from: b.from, to: b.to,
          operator: b.operator, network: b.network,
          stopMemberCount: bStops.length,
          stopPlatformPairCount: bStopPlatformPairs.length,
          orderedStops: bStops,
          orderedStopPlatformPairs: bStopPlatformPairs,
        },
        evidence: {
          reversedEndpoints,
          sharedRouteMasterRelationIds: sharedMasterIds,
          sharedStopMemberIds: sharedStopIds,
          sameOperator: normalize(a.operator) !== "" && normalize(a.operator) === normalize(b.operator),
          normalizedStopNameOverlap: nameOverlap(aStops, bStops),
        },
        assessment: reversedEndpoints ? "REVERSED_ENDPOINT_CANDIDATE" : "SHARED_ROUTE_MASTER_CANDIDATE",
        warning: "OSM directional evidence only; endpoint agreement alone does not validate stop sequence, operator identity, current service, or timetable.",
      });
    }
  }
}
pairs.sort((a, b) => Number(b.evidence.reversedEndpoints) - Number(a.evidence.reversedEndpoints)
  || Number(b.evidence.sharedRouteMasterRelationIds.length > 0) - Number(a.evidence.sharedRouteMasterRelationIds.length > 0)
  || Number(a.lineRef) - Number(b.lineRef));

// Keep candidate relations visible even when no safe inverse pair can be formed.
// This is especially important for partial/contradictory ref and endpoint metadata.
const unpairedRelations = routes.filter((route) => !pairedRelationIds.has(route.osmRelationId)).map((route) => {
  const refs = routeRefs(route);
  const nameRef = leadingNameRef(route);
  return {
    osmRelationId: route.osmRelationId,
    name: route.name ?? null,
    refs,
    nameLeadingRouteRef: nameRef,
    referenceConflict: Boolean(nameRef && refs.length && !refs.includes(nameRef)),
    from: route.from ?? null,
    to: route.to ?? null,
    operator: route.operator ?? null,
    network: route.network ?? null,
    orderedMemberCount: (route.orderedStopMembers ?? []).length,
    namedMemberCount: (route.orderedStopMembers ?? []).filter((member) => normalize(member.name)).length,
    reason: refs.length > 1
      ? "MULTIPLE_ROUTE_REFS"
      : !route.from || !route.to
        ? "MISSING_ENDPOINT_METADATA"
        : "NO_REVERSED_ENDPOINT_OR_SHARED_MASTER_MATCH",
    warning: "Unpaired OSM candidate only; not an operator-validated direction or complete route.",
  };
});

const summary = {
  source: "OpenStreetMap contributors via Overpass; © OSM contributors, ODbL",
  sourceGeneratedAt: report.generatedAt,
  dakarCandidateRelations: routes.length,
  candidateDirectionalPairs: pairs.length,
  reversedEndpointPairs: pairs.filter((p) => p.evidence.reversedEndpoints).length,
  sharedRouteMasterPairs: pairs.filter((p) => p.evidence.sharedRouteMasterRelationIds.length).length,
  stopPlatformPairCandidatesAcrossPairDirections: pairs.reduce((sum, pair) =>
    sum + pair.relationA.stopPlatformPairCount + pair.relationB.stopPlatformPairCount, 0),
  unpairedCandidateRelations: unpairedRelations.length,
  routeReferenceMetadataConflicts: unpairedRelations.filter((r) => r.referenceConflict).length,
  lineRefsWithPairs: [...new Set(pairs.map((p) => p.lineRef))],
  explicitWarnings: [
    "A pair is a candidate, not a validated operator route.",
    "Endpoint agreement alone does not establish that the ordered stop sequences match.",
    "Distinct normalized stop-name overlap is a comparison metric, not proof of physical stop identity.",
    "Relation member order is preserved independently for each direction.",
    "Raw OSM stop and platform members are preserved; adjacent same-name pairs within 30 m are separately identified.",
    "Unpaired candidates and route-ref/name conflicts remain visible in a separate diagnostic list.",
    "No missing direction, stop, frequency, or timetable is invented.",
    "No OSM relation is merged, reassigned, or used to overwrite operator data.",
  ],
};
await mkdir("artifacts/osm", { recursive: true });
await writeFile(output, JSON.stringify({ summary, pairs, unpairedRelations }, null, 2) + "\n");
console.log(JSON.stringify(summary, null, 2));
console.log("Directional pair audit saved to " + output);
