import { createWriteStream } from "node:fs";
import { mkdir, readFile, rm } from "node:fs/promises";
import { Readable } from "node:stream";
import { pipeline } from "node:stream/promises";
import { spawn } from "node:child_process";

const bbox = "-17.56,14.55,-17.12,14.91";
const pbfUrl = "https://download.geofabrik.de/africa/senegal-and-gambia-latest.osm.pbf";
const work = "artifacts/osm";
const supabaseUrl = "https://mdmuxzaewqzqutkqdylo.supabase.co";
const publishableKey = process.env.DAKAR_BUS_PUBLISHABLE_KEY;
const oidcRequestUrl = process.env.ACTIONS_ID_TOKEN_REQUEST_URL;
const oidcRequestToken = process.env.ACTIONS_ID_TOKEN_REQUEST_TOKEN;

if (!publishableKey || !oidcRequestUrl || !oidcRequestToken) {
  throw new Error("Missing GitHub OIDC or Supabase publishable credentials.");
}

const oidcUrl = new URL(oidcRequestUrl);
oidcUrl.searchParams.set("audience", "dakar-bus-ingest");
const oidcResponse = await fetch(oidcUrl, {
  headers: { Authorization: `Bearer ${oidcRequestToken}` },
});
const oidcBody = await oidcResponse.json();
if (!oidcResponse.ok || !oidcBody.value) throw new Error("GitHub OIDC token request failed.");
const oidcToken = oidcBody.value;

async function run(command, args) {
  await new Promise((resolve, reject) => {
    const child = spawn(command, args, { stdio: "inherit" });
    child.once("error", reject);
    child.once("exit", (code) => code === 0 ? resolve() : reject(new Error(`${command} exited with ${code}`)));
  });
}

await rm(work, { recursive: true, force: true });
await mkdir(work, { recursive: true });

console.log("Downloading the Geofabrik Senegal and Gambia extract...");
const response = await fetch(pbfUrl, { headers: { "User-Agent": "DakarBusOSMImporter/1.0" } });
if (!response.ok || !response.body) throw new Error(`Geofabrik download failed: HTTP ${response.status}`);
const pbfPath = `${work}/senegal-gambia.osm.pbf`;
// Wait for the file stream to finish before Osmium reads the downloaded PBF.
await pipeline(Readable.fromWeb(response.body), createWriteStream(pbfPath));

const regionPath = `${work}/dakar.osm.pbf`;
const filteredPath = `${work}/dakar-stops.osm.pbf`;
const geojsonPath = `${work}/dakar-stops.geojson`;

console.log("Extracting the Dakar bounding box...");
await run("osmium", ["extract", "--bbox", bbox, "--strategy", "complete_ways", "-o", regionPath, pbfPath, "--overwrite"]);
console.log("Filtering bus stops and platforms...");
await run("osmium", [
  "tags-filter",
  regionPath,
  "-o",
  filteredPath,
  "nw/highway=bus_stop",
  "nw/public_transport=platform",
  "nw/amenity=bus_station",
  "n/public_transport=stop_position",
  "n/public_transport=station",
  "--overwrite",
]);
console.log("Converting the filtered OSM data to GeoJSON with OSM identifiers...");
await run("osmium", [
  "export",
  "--attributes=type,id,version,timestamp",
  filteredPath,
  "-o",
  geojsonPath,
  "--overwrite",
]);

const geo = JSON.parse(await readFile(geojsonPath, "utf8"));
const flatten = (value, out = []) => {
  if (Array.isArray(value) && value.length >= 2 && typeof value[0] === "number" && typeof value[1] === "number") out.push(value);
  else if (Array.isArray(value)) for (const item of value) flatten(item, out);
  return out;
};
const elements = [];
for (const feature of geo.features ?? []) {
  const p = feature.properties ?? {};
  const type = String(p["@type"] ?? p.type ?? "");
  const id = Number(p["@id"] ?? p.id);
  const coords = flatten(feature.geometry?.coordinates);
  if (!["node", "way"].includes(type) || !Number.isSafeInteger(id) || !coords.length) continue;
  // Keep only bus-specific stop positions/stations; platforms and bus stops
  // are already explicitly selected by Osmium tags-filter.
  const isBusStop = p.highway === "bus_stop"
    || p.amenity === "bus_station"
    || p.public_transport === "platform"
    || ((p.public_transport === "stop_position" || p.public_transport === "station") && p.bus === "yes");
  if (!isBusStop) continue;
  const lon = coords.reduce((sum, c) => sum + c[0], 0) / coords.length;
  const lat = coords.reduce((sum, c) => sum + c[1], 0) / coords.length;
  if (lat < 14.55 || lat > 14.91 || lon < -17.56 || lon > -17.12) continue;
  const tags = Object.fromEntries(Object.entries(p).filter(([k, v]) => !k.startsWith("@") && typeof v === "string"));
  elements.push({
    type,
    id,
    lat,
    lon,
    tags,
    version: Number(p["@version"]) || undefined,
    timestamp: p["@timestamp"] || undefined,
  });
}

if (!elements.length) throw new Error("No valid bus stop/platform objects found in the Dakar extract.");
console.log(`Uploading ${elements.length} candidate objects in batches of 100...`);
let total = 0;
for (let offset = 0; offset < elements.length; offset += 100) {
  const batch = elements.slice(offset, offset + 100);
  const upload = await fetch(`${supabaseUrl}/functions/v1/dakar-bus-osm-stops-sync`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "apikey": publishableKey,
      "Authorization": `Bearer ${oidcToken}`,
    },
    body: JSON.stringify({ mode: "ingest_pbf_batch", elements: batch }),
  });
  const body = await upload.json().catch(() => ({}));
  if (!upload.ok || body.ok !== true) throw new Error(`Batch upload failed at offset ${offset}: HTTP ${upload.status} ${JSON.stringify(body)}`);
  total += Number(body.imported_bus_stop_objects ?? 0);
}
console.log(`Imported ${total} OSM candidate objects. Canonical stops and timetables were not changed.`);
