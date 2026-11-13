import { mkdir, writeFile } from "node:fs/promises";

const INDEX = "https://aftu-senegal.org/infos-pratiques/";
const OUTPUT = "artifacts/aftu/aftu-official-route-pages.json";
const headers = { "User-Agent": "DakarBus-official-route-audit/1.0" };
const ADDITIONAL_OFFICIAL_PAGES = [
  { slug: "27", url: "https://aftu-senegal.org/map/dakar-urbain-ligne-27/" },
  { slug: "36", url: "https://aftu-senegal.org/map/dakar-urbain-ligne-36/" },
  ...["84", "85", "86", "87", "88", "89", "91"].map((slug) => ({
    slug,
    url: `https://aftu-senegal.org/map/dakar-urbain-ligne-${slug}/`,
  })),
];

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function fetchText(url) {
  let lastError;
  for (let attempt = 0; attempt < 3; attempt += 1) {
    try {
      const response = await fetch(url, { headers, signal: AbortSignal.timeout(25000) });
      if (!response.ok) {
        const error = new Error(`${url}: HTTP ${response.status}`);
        if (response.status < 500 && response.status !== 429) throw error;
        lastError = error;
      } else {
        return await response.text();
      }
    } catch (error) {
      lastError = error;
      const code = error?.cause?.code ?? error?.code;
      const retryable = error?.name === "TimeoutError"
        || error?.name === "AbortError"
        || ["ETIMEDOUT", "ECONNRESET", "ECONNREFUSED", "EAI_AGAIN", "ENETUNREACH", "UND_ERR_CONNECT_TIMEOUT"].includes(code)
        || /HTTP 5\d\d|HTTP 429/.test(error.message);
      if (!retryable) throw error;
    }
    if (attempt < 2) await wait([1000, 3000][attempt]);
  }
  throw lastError ?? new Error(`Unable to retrieve ${url}`);
}
function decode(text) {
  return text
    .replace(/&nbsp;|&#160;/gi, " ")
    .replace(/&amp;/gi, "&").replace(/&quot;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'").replace(/&lt;/gi, "<").replace(/&gt;/gi, ">")
    .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n)))
    .replace(/&#x([0-9a-f]+);/gi, (_, n) => String.fromCodePoint(parseInt(n, 16)));
}
function plain(html) {
  return decode(html.replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " "))
    .replace(/[\t\r\n]+/g, " ").replace(/\s+/g, " ").trim();
}
async function extractRoute(slug, url, sourceIndexListed) {
  const html = await fetchText(url);
  const text = plain(html);
  const upperText = text.toUpperCase();
  const itineraryIndex = upperText.indexOf("ITINERAIRE");
  const dateMatch = text.match(/\b\d{1,2}\s+[A-Za-zÀ-ÿ]+\s+20\d{2}\b/);
  const fallbackStart = dateMatch
    ? text.lastIndexOf(dateMatch[0]) + dateMatch[0].length
    : -1;
  const itineraryStart = itineraryIndex >= 0
    ? itineraryIndex + "ITINERAIRE".length
    : fallbackStart;
  let itinerary = itineraryStart >= 0 ? text.slice(itineraryStart).trim() : "";
  const collectionIndex = itinerary.toUpperCase().indexOf("COLLECTION");
  if (collectionIndex >= 0) itinerary = itinerary.slice(0, collectionIndex).trim();
  const lineNumber = slug.match(/^[0-9]+[a-z]?/i)?.[0]?.toUpperCase() ?? slug.toUpperCase();
  return {
    operator: "AFTU",
    line: lineNumber,
    slug,
    title: text.slice(Math.max(0, text.indexOf("Dakar")), Math.max(0, text.indexOf("Dakar")) + 120) || null,
    publishedDate: dateMatch?.[0] ?? null,
    itineraryText: itinerary,
    sourceUrl: url,
    sourceType: "official AFTU route page",
    sourceIndexListed,
    directionCoverage: "published corridor description; do not fabricate the reverse direction",
  };
}

async function saveReport(report) {
  await mkdir("artifacts/aftu", { recursive: true });
  await writeFile(OUTPUT, JSON.stringify(report, null, 2) + "\n");
  console.log(JSON.stringify(report.summary, null, 2));
}

async function main() {
  await mkdir("artifacts/aftu", { recursive: true });
  let indexHtml;
  try {
    indexHtml = await fetchText(INDEX);
  } catch (error) {
    // External-source outages must be visible in the artifact, not misreported
    // as a code failure or silently replaced by stale route data.
    await saveReport({
      generatedAt: new Date().toISOString(),
      sourceIndex: INDEX,
      sourcePolicy: "Official AFTU pages only. If the source is unreachable, record the outage and do not substitute stale or inferred route data.",
      status: "SOURCE_UNAVAILABLE",
      summary: { linkedRoutePages: 0, additionalOfficialRoutePages: 0, pagesFetched: 0, pagesWithItinerary: 0, missingItinerary: [], errors: 1 },
      routes: [],
      errors: [{ url: INDEX, error: error.message }],
    });
    return;
  }

  const anchors = [...indexHtml.matchAll(/<a\b[^>]*href=["']([^"']*\/map\/dakar-urbain-ligne-[^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi)];
  const pages = new Map();
  for (const match of anchors) {
    const url = new URL(decode(match[1]), INDEX).href.split("#")[0];
    const slug = url.match(/dakar-urbain-ligne-([^/]+)/i)?.[1];
    if (slug) pages.set(slug, { url, sourceIndexListed: true });
  }
  for (const page of ADDITIONAL_OFFICIAL_PAGES) {
    if (!pages.has(page.slug)) pages.set(page.slug, { url: page.url, sourceIndexListed: false });
  }

  const routes = [];
  const errors = [];
  for (const [slug, page] of pages) {
    try {
      routes.push(await extractRoute(slug, page.url, page.sourceIndexListed));
    } catch (error) {
      errors.push({ slug, url: page.url, error: error.message });
    }
    await wait(250);
  }

  const linkedRoutePages = [...pages.values()].filter((page) => page.sourceIndexListed).length;
  const additionalOfficialRoutePages = [...pages.values()].filter((page) => !page.sourceIndexListed).length;
  await saveReport({
    generatedAt: new Date().toISOString(),
    sourceIndex: INDEX,
    additionalOfficialPages: ADDITIONAL_OFFICIAL_PAGES,
    sourcePolicy: "Official AFTU route pages are transcribed as published. Street/corridor descriptions are not converted into individual stop sequences without stop-level evidence. No frequency is inferred from route descriptions.",
    status: errors.length ? "PARTIAL_SOURCE_RESPONSE" : "SUCCESS",
    summary: {
      linkedRoutePages,
      additionalOfficialRoutePages,
      pagesFetched: routes.length,
      pagesWithItinerary: routes.filter((route) => route.itineraryText.length > 20).length,
      missingItinerary: routes.filter((route) => route.itineraryText.length <= 20).map((route) => route.line),
      errors: errors.length,
    },
    routes,
    errors,
  });
}
await main();
