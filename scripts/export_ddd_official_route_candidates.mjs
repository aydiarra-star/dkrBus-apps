import { mkdir, writeFile } from "node:fs/promises";

const SOURCE_URL = "https://demdikk.sn/reseau-urbain-dakar/";
const INFO_URL = "https://demdikk.sn/info-voyageurs/";
const OUTPUT = "artifacts/ddd/ddd-official-published-route-candidates.json";
const HEADERS = { "User-Agent": "DakarBus-official-route-audit/1.0" };

async function fetchHtml(url) {
  const response = await fetch(url, {
    headers: HEADERS,
    signal: AbortSignal.timeout(45000),
  });
  if (!response.ok) throw new Error(`${url}: HTTP ${response.status}`);
  return response.text();
}

function decodeEntities(value) {
  return value
    .replace(/&nbsp;|&#160;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n)))
    .replace(/&#x([0-9a-f]+);/gi, (_, n) => String.fromCodePoint(parseInt(n, 16)));
}

function htmlToLines(html) {
  const text = decodeEntities(
    html
      .replace(/<script[\s\S]*?<\/script>/gi, " ")
      .replace(/<style[\s\S]*?<\/style>/gi, " ")
      .replace(/<\/(?:p|li|h[1-6]|div|section|article|tr|br)\s*>/gi, "\n")
      .replace(/<br\s*\/?>/gi, "\n")
      .replace(/<[^>]+>/g, " "),
  );
  return text
    .replace(/[\t\r]+/g, " ")
    .split("\n")
    .map((line) => line.replace(/\s+/g, " ").trim())
    .filter(Boolean);
}

function routeHeading(line) {
  const normalized = line.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toUpperCase();
  if (/^LIGNES? BANLIEUE\b/.test(normalized)) return null;
  if (/^LIGNE\s+TAF\s+TAF\s+OUAKAM\b/.test(normalized)) {
    return { line: "TAF_TAF_TO1", heading: line, codeSource: "explicit_heading" };
  }
  if (/^LIGNE\s+TAF\s+TAF\b/.test(normalized)) {
    return { line: "TAF_TAF", heading: line, codeSource: "explicit_heading" };
  }
  const numbered = line.match(/^LIGNE\s+([0-9]{1,3}[A-Z]?(?:\s*&\s*[0-9]{1,3}[A-Z]?)?)\s*:\s*(.*)$/i);
  if (numbered) {
    return {
      line: numbered[1].replace(/\s+/g, "").toUpperCase(),
      heading: line,
      codeSource: "explicit_heading",
    };
  }
  if (/^TERMINUS\s+RUFISQUE\b.*\bYENNE\b/i.test(line)) {
    return {
      line: "228",
      heading: line,
      codeSource: "cross_reference_to_official_info_page",
    };
  }
  return undefined;
}

function isSectionHeading(line) {
  const normalized = line.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toUpperCase();
  return /^LIGNES?\s+(?:URBAINES|BANLIEUE)\b/.test(normalized)
    || /^VOUS CHERCHER\b/.test(normalized);
}

function extractCandidates(lines) {
  const candidates = [];
  let current = null;
  for (const line of lines) {
    const heading = routeHeading(line);
    if (heading) {
      if (current) candidates.push(current);
      current = {
        ...heading,
        publishedOrder: [],
      };
      continue;
    }
    if (!current) continue;
    if (isSectionHeading(line)) {
      candidates.push(current);
      current = null;
      continue;
    }
    const stopName = line.replace(/^[–—•·-]\s*/, "").trim();
    if (!stopName || /^CLIQUEZ SUR UNE LIGNE\b/i.test(stopName)) continue;
    if (/^(ACCUEIL|OFFRES DE TRANSPORT|SERVICES|INFO VOYAGEURS|PRESENTATION|CONTACT)$/i.test(stopName)) continue;
    current.publishedOrder.push(stopName);
  }
  if (current) candidates.push(current);
  return candidates.filter((candidate) => candidate.publishedOrder.length >= 2);
}

function deduplicate(candidates) {
  const seen = new Map();
  const output = [];
  for (const candidate of candidates) {
    const key = `${candidate.line}:${candidate.publishedOrder.join("|").toLocaleLowerCase("fr")}`;
    if (seen.has(key)) {
      seen.get(key).duplicateSourceHeadings.push(candidate.heading);
      continue;
    }
    const record = {
      operator: "Dakar Dem Dikk",
      line: candidate.line,
      publishedHeading: candidate.heading,
      publishedOrder: candidate.publishedOrder,
      sourceUrl: SOURCE_URL,
      sourceLabel: "Dakar Dem Dikk · Réseau urbain Dakar",
      sourceIndexUrl: INFO_URL,
      sourceIndexLabel: "Dakar Dem Dikk · Info voyageurs",
      retrievedOn: "2026-11-13",
      status: "NEEDS_HUMAN_REVIEW",
      directionCoverage: "ONE_PUBLISHED_ORDER_ONLY",
      reverseSequenceVerified: false,
      stopIdsMatched: false,
      frequencyMinutes: null,
      codeSource: candidate.codeSource,
      duplicateSourceHeadings: [],
    };
    seen.set(key, record);
    output.push(record);
  }
  return output;
}

async function main() {
  await mkdir("artifacts/ddd", { recursive: true });
  const html = await fetchHtml(SOURCE_URL);
  const lines = htmlToLines(html);
  const extracted = extractCandidates(lines);
  const routes = deduplicate(extracted);
  const required = ["1", "4", "7", "8", "9", "10", "13", "18", "20", "23", "121", "319", "501", "502", "503", "2", "5", "6", "11", "12", "15", "16A", "16B", "208", "213", "217", "218", "219", "220", "221", "227", "228", "232", "233", "234", "311", "327", "TAF_TAF", "TAF_TAF_TO1"];
  const present = new Set(routes.map((route) => route.line));
  const missingRequired = required.filter((line) => !present.has(line));
  const report = {
    generatedAt: new Date().toISOString(),
    sourceUrl: SOURCE_URL,
    sourceIndexUrl: INFO_URL,
    policy: "The official operator page is transcribed in its published order. An arrow in a heading does not prove two separately documented stop sequences. No reverse sequence, stop ID, frequency or countdown is inferred.",
    summary: {
      sourceLines: lines.length,
      rawRouteSections: extracted.length,
      uniquePublishedSequences: routes.length,
      duplicateSectionsCollapsed: extracted.length - routes.length,
      routesWithAtLeastTwoPublishedStops: routes.filter((route) => route.publishedOrder.length >= 2).length,
      missingRequired,
    },
    routes,
  };
  if (missingRequired.length) {
    throw new Error(`Official DDD route extraction incomplete; missing: ${missingRequired.join(", ")}. Extracted ${routes.length} routes.`);
  }
  await writeFile(OUTPUT, JSON.stringify(report, null, 2) + "\n");
  console.log(JSON.stringify(report.summary, null, 2));
}

await main();
