import { withSupabase } from "npm:@supabase/server";

const BBOX = "14.60,-17.56,14.84,-17.16";
const TILE_BBOXES: Record<string, string> = {
  central: "14.65,-17.50,14.78,-17.30",
  west: "14.60,-17.56,14.75,-17.40",
  east: "14.70,-17.35,14.84,-17.16",
  south: "14.60,-17.40,14.75,-17.16",
};
const ENDPOINTS = [
  "https://maps.mail.ru/osm/tools/overpass/api/interpreter",
  "https://overpass.private.coffee/api/interpreter",
  "https://overpass-api.de/api/interpreter",
];
const buildQuery = (bbox: string) => `[out:json][timeout:18];
(
  node["highway"="bus_stop"](${bbox});
  node["public_transport"="platform"](${bbox});
  node["public_transport"="stop_position"]["bus"="yes"](${bbox});
  way["public_transport"="platform"](${bbox});
);
out center tags meta;`;

const headers = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "apikey, authorization, content-type, x-client-info, x-dakar-bus-ingest-token",
  "Content-Type": "application/json; charset=utf-8",
  "Cache-Control": "no-store",
};
const reply = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers });

function pointOf(element: Record<string, any>) {
  if (typeof element.lat === "number" && typeof element.lon === "number") {
    return { lat: element.lat, lon: element.lon };
  }
  if (typeof element.center?.lat === "number" && typeof element.center?.lon === "number") {
    return { lat: element.center.lat, lon: element.center.lon };
  }
  return null;
}

const sync = withSupabase({ auth: "publishable" }, async (req, ctx) => {
  if (req.method !== "POST") return reply({ error: "METHOD_NOT_ALLOWED" }, 405);
  const db = ctx.supabaseAdmin;
  const token = req.headers.get("x-dakar-bus-ingest-token") ?? "";
  const { data: authorized, error: authError } = await db.rpc(
    "verify_dakar_bus_ingest_token", { p_token: token },
  );
  if (authError || authorized !== true) return reply({ error: "UNAUTHORIZED" }, 401);

  const { data: sources, error: sourceError } = await db.from("mobility_sources")
    .select("id").eq("name", "OpenStreetMap contributors").limit(1);
  if (sourceError || !sources?.length) return reply({ error: "OSM_SOURCE_NOT_REGISTERED" }, 500);
  const sourceId = sources[0].id;
  const requestBody = await req.json().catch(() => ({})) as { tile?: string };
  const tile = typeof requestBody.tile === "string" && Object.hasOwn(TILE_BBOXES, requestBody.tile)
    ? requestBody.tile
    : "full";
  const bbox = tile === "full" ? BBOX : TILE_BBOXES[tile];
  const query = buildQuery(bbox);

  try {
    let payload: any = null;
    let lastError = "No Overpass endpoint responded";
    for (const endpoint of ENDPOINTS) {
      try {
        const response = await fetch(endpoint, {
          method: "POST",
          headers: {
            "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8",
            "Accept": "application/json",
            "User-Agent": "DakarBusMobilityData/1.0 (+https://github.com/aydiarra-star/dkrBus-apps)",
          },
          body: new URLSearchParams({ data: query }),
          signal: AbortSignal.timeout(20_000),
        });
        if (!response.ok) {
          lastError = "OVERPASS_HTTP_" + response.status + " at " + new URL(endpoint).hostname;
          continue;
        }
        payload = await response.json();
        break;
      } catch (error) {
        lastError = new URL(endpoint).hostname + ": " + (error instanceof Error ? error.message : String(error));
      }
    }
    if (!payload) {
      console.error("overpass_unavailable", lastError);
      return reply({ error: "OVERPASS_UNAVAILABLE", details: lastError }, 502);
    }
    const elements = Array.isArray(payload?.elements) ? payload.elements : [];
    const importedAt = new Date().toISOString();
    const osmBaseTimestamp = payload.osm3s?.timestamp_osm_base ?? null;

    const rows = elements.flatMap((element: Record<string, any>) => {
      if (!["node", "way"].includes(element.type) || typeof element.id !== "number") return [];
      const point = pointOf(element);
      if (!point) return [];
      const lat = point.lat, lon = point.lon;
      if (lat < 14.60 || lat > 14.84 || lon < -17.56 || lon > -17.16) return [];
      const tags = element.tags ?? {};
      const name = String(tags["name:fr"] ?? tags.name ?? tags.ref ?? "").trim() || null;
      return [{
        osm_type: element.type,
        osm_id: element.id,
        name,
        location: `POINT(${lon} ${lat})`,
        tags,
        osm_version: typeof element.version === "number" ? element.version : null,
        osm_timestamp: element.timestamp ?? null,
        source_id: sourceId,
        source_url: `https://www.openstreetmap.org/${element.type}/${element.id}`,
        imported_at: importedAt,
      }];
    });

    if (!rows.length) {
      return reply({ ok: false, error: "NO_MAPPED_BUS_STOPS_FOUND", fetched_elements: elements.length }, 502);
    }

    let upserted = 0;
    for (let offset = 0; offset < rows.length; offset += 200) {
      const batch = rows.slice(offset, offset + 200);
      const { error } = await db.from("mobility_osm_stops")
        .upsert(batch, { onConflict: "osm_type,osm_id" });
      if (error) throw new Error("OSM_UPSERT_FAILED: " + error.message);
      upserted += batch.length;
    }

    const { data: matches, error: matchError } = await db.rpc("refresh_mobility_osm_stop_matches");
    if (matchError) throw new Error("MATCH_REFRESH_FAILED: " + matchError.message);

    return reply({
      ok: true,
      source: "OpenStreetMap contributors",
      attribution: "© OpenStreetMap contributors · ODbL",
      endpoint: ENDPOINT,
      osm_base_timestamp: osmBaseTimestamp,
      fetched_elements: elements.length,
      imported_bus_stop_objects: rows.length,
      upserted_objects: upserted,
      candidate_matches_created_or_refreshed: matches ?? 0,
      policy: "Les positions restent candidates dans une couche séparée ; aucune coordonnée canonique n'est remplacée automatiquement.",
      imported_at: importedAt,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "UNKNOWN_ERROR";
    console.error("osm_stop_sync_failed", message);
    return reply({ ok: false, error: "OSM_SYNC_FAILED", detail: message }, 502);
  }
});

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers });
  return await sync(req);
});
