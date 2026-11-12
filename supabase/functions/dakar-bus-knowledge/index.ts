import { withSupabase } from "npm:@supabase/server";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "apikey, authorization, content-type, x-client-info",
  "Content-Type": "application/json; charset=utf-8",
  "Cache-Control": "no-store",
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: corsHeaders });

const allowedNetworks = new Set(["ter", "brt", "ddd", "aftu", "tata"]);
const activeStatuses = ["candidate", "verified", "published"];
const emptyResult = { data: [] as any[], error: null };

function sanitizeTrafficSources(rows: any[]) {
  return rows.map((source) => ({
    id: source.id,
    name: source.name,
    source_type: source.source_type,
    url: source.url,
    status: source.status,
    polling_interval_seconds: source.polling_interval_seconds ?? null,
    last_checked_at: source.last_checked_at ?? null,
    integration_method: source.integration_method ?? null,
    requires_credentials: source.requires_credentials ?? false,
    metadata: {
      last_feed_item_count: source.metadata?.last_feed_item_count ?? null,
      last_traffic_candidate_count: source.metadata?.last_traffic_candidate_count ?? null,
      last_error: source.metadata?.last_error ?? null,
      public_realtime_api_verified: source.metadata?.public_realtime_api_verified ?? false,
    },
  }));
}

async function fetchPaged(makeQuery: () => any, maxPages = 20) {
  const all: any[] = [];
  for (let page = 0; page < maxPages; page++) {
    const { data, error } = await makeQuery().range(page * 1000, page * 1000 + 999);
    if (error) return { data: null, error };
    const batch = data ?? [];
    all.push(...batch);
    if (batch.length < 1000) break;
  }
  return { data: all, error: null };
}

const readKnowledge = withSupabase(
  { auth: "publishable" },
  async (req, ctx) => {
    if (req.method !== "GET") return json({ error: "METHOD_NOT_ALLOWED" }, 405);

    const url = new URL(req.url);
    const network = (url.searchParams.get("network") ?? "").toLowerCase();
    const q = (url.searchParams.get("q") ?? "").trim().toLocaleLowerCase("fr");
    const requestedLine = (url.searchParams.get("line") ?? "").trim().toLocaleLowerCase("fr");
    const includeSources = false; // Public knowledge endpoint never exposes raw repository source contents.

    if (network && !allowedNetworks.has(network)) {
      return json({ error: "INVALID_NETWORK", allowed: [...allowedNetworks] }, 400);
    }
    if (q.length > 100) return json({ error: "QUERY_TOO_LONG" }, 400);

    const db = ctx.supabaseAdmin;
    if (url.searchParams.get("traffic_only") === "1") {
      const [trafficSourcesResult, confirmedResult, candidatesResult] = await Promise.all([
        db.from("traffic_sources")
          .select("id,name,source_type,url,status,polling_interval_seconds,metadata,last_checked_at,integration_method,requires_credentials")
          .order("name"),
        db.from("traffic_incidents")
          .select("id,title,description,incident_type,severity,status,area_label,observed_at,confirmed_at,expires_at,source_url,source_published_at,traffic_source_id")
          .eq("status", "confirmed").order("observed_at", { ascending: false }).limit(100),
        db.from("traffic_incidents")
          .select("id,title,description,incident_type,severity,status,area_label,observed_at,expires_at,source_url,source_published_at,traffic_source_id")
          .in("status", ["unverified", "reported"]).order("observed_at", { ascending: false }).limit(100),
      ]);
      const failed = [trafficSourcesResult, confirmedResult, candidatesResult].find((result) => result.error);
      if (failed?.error) {
        console.error("traffic_read_failed", failed.error.message);
        return json({ error: "TRAFFIC_READ_FAILED" }, 500);
      }
      const now = Date.now();
      const active = (rows: any[]) => rows.filter((row) =>
        !row.expires_at || new Date(row.expires_at).getTime() > now
      );
      const confirmed = active(confirmedResult.data ?? []);
      const candidates = active(candidatesResult.data ?? []);
      return json({
        generated_at: new Date().toISOString(),
        source_of_truth: "Supabase PostgreSQL",
        realtime: false,
        traffic_only: true,
        alert_policy: "Seuls les incidents confirmés sont des alertes. Les articles de presse et signalements non vérifiés restent des pistes.",
        confirmed_traffic_incidents: confirmed,
        traffic_candidates: candidates,
        traffic_sources: sanitizeTrafficSources(trafficSourcesResult.data ?? []),
        counts: {
          confirmed_active_incidents: confirmed.length,
          unverified_traffic_candidates: candidates.length,
          configured_sources: (trafficSourcesResult.data ?? []).length,
        },
      });
    }
    if (url.searchParams.get("transfer_only") === "1") {
      const [networksResult, linesResult, directionsResult, lineStopsResult, stopsResult, transfersResult] = await Promise.all([
        db.from("mobility_networks").select("id,code,name").order("code"),
        db.from("mobility_lines").select("id,network_id,code,status").in("status", activeStatuses).limit(2000),
        db.from("mobility_directions").select("id,line_id,status").in("status", activeStatuses).limit(4000),
        fetchPaged(() => db.from("mobility_line_stops").select("direction_id,stop_id")),
        fetchPaged(() => db.from("mobility_stops").select("id,canonical_name,location")),
        db.from("mobility_transfers")
          .select("id,from_stop_id,to_stop_id,walking_distance_m,walking_duration_seconds,accessibility_status,status")
          .in("status", activeStatuses).limit(200),
      ]);
      const failed = [networksResult, linesResult, directionsResult, lineStopsResult, stopsResult, transfersResult].find((result) => result.error);
      if (failed?.error) {
        console.error("transfer_read_failed", failed.error.message);
        return json({ error: "TRANSFER_READ_FAILED" }, 500);
      }
      const networkById = new Map((networksResult.data ?? []).map((row: any) => [row.id, row]));
      const lineById = new Map((linesResult.data ?? []).map((row: any) => [row.id, row]));
      const directionById = new Map((directionsResult.data ?? []).map((row: any) => [row.id, row]));
      const stopById = new Map((stopsResult.data ?? []).map((row: any) => [row.id, row]));
      const shared = new Map<string, { stop_id: string; canonical_name: string; network_codes: Set<string>; line_codes: Set<string>; geocoded: boolean }>();
      for (const row of lineStopsResult.data ?? []) {
        const direction = directionById.get(row.direction_id);
        const line = direction ? lineById.get(direction.line_id) : null;
        const network = line ? networkById.get(line.network_id) : null;
        const stop = stopById.get(row.stop_id);
        if (!line || !network || !stop?.canonical_name) continue;
        const item = shared.get(row.stop_id) ?? {
          stop_id: row.stop_id,
          canonical_name: stop.canonical_name,
          network_codes: new Set<string>(),
          line_codes: new Set<string>(),
          geocoded: Boolean(stop.location),
        };
        item.network_codes.add(network.code);
        item.line_codes.add(`${network.code.toUpperCase()} ${line.code}`);
        shared.set(row.stop_id, item);
      }
      const allSharedStops = [...shared.values()].filter((row) => row.network_codes.size > 1);
      const sharedStops = allSharedStops
        .filter((row) => row.geocoded)
        .map((row) => ({
          stop_id: row.stop_id,
          canonical_name: row.canonical_name,
          network_codes: [...row.network_codes].sort(),
          line_codes: [...row.line_codes].sort(),
          geocoded: true,
          status: "candidate",
        }))
        .sort((a, b) => a.canonical_name.localeCompare(b.canonical_name, "fr"));
      const explicitTransfers = (transfersResult.data ?? []).map((row: any) => ({
        id: row.id,
        from_stop: { id: row.from_stop_id, canonical_name: stopById.get(row.from_stop_id)?.canonical_name ?? "Arrêt non renseigné" },
        to_stop: { id: row.to_stop_id, canonical_name: stopById.get(row.to_stop_id)?.canonical_name ?? "Arrêt non renseigné" },
        from_network_codes: [...(shared.get(row.from_stop_id)?.network_codes ?? [])].sort(),
        to_network_codes: [...(shared.get(row.to_stop_id)?.network_codes ?? [])].sort(),
        walking_distance_m: row.walking_distance_m,
        walking_duration_seconds: row.walking_duration_seconds,
        accessibility_status: row.accessibility_status,
        status: row.status,
      }));
      return json({
        generated_at: new Date().toISOString(),
        source_of_truth: "Supabase PostgreSQL / PostGIS",
        realtime: false,
        transfer_only: true,
        transfers: explicitTransfers,
        shared_stops: sharedStops,
        counts: {
          explicit_transfers: explicitTransfers.length,
          shared_stop_candidates: sharedStops.length,
          unlocated_shared_stop_names: allSharedStops.length - sharedStops.length,
        },
        policy: "Les arrêts partagés par plusieurs réseaux sont des points de correspondance potentiels. La distance piétonne, l'accès physique et l'accessibilité ne sont confirmés que par une fiche de transfert vérifiée.",
      });
    }
    if (url.searchParams.get("catalogue_only") === "1") {
      const [networksResult, catalogueResult] = await Promise.all([
        db.from("mobility_networks").select("id,code,name,mode,operator_name,status").order("code"),
        db.from("mobility_catalog_records")
          .select("id,network_code,line_code,origin_label,destination_label,source_url,detail_source_url,source_consulted_at,source_published_at,raw_record,status,imported_at")
          .order("network_code").order("line_code").limit(250),
      ]);
      if (networksResult.error || catalogueResult.error) {
        console.error("catalogue_read_failed", networksResult.error?.message ?? catalogueResult.error?.message);
        return json({ error: "CATALOGUE_READ_FAILED" }, 500);
      }
      const networks = (networksResult.data ?? []).filter((row) => !network || row.code === network);
      const catalogue = (catalogueResult.data ?? []).filter((row) => {
        if (network && row.network_code !== network) return false;
        if (!q) return true;
        return [row.line_code, row.origin_label, row.destination_label, JSON.stringify(row.raw_record)]
          .join(" ").toLocaleLowerCase("fr").includes(q);
      });
      return json({
        generated_at: new Date().toISOString(),
        source_of_truth: "Supabase PostgreSQL / PostGIS",
        realtime: false,
        catalogue_only: true,
        publication_policy: "Les fiches sont des candidates jusqu'à validation et publication.",
        networks,
        catalogue,
        counts: { networks: networks.length, catalogue_records: catalogue.length },
        query: { network: network || null, q: q || null },
      });
    }
    const [
      networksResult, linesResult, catalogResult, stopsResult, directionsResult,
      statsResult, sourcesResult, trafficSourcesResult, incidentsResult, candidateIncidentsResult,
      observationsResult, assertionsResult, snapshotsResult,
    ] = await Promise.all([
      db.from("mobility_networks").select("id,code,name,mode,operator_name,status").order("code"),
      db.from("mobility_lines")
        .select("id,network_id,code,public_name,status,dataset_version_id,source_id,valid_from,valid_until")
        .in("status", activeStatuses).order("code").limit(1000),
      db.from("mobility_catalog_records")
        .select("id,network_code,line_code,origin_label,destination_label,source_url,detail_source_url,source_consulted_at,source_published_at,raw_record,status,imported_at")
        .order("network_code").order("line_code").limit(1000),
      fetchPaged(() => db.from("mobility_stops")
        .select("id,canonical_name,aliases,location,status,external_ref,reference_metadata,source_id")
        .order("canonical_name")),
      db.from("mobility_directions")
        .select("id,line_id,direction_code,origin_label,destination_label,status,dataset_version_id,source_id,direction_method,direction_notes,mobility_lines(id,code,network_id,status,dataset_version_id)")
        .in("status", activeStatuses).order("direction_code").limit(2000),
      db.from("mobility_network_statistics")
        .select("network_id,metric_code,metric_value,unit,observed_at,notes").order("metric_code"),
      db.from("mobility_sources")
        .select("id,name,source_type,url,reliability_level,rights_note,created_at").order("name"),
      db.from("traffic_sources")
        .select("id,name,source_type,url,status,polling_interval_seconds,metadata,created_at,last_checked_at,integration_method,requires_credentials").order("name"),
      db.from("traffic_incidents")
        .select("id,title,description,incident_type,severity,status,area_label,observed_at,confirmed_at,expires_at,location,traffic_source_id,source_url,source_published_at")
        .eq("status", "confirmed").order("observed_at", { ascending: false }).limit(100),
      db.from("traffic_incidents")
        .select("id,title,description,incident_type,severity,status,area_label,observed_at,expires_at,source_url,source_published_at,traffic_source_id")
        .in("status", ["unverified", "reported"]).order("observed_at", { ascending: false }).limit(100),
      db.from("traffic_observations")
        .select("id,traffic_source_id,observed_at,collected_at,coverage_status,content_hash")
        .order("observed_at", { ascending: false }).limit(100),
      db.from("mobility_data_assertions")
        .select("id,subject_type,subject_id,predicate,value_json,source_id,status,observed_at,valid_from,valid_until,verified_by,dataset_version_id")
        .in("status", activeStatuses).order("observed_at", { ascending: false }).limit(1000),
      db.from("mobility_reference_snapshots")
        .select(includeSources
          ? "source_path,source_blob_sha,repository_commit,network_scope,notes,imported_at,source_content"
          : "source_path,source_blob_sha,repository_commit,network_scope,notes,imported_at")
        .order("source_path"),
    ]);

    const initialResults = [
      networksResult, linesResult, catalogResult, stopsResult, directionsResult,
      statsResult, sourcesResult, trafficSourcesResult, incidentsResult, candidateIncidentsResult,
      observationsResult, assertionsResult, snapshotsResult,
    ];
    const failedInitial = initialResults.find((result) => result.error);
    if (failedInitial?.error) {
      console.error("knowledge_read_failed", failedInitial.error.message);
      return json({ error: "KNOWLEDGE_READ_FAILED" }, 500);
    }

    const networks = networksResult.data ?? [];
    const selectedNetworks = networks.filter((row) => !network || row.code === network);
    const networkIds = new Set(selectedNetworks.map((row) => row.id));
    const lines = (linesResult.data ?? []).filter((row) =>
      networkIds.has(row.network_id)
      && (!requestedLine || row.code.toLocaleLowerCase("fr") === requestedLine)
      && (!q || [row.code, row.public_name].join(" ").toLocaleLowerCase("fr").includes(q))
    );
    const lineIds = new Set(lines.map((row) => row.id));
    const catalog = (catalogResult.data ?? []).filter((row) =>
      (!network || row.network_code === network)
      && (!requestedLine || row.line_code.toLocaleLowerCase("fr") === requestedLine)
    );
    const searchedCatalog = q
      ? catalog.filter((row) => [
          row.line_code, row.origin_label, row.destination_label, JSON.stringify(row.raw_record),
        ].join(" ").toLocaleLowerCase("fr").includes(q))
      : catalog;

    // Archived line snapshots are excluded; derived return directions stay explicit.
    const directions = (directionsResult.data ?? []).filter((row) =>
      lineIds.has(row.line_id) && row.mobility_lines &&
      activeStatuses.includes(row.mobility_lines.status)
    );
    const directionIds = directions.map((row) => row.id);
    const directionSet = new Set(directionIds);

    const [lineStopsResult, patternsResult, tripsResult, calendarsResult, shapesResult] =
      await Promise.all([
        directionIds.length
          ? fetchPaged(() => db.from("mobility_line_stops")
              .select("id,direction_id,stop_id,stop_sequence,source_id,verified_at")
              .in("direction_id", directionIds).order("stop_sequence"))
          : Promise.resolve(emptyResult),
        directionIds.length
          ? db.from("mobility_service_patterns")
              .select("id,direction_id,pattern_type,service_start,service_end,headway_minutes,headway_min_minutes,headway_max_minutes,expected_wait_minutes,period_label,service_start_earliest,service_start_latest,service_end_earliest,service_end_latest,days_of_week,source_id,status,valid_from,valid_until,notes")
              .in("direction_id", directionIds).order("service_start").limit(3000)
          : Promise.resolve(emptyResult),
        directionIds.length
          ? db.from("mobility_trips")
              .select("id,direction_id,calendar_id,trip_code,headsign,departure_time,arrival_time,service_kind,status,source_id,dataset_version_id")
              .in("direction_id", directionIds).in("status", activeStatuses).limit(5000)
          : Promise.resolve(emptyResult),
        db.from("mobility_service_calendars")
          .select("id,network_id,service_code,monday,tuesday,wednesday,thursday,friday,saturday,sunday,start_date,end_date,source_id,dataset_version_id")
          .limit(1000),
        directionIds.length
          ? db.from("mobility_shapes")
              .select("id,direction_id,geometry,status,source_id,dataset_version_id,observed_at")
              .in("direction_id", directionIds).in("status", activeStatuses).limit(1000)
          : Promise.resolve(emptyResult),
      ]);

    const nestedResults = [lineStopsResult, patternsResult, tripsResult, calendarsResult, shapesResult];
    const failedNested = nestedResults.find((result) => result.error);
    if (failedNested?.error) {
      console.error("knowledge_detail_read_failed", failedNested.error.message);
      return json({ error: "KNOWLEDGE_DETAIL_READ_FAILED" }, 500);
    }

    const orderedStops = lineStopsResult.data ?? [];
    const stopIds = [...new Set(orderedStops.map((row) => row.stop_id))];
    const stopById = new Map((stopsResult.data ?? []).map((row) => [row.id, row]));
    const tripRows = tripsResult.data ?? [];
    const tripIds = tripRows.map((row) => row.id);
    const calendarRows = (calendarsResult.data ?? []).filter((row) => networkIds.has(row.network_id));
    const calendarIds = [...new Set([
      ...tripRows.map((row) => row.calendar_id).filter(Boolean),
      ...calendarRows.map((row) => row.id),
    ])];

    const [stopTimesResult, exceptionsResult, transfersResult, impactsResult] = await Promise.all([
      tripIds.length
        ? db.from("mobility_stop_times")
            .select("id,trip_id,stop_id,stop_sequence,arrival_time,departure_time,pickup_allowed,dropoff_allowed")
            .in("trip_id", tripIds).order("stop_sequence").limit(20000)
        : Promise.resolve(emptyResult),
      calendarIds.length
        ? db.from("mobility_calendar_exceptions")
            .select("id,calendar_id,exception_date,exception_type,note,source_id")
            .in("calendar_id", calendarIds).limit(3000)
        : Promise.resolve(emptyResult),
      stopIds.length
        ? db.from("mobility_transfers")
            .select("id,from_stop_id,to_stop_id,walking_distance_m,walking_duration_seconds,accessibility_status,status,source_id,transfer_type,label,notes")
            .in("status", activeStatuses).limit(3000)
        : Promise.resolve(emptyResult),
      (incidentsResult.data ?? []).length
        ? db.from("traffic_incident_impacts")
            .select("id,incident_id,network_id,line_id,impact_type,description")
            .in("incident_id", (incidentsResult.data ?? []).map((row) => row.id))
        : Promise.resolve(emptyResult),
    ]);
    const finalResults = [stopTimesResult, exceptionsResult, transfersResult, impactsResult];
    const failedFinal = finalResults.find((result) => result.error);
    if (failedFinal?.error) {
      console.error("knowledge_graph_read_failed", failedFinal.error.message);
      return json({ error: "KNOWLEDGE_GRAPH_READ_FAILED" }, 500);
    }

    const stopTimes = stopTimesResult.data ?? [];
    const calendarIdSet = new Set(calendarRows.map((row) => row.id));
    const calendarExceptions = (exceptionsResult.data ?? []).filter((row) => calendarIdSet.has(row.calendar_id));
    const transferRows = (transfersResult.data ?? []).filter((row) =>
      stopIds.includes(row.from_stop_id) || stopIds.includes(row.to_stop_id)
    );
    const transferStopIds = new Set(transferRows.flatMap((row) => [row.from_stop_id, row.to_stop_id]));
    const activeStops = (stopsResult.data ?? []).filter((row) =>
      stopIds.includes(row.id) || transferStopIds.has(row.id)
    );
    const referenceStops = requestedLine ? [] : activeStops.filter((row) => !q || [
      row.canonical_name, ...(row.aliases ?? []),
    ].join(" ").toLocaleLowerCase("fr").includes(q));
    const orderedStopsWithNames = orderedStops.map((row) => ({
      ...row, stop: stopById.get(row.stop_id) ?? null,
    }));
    const lineById = new Map(lines.map((row) => [row.id, row]));
    const networkById = new Map(selectedNetworks.map((row) => [row.id, row]));
    const directionById = new Map(directions.map((row) => [row.id, row]));
    const membershipMap = new Map<string, {
      stop_id: string;
      canonical_name: string | null;
      network_codes: Set<string>;
      line_codes: Set<string>;
      direction_codes: Set<string>;
      has_geolocation: boolean;
    }>();
    for (const row of orderedStops) {
      const direction = directionById.get(row.direction_id);
      const line = direction ? lineById.get(direction.line_id) : null;
      const networkRow = line ? networkById.get(line.network_id) : null;
      if (!line || !networkRow) continue;
      const stop = stopById.get(row.stop_id);
      const current = membershipMap.get(row.stop_id) ?? {
        stop_id: row.stop_id,
        canonical_name: stop?.canonical_name ?? null,
        network_codes: new Set<string>(),
        line_codes: new Set<string>(),
        direction_codes: new Set<string>(),
        has_geolocation: Boolean(stop?.location),
      };
      current.network_codes.add(networkRow.code);
      current.line_codes.add(`${networkRow.code.toUpperCase()} ${line.code}`);
      current.direction_codes.add(direction.direction_code);
      membershipMap.set(row.stop_id, current);
    }
    const stopNetworkMemberships = Array.from(membershipMap.values()).map((item) => ({
      stop_id: item.stop_id,
      canonical_name: item.canonical_name,
      network_codes: Array.from(item.network_codes).sort(),
      line_codes: Array.from(item.line_codes).sort(),
      direction_codes: Array.from(item.direction_codes).sort(),
      has_geolocation: item.has_geolocation,
      interchange_status: item.network_codes.size > 1
        ? (item.has_geolocation ? "shared_reference_geolocated_candidate" : "shared_name_reference_only")
        : "single_network_reference",
      physical_interchange_verified: false,
    }));
    const transfers = transferRows.map((row) => ({
      ...row,
      from_stop: stopById.get(row.from_stop_id) ?? null,
      to_stop: stopById.get(row.to_stop_id) ?? null,
    }));
    const incidents = (incidentsResult.data ?? []).filter((incident) =>
      !incident.expires_at || new Date(incident.expires_at).getTime() > Date.now()
    );
    const trafficCandidates = (candidateIncidentsResult.data ?? []).filter((incident) =>
      !incident.expires_at || new Date(incident.expires_at).getTime() > Date.now()
    );
    const snapshots = (snapshotsResult.data ?? []).filter((row) =>
      !network || (row.network_scope ?? []).includes(network)
    );
    const assertions = (assertionsResult.data ?? []).filter((row) =>
      !network || row.value_json?.network_code === network
    );

    if (url.searchParams.get("graph_only") === "1") {
      return json({
        generated_at: new Date().toISOString(),
        source_of_truth: "Supabase PostgreSQL / PostGIS",
        realtime: false,
        graph_only: true,
        network: network || null,
        publication_policy: "Les sens retour dérivés et les correspondances non vérifiées restent explicitement candidats.",
        networks: selectedNetworks,
        lines,
        directions,
        ordered_line_stops: orderedStopsWithNames,
        reference_stops: referenceStops,
        stop_network_memberships: stopNetworkMemberships,
        service_patterns: patternsResult.data ?? [],
        transfers,
        data_assertions: assertions,
        mobility_sources: sourcesResult.data ?? [],
        counts: {
          networks: selectedNetworks.length,
          lines: lines.length,
          directions: directions.length,
          ordered_line_stops: orderedStopsWithNames.length,
          reference_stops: referenceStops.length,
          shared_stop_references: stopNetworkMemberships.filter((item) => item.network_codes.length > 1).length,
          service_patterns: (patternsResult.data ?? []).length,
          transfers: transfers.length,
          data_assertions: assertions.length,
        },
      });
    }

    return json({
      generated_at: new Date().toISOString(),
      source_of_truth: "Supabase PostgreSQL / PostGIS",
      realtime: false,
      publication_policy: "Les lignes et arrêts importés restent candidats jusqu'à validation. Les sens retour dérivés sont explicitement identifiés et ne doivent pas être traités comme des itinéraires confirmés.",
      networks: selectedNetworks,
      lines,
      catalogue: searchedCatalog,
      reference_stops: referenceStops,
      directions,
      ordered_line_stops: orderedStopsWithNames,
      stop_network_memberships: stopNetworkMemberships,
      service_patterns: patternsResult.data ?? [],
      trips: tripRows,
      stop_times: stopTimes,
      service_calendars: calendarRows,
      calendar_exceptions: calendarExceptions,
      shapes: shapesResult.data ?? [],
      transfers,
      network_statistics: (statsResult.data ?? []).filter((row) => networkIds.has(row.network_id)),
      data_assertions: assertions,
      mobility_sources: sourcesResult.data ?? [],
      traffic_sources: sanitizeTrafficSources(trafficSourcesResult.data ?? []),
      traffic_observations: observationsResult.data ?? [],
      confirmed_traffic_incidents: incidents,
      traffic_candidates: trafficCandidates,
      traffic_incident_impacts: impactsResult.data ?? [],
      reference_snapshots: snapshots,
      counts: {
        networks: selectedNetworks.length,
        lines: lines.length,
        candidate_catalogue_records: catalog.length,
        matching_catalogue_records: searchedCatalog.length,
        reference_stops: referenceStops.length,
        directions: directions.length,
        ordered_line_stops: orderedStopsWithNames.length,
        shared_stop_references: stopNetworkMemberships.filter((item) => item.network_codes.length > 1).length,
        service_patterns: (patternsResult.data ?? []).length,
        trips: tripRows.length,
        stop_times: stopTimes.length,
        transfers: transfers.length,
        confirmed_active_incidents: incidents.length,
        unverified_traffic_candidates: trafficCandidates.length,
      },
      query: { network: network || null, q: q || null, include_sources: includeSources },
    });
  },
);

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  return await readKnowledge(req);
});
