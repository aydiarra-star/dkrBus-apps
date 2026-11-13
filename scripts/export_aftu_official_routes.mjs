import { mkdir, writeFile } from "node:fs/promises";

const INDEX = "https://aftu-senegal.org/infos-pratiques/";
const OUTPUT = "artifacts/aftu/aftu-official-route-pages.json";
const headers = { "User-Agent": "DakarBus-official-route-audit/1.0" };

async function fetchText(url) {
  const response = await fetch(url, { headers, signal: AbortSignal.timeout(45000) });
  if (!response.ok) throw new Error(`${url}: HTTP ${response.status}`);
  return response.text();
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
async function main() {
  await mkdir("artifacts/aftu", { recursive: true });
  const indexHtml = await fetchText(INDEX);
  const anchors = [...indexHtml.matchAll(/<a\b[^>]*href=["']([^"']*\/map\/dakar-urbain-ligne-[^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi)];
  const pages = new Map();
  for (const match of anchors) {
    const url = new URL(decode(match[1]), INDEX).href.split("#")[0];
    const lineSlug = url.match(/dakar-urbain-ligne-([^/]+)/i)?.[1];
    if (lineSlug) pages.set(lineSlug, url);
  }

  const routes = [];
  const errors = [];
  for (const [slug, url] of pages) {
    try {
      const html = await fetchText(url);
      const text = plain(html);
      const upperText = text.toUpperCase();
      const itineraryIndex = upperText.indexOf("ITINERAIRE");
      const dateMatch = text.match(/\b\d{1,2}\s+[A-Za-zÀ-ÿ]+\s+20\d{2}\b/);
      // Certaines fiches AFTU publient directement le corridor après la date,
      // sans intertitre « ITINERAIRE » (ex. ligne 30). Dans ce cas, conserver
      // le texte entre la date de publication et « Collection ».
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
      const date = text.match(/\b\d{1,2}\s+[A-Za-zÀ-ÿ]+\s+20\d{2}\b/)?.[0] ?? null;
      routes.push({
        operator: "AFTU",
        line: lineNumber,
        slug,
        title: text.slice(Math.max(0, text.indexOf("Dakar")), Math.max(0, text.indexOf("Dakar")) + 120) || null,
        publishedDate: date,
        itineraryText: itinerary,
        sourceUrl: url,
        sourceType: "official AFTU route page",
        directionCoverage: "published corridor description; do not fabricate the reverse direction",
      });
    } catch (error) {
      errors.push({ slug, url, error: error.message });
    }
    await new Promise((resolve) => setTimeout(resolve, 250));
  }
  const report = {
    generatedAt: new Date().toISOString(),
    sourceIndex: INDEX,
    sourcePolicy: "Official AFTU route pages are transcribed as published. Street/corridor descriptions are not converted into individual stop sequences without stop-level evidence. No frequency is inferred from route descriptions.",
    summary: {
      linkedRoutePages: pages.size,
      pagesFetched: routes.length,
      pagesWithItinerary: routes.filter((route) => route.itineraryText.length > 20).length,
      missingItinerary: routes.filter((route) => route.itineraryText.length <= 20).map((route) => route.line),
      errors: errors.length,
    },
    routes,
    errors,
  };
  await writeFile(OUTPUT, JSON.stringify(report, null, 2) + "\n");
  console.log(JSON.stringify(report.summary, null, 2));
}
await main();
