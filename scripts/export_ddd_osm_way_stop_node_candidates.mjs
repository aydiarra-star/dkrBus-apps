#!/usr/bin/env node
import fs from 'node:fs';

const [osmPath, relationIdArg, outputPath, radiusArg = '100'] = process.argv.slice(2);
if (!osmPath || !relationIdArg || !outputPath) {
  console.error('Usage: node scripts/export_ddd_osm_way_stop_node_candidates.mjs <osm.json> <relationId> <output.csv> [radiusMeters]');
  process.exit(2);
}
const osm = JSON.parse(fs.readFileSync(osmPath, 'utf8'));
const relationId = Number(relationIdArg);
const radiusMeters = Number(radiusArg);
const route = osm.routes.find((item) => item.osmRelationId === relationId);
if (!route) throw new Error(`OSM relation ${relationId} not found`);
const ways = (route.orderedWayMembers || []).filter((way) => Array.isArray(way.geometry) && way.geometry.length >= 2);
if (!ways.length) throw new Error(`OSM relation ${relationId} has no ordered way geometry`);

// WGS84 to UTM zone 28N (Dakar).
const a = 6378137;
const flattening = 1 / 298.257223563;
const e2 = flattening * (2 - flattening);
const ep2 = e2 / (1 - e2);
const k0 = 0.9996;
const centralMeridian = (-15 * Math.PI) / 180;
const project = (lat, lon) => {
  const phi = (lat * Math.PI) / 180;
  const lambda = (lon * Math.PI) / 180;
  const sin = Math.sin(phi);
  const cos = Math.cos(phi);
  const tan = Math.tan(phi);
  const n = a / Math.sqrt(1 - e2 * sin ** 2);
  const t = tan ** 2;
  const c = ep2 * cos ** 2;
  const aa = cos * (lambda - centralMeridian);
  const m = a * ((1 - e2 / 4 - 3 * e2 ** 2 / 64 - 5 * e2 ** 3 / 256) * phi
    - (3 * e2 / 8 + 3 * e2 ** 2 / 32 + 45 * e2 ** 3 / 1024) * Math.sin(2 * phi)
    + (15 * e2 ** 2 / 256 + 45 * e2 ** 3 / 1024) * Math.sin(4 * phi)
    - (35 * e2 ** 3 / 3072) * Math.sin(6 * phi));
  return {
    x: 500000 + k0 * n * (aa + (1 - t + c) * aa ** 3 / 6
      + (5 - 18 * t + t ** 2 + 72 * c - 58 * ep2) * aa ** 5 / 120),
    y: k0 * (m + n * tan * (aa ** 2 / 2
      + (5 - t + 9 * c + 4 * c ** 2) * aa ** 4 / 24
      + (61 - 58 * t + t ** 2 + 600 * c - 330 * ep2) * aa ** 6 / 720)),
  };
};
function nearestOnSegment(point, start, end) {
  const dx = end.x - start.x;
  const dy = end.y - start.y;
  const lengthSquared = dx * dx + dy * dy;
  const t = lengthSquared === 0 ? 0 : Math.max(0, Math.min(1,
    ((point.x - start.x) * dx + (point.y - start.y) * dy) / lengthSquared));
  return { distance: Math.hypot(point.x - (start.x + t * dx), point.y - (start.y + t * dy)), t };
}
const projectedWays = ways.map((way) => ({
  ...way,
  points: way.geometry.map((point) => project(point.lat, point.lon)),
}));
const targetRef = String(route.ref ?? '').replace(/^L/i, '').trim().toLowerCase();
const nodes = (osm.elements || []).filter((element) => {
  if (element.type !== 'node' || !element.tags || !Number.isFinite(element.lat) || !Number.isFinite(element.lon)) return false;
  const tags = element.tags;
  const isStop = tags.highway === 'bus_stop' || ['platform', 'stop_position'].includes(tags.public_transport);
  const hasNetworkEvidence = tags.operator || tags.network || tags.ref || tags.route_ref;
  return isStop && hasNetworkEvidence && tags.network !== 'SunuBRT'
    && (tags.operator === 'Dakar Dem Dikk' || tags.network === 'Dakar Dem Dikk' || tags.ref || tags.route_ref);
});
const columns = [
  'operator', 'line', 'osm_relation_id', 'osm_route_name', 'osm_from', 'osm_to',
  'osm_node_id', 'osm_node_name', 'osm_operator', 'osm_network', 'osm_ref', 'osm_route_ref',
  'public_transport', 'highway', 'nearest_way_sequence', 'nearest_way_id',
  'distance_m', 'classification', 'review_status',
];
const cell = (value) => `"${String(value ?? '').replaceAll('"', '""')}"`;
const accepted = [];
for (const node of nodes) {
  const point = project(node.lat, node.lon);
  let nearest = null;
  for (const way of projectedWays) {
    for (let index = 1; index < way.points.length; index += 1) {
      const match = nearestOnSegment(point, way.points[index - 1], way.points[index]);
      if (!nearest || match.distance < nearest.distance) {
        nearest = { ...match, waySequence: way.sequence, wayId: way.ref };
      }
    }
  }
  if (!nearest || nearest.distance > radiusMeters) continue;
  const tags = node.tags;
  const explicitValues = [tags.ref, tags.route_ref].filter(Boolean).map((value) => String(value).toLowerCase());
  const explicitTarget = explicitValues.some((value) => value === targetRef || value === `l${targetRef}`);
  const classification = explicitTarget ? 'EXPLICIT_TARGET_LINE_REF'
    : explicitValues.length ? 'EXPLICIT_OTHER_LINE_REF' : 'SHARED_DDD_STOP_CANDIDATE';
  accepted.push({
    operator: 'DDD', line: route.ref, osm_relation_id: route.osmRelationId,
    osm_route_name: route.name, osm_from: route.from, osm_to: route.to,
    osm_node_id: node.id, osm_node_name: tags.name, osm_operator: tags.operator,
    osm_network: tags.network, osm_ref: tags.ref, osm_route_ref: tags.route_ref,
    public_transport: tags.public_transport, highway: tags.highway,
    nearest_way_sequence: nearest.waySequence, nearest_way_id: nearest.wayId,
    distance_m: nearest.distance.toFixed(1), classification,
    review_status: 'UNVERIFIED_NODE_CANDIDATE',
  });
}
accepted.sort((left, right) => Number(left.nearest_way_sequence) - Number(right.nearest_way_sequence)
  || Number(left.distance_m) - Number(right.distance_m));
const csv = [
  columns.map(cell).join(','),
  ...accepted.map((item) => columns.map((column) => cell(item[column])).join(',')),
].join('\n') + '\n';
fs.writeFileSync(outputPath, csv, 'utf8');
console.log(JSON.stringify({
  relationId, targetLine: route.ref, orderedWays: ways.length, osmNodesExamined: nodes.length,
  candidateNodes: accepted.length,
  within25m: accepted.filter((item) => Number(item.distance_m) <= 25).length,
  within50m: accepted.filter((item) => Number(item.distance_m) <= 50).length,
  classifications: Object.fromEntries(['EXPLICIT_TARGET_LINE_REF', 'EXPLICIT_OTHER_LINE_REF', 'SHARED_DDD_STOP_CANDIDATE']
    .map((classification) => [classification, accepted.filter((item) => item.classification === classification).length])),
  radiusMeters, outputPath,
}, null, 2));
