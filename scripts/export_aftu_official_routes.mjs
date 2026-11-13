import { mkdir, writeFile } from "node:fs/promises";

const INDEX = "https://aftu-senegal.org/infos-pratiques/";
const OUTPUT = "artifacts/aftu/aftu-official-route-pages.json";
const headers = { "User-Agent": "DakarBus-official-route-audit/1.0" };
const ADDITIONAL_OFFICIAL_PAGES = [
  { slug: "27", url: "https://aftu-senegal.org/map/dakar-urbain-ligne-27/" },
  { slug: "36", url: "https://aftu-senegal.org/map/dakar-urbain-ligne-36/" },
  // The official index lists these lines and their termini but currently
  // exposes no clickable itinerary URL for them. Probe the conventional
  // official page URLs; failed probes are retained in the audit error list.
  ...["84", "85", "86", "87", "88", "89", "91"].map((slug) => ({
    slug,
    url: `https://aftu-senegal.org/map/dakar-urbain-ligne-${slug}/`,
  })),
];

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
async function extractRoute(slug, url, sourceIndexListed) {
  const html = await fetchText(url);
  const text = plain(html);
  const upperText = text.toUpperCase();
  const itineraryIndex = upperText.indexOf("ITINERAIRE");
  const dateMatch = text.match(/\b\d{1,2}\s+[A-Za-zÀ-ÿ]+\s+20\d{2}\b/);
  // Certaines fiches publient directement le corridor après la date sans
  // intertitre « ITINERAIRE » ; conserver ce texte jusqu'à « Collection ».
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

async function main() {
  await mkdir("artifacts/aftu", { recursive: true });
  const indexHtml = await fetchText(INDEX);
  const anchors = [...indexHtml.matchAll(/<a\b[^>]*href=["']([^"']*\/map\/dakar-urbain-ligne-[^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi)];
  const pages = new Map();
  for (const match of anchors) {
    const url = new URL(decode(match[1]), INDEX).href.split("#")[0];
    const slug = url.match(/dakar-urbain-ligne-([^/]+)/i)?.[1];
    if (slug) pages.set(slug, { url, sourceIndexListed: true });
  }

  // Deux fiches officielles sont accessibles par URL directe mais absentes
  // des liens extraits de la page « Infos pratiques » (lignes 27 et 36).
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
    await new Promise((resolve) => setTimeout(resolve, 250));
  }

  const linkedRoutePages = [...pages.values()].filter((page) => page.sourceIndexListed).length;
  const additionalOfficialRoutePages = [...pages.values()].filter((page) => !page.sourceIndexListed).length;
  const report = {
    generatedAt: new Date().toISOString(),
    sourceIndex: INDEX,
    additionalOfficialPages: ADDITIONAL_OFFICIAL_PAGES,
    sourcePolicy: "Official AFTU route pages are transcribed as published. Street/corridor descriptions are not converted into individual stop sequences without stop-level evidence. No frequency is inferred from route descriptions.",
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
  };
  await writeFile(OUTPUT, JSON.stringify(report, null, 2) + "\n");
  console.log(JSON.stringify(report.summary, null, 2));
}
await main();
