import { withSupabase } from "npm:@supabase/server";
import { XMLParser } from "npm:fast-xml-parser@4.5.3";

const SOURCE_NAME = "SeneNews · flux RSS";
const FEED_URL = "https://www.senenews.com/feed";
const MIN_INTERVAL_MS = 10 * 60 * 1000;
const MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;
const parser = new XMLParser({ ignoreAttributes: false, cdataPropName: "__cdata" });

const headers = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "apikey, authorization, content-type, x-client-info, x-dakar-bus-ingest-token",
  "Content-Type": "application/json; charset=utf-8",
  "Cache-Control": "no-store",
};
const reply = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers });

function clean(value: unknown): string {
  if (value == null) return "";
  const obj = typeof value === "object" ? value as Record<string, unknown> : null;
  const raw = obj ? (obj.__cdata ?? obj["#text"] ?? obj["@_href"] ?? value) : value;
  return String(raw ?? "")
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/\s+/g, " ")
    .trim();
}

function classify(text: string): string {
  if (/accident|carambolage|collision|véhicule renversé/i.test(text)) return "accident";
  if (/fermeture|fermée|fermé|coupure|interdit à la circulation|route barrée/i.test(text)) return "road_closure";
  if (/travaux|chantier|réfection|réhabilitation/i.test(text)) return "roadworks";
  if (/bouchon|embouteillage|ralentissement|trafic dense|congestion/i.test(text)) return "congestion";
  if (/pluie|inondation|intempéries|eaux pluviales/i.test(text)) return "weather_disruption";
  return "traffic_news";
}

function expiryFor(type: string, publishedAt: Date): string {
  const hours = type === "roadworks" ? 168 : type === "road_closure" ? 36 : type === "accident" ? 12 : type === "congestion" ? 6 : 24;
  return new Date(publishedAt.getTime() + hours * 60 * 60 * 1000).toISOString();
}

function mentionedAreas(text: string): string[] {
  const places = [
    "Dakar", "Pikine", "Guédiawaye", "Rufisque", "Diamniadio", "AIBD",
    "Patte d’Oie", "Patte d'Oie", "VDN", "Corniche Ouest", "Corniche",
    "Petersen", "Colobane", "Hann", "Yoff", "Ouakam", "Mermoz", "Fann",
    "Toglou", "Sébikotane", "Parcelles Assainies", "Niayes", "Keur Massar",
    "Malika", "Cambérène", "Bargny", "Sangalkam", "Bambilor", "Yeumbeul",
    "Thiaroye", "Mbao", "Grand Yoff", "HLM", "Liberté", "Plateau", "Médina",
  ];
  const lower = text.toLocaleLowerCase("fr");
  return Array.from(new Set(places.filter((place) => lower.includes(place.toLocaleLowerCase("fr")))));
}

const ingest = withSupabase(
  { auth: "publishable" },
  async (req, ctx) => {
    if (req.method !== "POST") return reply({ error: "METHOD_NOT_ALLOWED" }, 405);
    const db = ctx.supabaseAdmin;
    const ingestToken = req.headers.get("x-dakar-bus-ingest-token") ?? "";
    const { data: authorized, error: authorizationError } = await db.rpc(
      "verify_dakar_bus_ingest_token",
      { p_token: ingestToken },
    );
    if (authorizationError || authorized !== true) {
      return reply({ error: "UNAUTHORIZED" }, 401);
    }

    const { data: source, error: sourceError } = await db
      .from("traffic_sources")
      .select("id,last_checked_at,metadata")
      .eq("name", SOURCE_NAME)
      .limit(1);
    if (sourceError || !source?.length) {
      console.error("senenews_source_lookup_failed", sourceError?.message ?? "no row", sourceError?.code ?? "");
      return reply({ error: "SOURCE_NOT_REGISTERED" }, 500);
    }
    const sourceRow = source[0];

    if (sourceRow.last_checked_at && Date.now() - new Date(sourceRow.last_checked_at).getTime() < MIN_INTERVAL_MS) {
      return reply({ skipped: true, reason: "RATE_LIMITED", next_check_after_seconds: 600 }, 429);
    }

    const checkedAt = new Date().toISOString();
    try {
      const response = await fetch(FEED_URL, {
        headers: { "Accept": "application/rss+xml, application/xml, text/xml", "User-Agent": "DakarBusTrafficMonitor/1.0" },
        signal: AbortSignal.timeout(15000),
      });
      if (!response.ok) throw new Error("RSS_HTTP_" + response.status);
      const xml = await response.text();
      if (!xml || xml.length > 5_000_000) throw new Error("RSS_EMPTY_OR_TOO_LARGE");

      const parsed = parser.parse(xml);
      const rawItems = parsed?.rss?.channel?.item ?? parsed?.feed?.entry ?? [];
      const items = Array.isArray(rawItems) ? rawItems : rawItems ? [rawItems] : [];
      const now = Date.now();
      const trafficTerms = /circulation routière|trafic routier|embouteillage|bouchon|ralentissement de la circulation|perturbation de la circulation|accident de la route|accident de circulation|accident routier|travaux routiers|fermeture de (?:la )?(?:route|voie|autoroute)|route barrée|voie fermée|déviation routière|déviation de circulation|circulation interrompue|circulation coupée|coupure de circulation|axe routier|route nationale|autoroute/i;
      const roadTerms = /route|voie|autoroute|carrefour|rond[- ]point|échangeur|pont|boulevard|avenue|chaussée|rocade|périphérique|VDN|corniche|axe routier|routier|BRT|TER/i;

      const incidents = items.flatMap((item: Record<string, unknown>) => {
        const title = clean(item.title);
        const description = clean(item.description ?? item.summary ?? item.content ?? item["content:encoded"]);
        const link = clean(item.link);
        const guid = clean(item.guid) || link;
        const sourceInfo = item.source as Record<string, unknown> | undefined;
        const publisherName = clean(sourceInfo?.["#text"] ?? sourceInfo);
        const publisherUrl = clean(sourceInfo?.["@_url"]);
        const published = clean(item.pubDate ?? item.published ?? item.updated);
        const publishedAt = new Date(published);
        if (!title || !link || !guid || Number.isNaN(publishedAt.getTime())) return [];
        if (now - publishedAt.getTime() > MAX_AGE_MS || publishedAt.getTime() > now + 5 * 60 * 1000) return [];
        const leadText = title + " " + description.slice(0, 1500);
        const areas = mentionedAreas(leadText);
        const titleOrLead = title + " " + description.slice(0, 500);
        if (!areas.length || !trafficTerms.test(titleOrLead) || !roadTerms.test(leadText)) return [];
        return [{
          traffic_source_id: sourceRow.id,
          source_external_id: guid,
          source_url: link,
          source_published_at: publishedAt.toISOString(),
          title: title.slice(0, 500),
          description: description.slice(0, 5000) || title,
          incident_type: classify(leadText),
          severity: "unknown",
          status: "unverified",
          area_label: areas.length ? areas.join(", ") : null,
          observed_at: publishedAt.toISOString(),
          expires_at: expiryFor(classify(leadText), publishedAt),
          metadata: {
            ingestion: "local_news_rss",
            source_feed: FEED_URL,
            matched_areas: areas,
            validation_required: true,
            matched_road_context: true,
            article_guid: guid,
            publisher_name: publisherName || null,
            publisher_url: publisherUrl || null,
          },
        }];
      });

      if (incidents.length) {
        const { error: upsertError } = await db
          .from("traffic_incidents")
          .upsert(incidents, { onConflict: "traffic_source_id,source_external_id", ignoreDuplicates: true });
        if (upsertError) throw new Error("INCIDENT_UPSERT_FAILED");
      }

      const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(xml));
      const contentHash = Array.from(new Uint8Array(digest)).map((b) => b.toString(16).padStart(2, "0")).join("");
      const { error: observationError } = await db.from("traffic_observations").insert({
        traffic_source_id: sourceRow.id,
        observed_at: checkedAt,
        collected_at: checkedAt,
        coverage_status: "partial",
        content_hash: contentHash,
        payload: {
          feed_url: FEED_URL,
          feed_title: clean(parsed?.rss?.channel?.title ?? parsed?.feed?.title),
          feed_item_count: items.length,
          traffic_candidate_count: incidents.length,
          fetched_at: checkedAt,
          candidate_policy: "unverified_only",
        },
      });
      if (observationError) throw new Error("OBSERVATION_INSERT_FAILED");

      const { error: updateError } = await db.from("traffic_sources").update({
        status: "partial",
        last_checked_at: checkedAt,
        metadata: {
          ...(sourceRow.metadata ?? {}),
          ingestion: "local_news_rss",
          rss_feed_url: FEED_URL,
          last_success_at: checkedAt,
          last_feed_item_count: items.length,
          last_traffic_candidate_count: incidents.length,
          last_error: null,
          realtime: false,
          public_realtime_api_verified: false,
        },
      }).eq("id", sourceRow.id);
      if (updateError) throw new Error("SOURCE_UPDATE_FAILED");

      return reply({
        ok: true,
        source: SOURCE_NAME,
        fetched_items: items.length,
        new_candidate_articles: incidents.length,
        status_policy: "All imported items remain unverified; none is automatically published as a confirmed alert.",
        checked_at: checkedAt,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "UNKNOWN_ERROR";
      await db.from("traffic_sources").update({
        status: sourceRow.last_checked_at ? "stale" : "unavailable",
        last_checked_at: checkedAt,
        metadata: {
          ...(sourceRow.metadata ?? {}),
          ingestion: "local_news_rss",
          rss_feed_url: FEED_URL,
          last_error_at: checkedAt,
          last_error: message,
          public_realtime_api_verified: false,
        },
      }).eq("id", sourceRow.id);
      console.error("local_news_rss_ingest_failed", message);
      return reply({ ok: false, source: SOURCE_NAME, error: "FEED_FETCH_OR_PARSE_FAILED", detail: message }, 502);
    }
  },
);

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers });
  return await ingest(req);
});
