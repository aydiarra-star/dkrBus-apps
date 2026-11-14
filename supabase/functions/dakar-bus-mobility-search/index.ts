import { withSupabase } from "npm:@supabase/server";

const ACTIVE = ["candidate", "verified", "published"];
const ALLOWED_NETWORKS = new Set(["ddd", "aftu", "tata"]);
const HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "apikey, authorization, content-type, x-client-info",
  "Content-Type": "application/json; charset=utf-8",
  "Cache-Control": "no-store",
};
const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: HEADERS });

async function fetchAll<T>(
  makeQuery: (from: number, to: number) => PromiseLike<{ data: T[] | null; error: { message: string } | null }>,
  pageSize = 1000,
): Promise<T[]> {
  const rows: T[] = [];
  for (let offset = 0; offset < 20000; offset += pageSize) {
    const { data, error } = await makeQuery(offset, offset + pageSize - 1);
    if (error) throw new Error(error.message);
    const page = data ?? [];
    rows.push(...page);
    if (page.length < pageSize) break;
  }
  return rows;
}

const search = withSupabase({ auth: "publishable" }, async (req, ctx) => {
  if (req.method !== "GET") return json({ error: "METHOD_NOT_ALLOWED" }, 405);
  const url = new URL(req.url);
  const q = (url.searchParams.get("q") ?? "").trim().toLocaleLowerCase("fr");
  const network = (url.searchParams.get("network") ?? "").trim().toLowerCase();
  if (!q) return json({ error: "QUERY_REQUIRED", example: "?q=Colobane&network=ter" }, 400);
  if (q.length > 100) return json({ error: "QUERY_TOO_LONG" }, 400);
  if (network && !ALLOWED_NETWORKS.has(network)) {
    return json({ error: "INVALID_NETWORK", allowed: [...ALLOWED_NETWORKS] }, 400);
  }

  try {
    const db = ctx.supabaseAdmin;
    const [networks, lines, directions, stops, lineStops, patterns, transfers] = await Promise.all([
      db.from("mobility_networks").select("id,code,name,mode,status").order("code"),
      fetchAll((from, to) => db.from("mobility_lines")
        .select("id,network_id,code,public_name,status,dataset_version_id,source_id")
        .in("status", ACTIVE).order("code").range(from, to)),
      fetchAll((from, to) => db.from("mobility_directions")
        .select("id,line_id,direction_code,origin_label,destination_label,status,direction_method,dataset_version_id,source_id")
        .in("status", ACTIVE).order("direction_code").range(from, to)),
      fetchAll((from, to) => db.from("mobility_stops")
        .select("id,canonical_name,aliases,status,external_ref,reference_metadata")
        .in("status", ACTIVE).order("canonical_name").range(from, to)),
      fetchAll((from, to) => db.from("mobility_line_stops")
        .select("direction_id,stop_id,stop_sequence,source_id,verified_at")
        .order("stop_sequence").range(from, to)),
      fetchAll((from, to) => db.from("mobility_service_patterns")
        .select("id,direction_id,pattern_type,period_label,service_start,service_end,headway_minutes,headway_min_minutes,headway_max_minutes,expected_wait_minutes,days_of_week,status,service_start_earliest,service_start_latest,service_end_earliest,service_end_latest,notes,dataset_version_id,source_id")
        .in("status", ACTIVE).range(from, to)),
      db.from("mobility_transfers")
        .select("id,from_stop_id,to_stop_id,walking_distance_m,walking_duration_seconds,accessibility_status,status,transfer_type,label,notes")
        .in("status", ACTIVE).limit(3000),
    ]);

    const failed = [networks, transfers].find((r) => r.error);
    if (failed?.error) throw new Error(failed.error.message);

    const networkRows = networks.data ?? [];
    const selectedNetworks = networkRows.filter((n) => !network || n.code === network);
    const networkIds = new Set(selectedNetworks.map((n) => n.id));
    const selectedLines = lines.filter((line) => networkIds.has(line.network_id));
    const lineById = new Map(selectedLines.map((line) => [line.id, line]));
    const selectedDirections = directions.filter((d) => lineById.has(d.line_id));
    const stopById = new Map(stops.map((stop) => [stop.id, stop]));
    const lineStopsByDirection = new Map<string, typeof lineStops>();
    for (const row of lineStops) {
      const current = lineStopsByDirection.get(row.direction_id) ?? [];
      current.push(row);
      lineStopsByDirection.set(row.direction_id, current);
    }

    const stopMatches = new Set(stops.filter((stop) => [
      stop.canonical_name,
      ...(Array.isArray(stop.aliases) ? stop.aliases : []),
    ].join(" ").toLocaleLowerCase("fr").includes(q)).map((stop) => stop.id));

    const directLineMatches = new Set(selectedLines.filter((line) =>
      [line.code, line.public_name].join(" ").toLocaleLowerCase("fr").includes(q)
    ).map((line) => line.id));

    const matchingDirections = selectedDirections.filter((direction) => {
      const line = lineById.get(direction.line_id);
      const directionText = [
        direction.direction_code, direction.origin_label, direction.destination_label,
        line?.code, line?.public_name,
      ].join(" ").toLocaleLowerCase("fr");
      if (directLineMatches.has(direction.line_id) || directionText.includes(q)) return true;
      return (lineStopsByDirection.get(direction.id) ?? [])
        .some((row) => stopMatches.has(row.stop_id));
    }).sort((a, b) => {
      const lineA = lineById.get(a.line_id), lineB = lineById.get(b.line_id);
      return (lineA?.code ?? "").localeCompare(lineB?.code ?? "", "fr") ||
        a.direction_code.localeCompare(b.direction_code, "fr");
    });

    const MAX_DIRECTIONS = 100;
    const truncated = matchingDirections.length > MAX_DIRECTIONS;
    const returnedDirections = matchingDirections.slice(0, MAX_DIRECTIONS);
    const returnedDirectionIds = new Set(returnedDirections.map((d) => d.id));
    const returnedLineIds = new Set(returnedDirections.map((d) => d.line_id));
    const returnedLines = selectedLines.filter((line) => returnedLineIds.has(line.id));
    const returnedLineStops = lineStops.filter((row) => returnedDirectionIds.has(row.direction_id));
    const returnedStopIds = [...new Set(returnedLineStops.map((row) => row.stop_id))];

    const coordinatesResult = returnedStopIds.length
      ? await db.rpc("get_mobility_stop_coordinates", { p_stop_ids: returnedStopIds })
      : { data: [], error: null };
    if (coordinatesResult.error) throw new Error(coordinatesResult.error.message);
    const coordinates = new Map<string, { latitude: number | null; longitude: number | null }>();
    for (const row of (coordinatesResult.data ?? []) as any[]) {
      coordinates.set(String(row.stop_id), {
        latitude: typeof row.latitude === "number" ? row.latitude : null,
        longitude: typeof row.longitude === "number" ? row.longitude : null,
      });
    }

    const orderedStops = new Map<string, any[]>();
    for (const row of returnedLineStops) {
      const stop = stopById.get(row.stop_id);
      const coordinate = coordinates.get(row.stop_id) ?? null;
      const items = orderedStops.get(row.direction_id) ?? [];
      items.push({
        sequence: row.stop_sequence,
        stop_id: row.stop_id,
        name: stop?.canonical_name ?? null,
        aliases: stop?.aliases ?? [],
        latitude: coordinate?.latitude ?? null,
        longitude: coordinate?.longitude ?? null,
        status: stop?.status ?? null,
        verified_at: row.verified_at,
      });
      orderedStops.set(row.direction_id, items);
    }

    const returnedPatterns = patterns.filter((p) => returnedDirectionIds.has(p.direction_id));
    const transferRows = (transfers.data ?? []).filter((t) =>
      returnedStopIds.includes(t.from_stop_id) || returnedStopIds.includes(t.to_stop_id)
    );

    const lineSummary = returnedLines.map((line) => ({
      ...line,
      network: selectedNetworks.find((n) => n.id === line.network_id) ?? null,
    }));
    const directionSummary = returnedDirections.map((direction) => ({
      ...direction,
      line: lineById.get(direction.line_id) ?? null,
      ordered_stops: (orderedStops.get(direction.id) ?? []).sort((a, b) => a.sequence - b.sequence),
      service_patterns: returnedPatterns.filter((p) => p.direction_id === direction.id),
    }));

    return json({
      generated_at: new Date().toISOString(),
      source_of_truth: "Supabase PostgreSQL / PostGIS",
      realtime: false,
      query: { q, network: network || null },
      policy: "Les données candidates et les sens retour dérivés restent explicitement identifiés. TER/BRT sont exclus de cette recherche et restent traités par le référentiel local validé. Aucun horaire temps réel n'est inventé.",
      networks: selectedNetworks,
      lines: lineSummary,
      directions: directionSummary,
      transfers: transferRows,
      counts: {
        matching_lines: lineSummary.length,
        matching_directions: directionSummary.length,
        ordered_stop_links: returnedLineStops.length,
        stops_with_coordinates: returnedStopIds.filter((id) => coordinates.has(id)).length,
        service_patterns: returnedPatterns.length,
        matching_transfers: transferRows.length,
      },
      truncated,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "UNKNOWN_ERROR";
    console.error("mobility_search_failed", message);
    return json({ error: "MOBILITY_SEARCH_FAILED" }, 500);
  }
});

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: HEADERS });
  return await search(req);
});
