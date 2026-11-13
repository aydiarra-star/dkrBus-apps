#!/usr/bin/env node
import fs from 'node:fs';

const [osmPath, arcgisPath, relationIdArg, layerIdArg, outputPath] = process.argv.slice(2);
if (!osmPath || !arcgisPath || !relationIdArg || !layerIdArg || !outputPath) {
  console.error('Usage: node scripts/export_ddd_osm_way_arcgis_stop_proximity.mjs <osm.json> <arcgis.json> <relationId> <layerId> <output.csv>');
  process.exit(2);
}

const osm = JSON.parse(fs.readFileSync(osmPath, 'utf8'));
const arcgis = JSON.parse(fs.readFileSync(arcgisPath, 'utf8'));
const relationId = Number(relationIdArg);
const layerId = Number(layerIdArg);
const route = osm.routes.find((item) => item.osmRelationId === relationId);
const layer = arcgis.layers.find((item) => item.layerId === layerId && item.kind === 'stops');
if (!route) throw new Error(`OSM relation ${relationId} not found`);
if (!layer) throw new Error(`ArcGIS stop layer ${layerId} not found`);

const ways = (route.orderedWayMembers || []).filter((way) => Array.isArray(way.geometry) && way.geometry.length >= 2);
if (!ways.length) throw new Error(`OSM relation ${relationId} has no usable ordered way geometry`);
const points = (layer.features || []).filter((feature) => Number.isFinite(feature.geometry?.x) && Number.isFinite(feature.geometry?.y));
if (!points.length) throw new Error(`ArcGIS stop layer ${layerId} has no geolocated features`);

// WGS84 to UTM zone 28N (Dakar), so distances are measured in metres.
const a = 6378137;
const flattening = 1 / 298.257223563;
const eccentricitySquared = flattening * (2 - flattening);
const secondEccentricitySquared = eccentricitySquared / (1 - eccentricitySquared);
const k0 = 0.9996;
const centralMeridian = (-15 * Math.PI) / 180;
const project = (lat, lon) => {
  const phi = (lat * Math.PI) / 180;
  const lambda = (lon * Math.PI) / 180;
  const sinPhi = Math.sin(phi);
  const cosPhi = Math.cos(phi);
  const tanPhi = Math.tan(phi);
  const n = a / Math.sqrt(1 - eccentricitySquared * sinPhi ** 2);
  const t = tanPhi ** 2;
  const c = secondEccentricitySquared * cosPhi ** 2;
  const aa = cosPhi * (lambda - centralMeridian);
  const e2 = eccentricitySquared;
  const m = a * ((1 - e2 / 4 - 3 * e2 ** 2 / 64 - 5 * e2 ** 3 / 256) * phi
    - (3 * e2 / 8 + 3 * e2 ** 2 / 32 + 45 * e2 ** 3 / 1024) * Math.sin(2 * phi)
    + (15 * e2 ** 2 / 256 + 45 * e2 ** 3 / 1024) * Math.sin(4 * phi)
    - (35 * e2 ** 3 / 3072) * Math.sin(6 * phi));
  const x = 500000 + k0 * n * (aa + (1 - t + c) * aa ** 3 / 6
    + (5 - 18 * t + t ** 2 + 72 * c - 58 * secondEccentricitySquared) * aa ** 5 / 120);
  const y = k0 * (m + n * tanPhi * (aa ** 2 / 2
    + (5 - t + 9 * c + 4 * c ** 2) * aa ** 4 / 24
    + (61 - 58 * t + t ** 2 + 600 * c - 330 * secondEccentricitySquared) * aa ** 6 / 720));
  return { x, y };
};

function pointSegmentDistance(point, start, end) {
  const dx = end.x - start.x;
  const dy = end.y - start.y;
  const lengthSquared = dx * dx + dy * dy;
  if (lengthSquared === 0) return Math.hypot(point.x - start.x, point.y - start.y);
  const t = Math.max(0, Math.min(1, ((point.x - start.x) * dx + (point.y - start.y) * dy) / lengthSquared));
  return Math.hypot(point.x - (start.x + t * dx), point.y - (start.y + t * dy));
}

const projectedWays = ways.map((way) => ({
  ...way,
  points: way.geometry.map((point) => project(point.lat, point.lon)),
}));
const csvCell = (value) => {
  const text = value == null ? '' : String(value);
  return `"${text.replaceAll('"', '""')}"`;
};
const columns = [
  'operator', 'line', 'osm_relation_id', 'osm_ref', 'osm_route_name', 'osm_from', 'osm_to',
  'osm_way_sequence', 'osm_way_id', 'arcgis_layer_id', 'arcgis_layer_name',
  'arcgis_objectid', 'arcgis_stop_name', 'distance_m', 'proximity_band', 'review_status',
];
const rows = [columns.map(csvCell).join(',')];

for (const feature of points) {
  const point = project(feature.geometry.y, feature.geometry.x);
  let nearest = null;
  for (const way of projectedWays) {
    for (let index = 1; index < way.points.length; index += 1) {
      const distance = pointSegmentDistance(point, way.points[index - 1], way.points[index]);
      if (!nearest || distance < nearest.distance) {
        nearest = { distance, waySequence: way.sequence, wayId: way.ref };
      }
    }
  }
  const distance = nearest.distance;
  const band = distance <= 25 ? '<=25m' : distance <= 50 ? '25-50m' : distance <= 100 ? '50-100m' : '>100m';
  const values = [
    route.operator || 'DDD', route.ref || '', route.osmRelationId, route.ref, route.name,
    route.from, route.to, nearest.waySequence, nearest.wayId, layer.layerId,
    layer.layerName, feature.attributes?.OBJECTID, feature.attributes?.Nom_Arret,
    distance.toFixed(1), band, 'GEOMETRY_CANDIDATE',
  ];
  rows.push(values.map(csvCell).join(','));
}

fs.writeFileSync(outputPath, `${rows.join('\n')}\n`, 'utf8');
const bands = Object.fromEntries(['<=25m', '25-50m', '50-100m', '>100m'].map((band) => [
  band,
  points.filter((feature) => {
    const point = project(feature.geometry.y, feature.geometry.x);
    let minimum = Infinity;
    for (const way of projectedWays) {
      for (let index = 1; index < way.points.length; index += 1) {
        minimum = Math.min(minimum, pointSegmentDistance(point, way.points[index - 1], way.points[index]));
      }
    }
    return band === '<=25m' ? minimum <= 25
      : band === '25-50m' ? minimum > 25 && minimum <= 50
        : band === '50-100m' ? minimum > 50 && minimum <= 100 : minimum > 100;
  }).length,
]));
console.log(JSON.stringify({
  relationId, layerId, orderedWays: ways.length, arcgisPoints: points.length, bands, outputPath,
}, null, 2));
