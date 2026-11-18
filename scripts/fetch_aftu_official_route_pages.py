#!/usr/bin/env python3
"""Fetch public AFTU route pages and extract their Waymark GeoJSON, if exposed.

This is a read-only source audit. It does not create or activate passenger routes.
"""
from __future__ import annotations

import argparse
import json
import re
import time
from concurrent.futures import ThreadPoolExecutor, as_completed
from datetime import datetime, timezone
from html.parser import HTMLParser
from pathlib import Path
from urllib.error import HTTPError, URLError
from urllib.parse import urlencode, urljoin, urlsplit
from urllib.request import Request, urlopen

DEFAULT_INDEX_URL = "https://aftu-senegal.org/infos-pratiques/"
USER_AGENT = (
    "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 "
    "(KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36 "
    "DakarBusRouteAudit/1.0"
)
MONTHS = {
    "janvier": 1, "fevrier": 2, "mars": 3, "avril": 4,
    "mai": 5, "juin": 6, "juillet": 7, "aout": 8,
    "septembre": 9, "octobre": 10, "novembre": 11, "decembre": 12,
}
DATE_RE = re.compile(
    r"\b(\d{1,2})\s+"
    r"(janvier|février|fevrier|mars|avril|mai|juin|juillet|août|aout|"
    r"septembre|octobre|novembre|décembre|decembre)\s+(\d{4})\b",
    re.IGNORECASE,
)


def clean_space(value: str) -> str:
    return re.sub(r"\s+", " ", value or "").strip()


class AftuIndexParser(HTMLParser):
    """Associate each 'Voir itinéraire' anchor with the nearest LIGNE heading."""

    def __init__(self) -> None:
        super().__init__(convert_charrefs=True)
        self.current_line: str | None = None
        self.lines: list[str] = []
        self.route_pages: list[dict] = []
        self.capture_tag: str | None = None
        self.capture_parts: list[str] = []
        self.capture_href: str | None = None

    def handle_starttag(self, tag: str, attrs: list[tuple[str, str | None]]) -> None:
        if self.capture_tag is not None:
            return
        if tag in {"h1", "h2", "h3", "h4", "h5", "h6"}:
            self.capture_tag = tag
            self.capture_parts = []
            self.capture_href = None
        elif tag == "a":
            href = dict(attrs).get("href")
            if href:
                self.capture_tag = "a"
                self.capture_parts = []
                self.capture_href = href

    def handle_data(self, data: str) -> None:
        if self.capture_tag is not None:
            self.capture_parts.append(data)

    def handle_endtag(self, tag: str) -> None:
        if tag != self.capture_tag:
            return
        text = clean_space(" ".join(self.capture_parts))
        if tag in {"h1", "h2", "h3", "h4", "h5", "h6"}:
            match = re.search(r"\bLIGNE\s*(\d{1,3}[A-Z]?)\b", text, re.IGNORECASE)
            if match:
                self.current_line = match.group(1).upper()
                self.lines.append(self.current_line)
        elif tag == "a" and "voir itineraire" in normalize_text(text):
            href = self.capture_href or ""
            line = self.current_line or parse_line_from_url(href)
            if line and href:
                self.route_pages.append({"line": line, "url": href, "linkText": text})
        self.capture_tag = None
        self.capture_parts = []
        self.capture_href = None


class TextExtractor(HTMLParser):
    def __init__(self) -> None:
        super().__init__(convert_charrefs=True)
        self.parts: list[str] = []
        self.skip_depth = 0

    def handle_starttag(self, tag: str, attrs: list[tuple[str, str | None]]) -> None:
        if tag in {"script", "style", "noscript"}:
            self.skip_depth += 1

    def handle_endtag(self, tag: str) -> None:
        if tag in {"script", "style", "noscript"} and self.skip_depth:
            self.skip_depth -= 1

    def handle_data(self, data: str) -> None:
        if not self.skip_depth:
            self.parts.append(data)


def normalize_text(value: str) -> str:
    import unicodedata
    text = unicodedata.normalize("NFD", value or "").lower()
    text = "".join(char for char in text if unicodedata.category(char) != "Mn")
    return re.sub(r"[^a-z0-9]+", " ", text).strip()


def parse_line_from_url(url: str) -> str | None:
    match = re.search(r"ligne[-_/ ]?(\d{1,3}[a-z]?)", url, re.IGNORECASE)
    return match.group(1).upper() if match else None


def fetch_url(url: str, referer: str | None = None, attempts: int = 3) -> tuple[str, int, str]:
    last_error: Exception | None = None
    for attempt in range(attempts):
        headers = {
            "User-Agent": USER_AGENT,
            "Accept": "text/html,application/json,*/*",
            "Accept-Encoding": "identity",
        }
        if referer:
            headers["Referer"] = referer
        request = Request(url, headers=headers)
        try:
            with urlopen(request, timeout=30) as response:
                charset = response.headers.get_content_charset() or "utf-8"
                return response.read().decode(charset, errors="replace"), response.status, response.geturl()
        except (HTTPError, URLError, TimeoutError, OSError) as error:
            last_error = error
            if attempt + 1 < attempts:
                time.sleep(1.0 * (attempt + 1))
    raise RuntimeError(f"GET {url} failed after {attempts} attempts: {last_error}")


def parse_index(html: str, index_url: str) -> dict:
    parser = AftuIndexParser()
    parser.feed(html)
    pages = []
    seen = set()
    for item in parser.route_pages:
        absolute = urljoin(index_url, item["url"])
        key = (item["line"], absolute)
        if key in seen:
            continue
        seen.add(key)
        pages.append({**item, "url": absolute})
    listed = sorted(set(parser.lines), key=lambda value: (int(re.match(r"\d+", value).group()), value))
    linked = {item["line"] for item in pages}
    return {
        "linesListed": listed,
        "routePages": pages,
        "linesWithoutRoutePage": [line for line in listed if line not in linked],
    }


def extract_text(html: str) -> str:
    parser = TextExtractor()
    parser.feed(html)
    return clean_space(" ".join(parser.parts))


def parse_french_date(text: str) -> str | None:
    matches = list(DATE_RE.finditer(text or ""))
    if not matches:
        return None
    match = matches[-1]
    month = normalize_text(match.group(2))
    try:
        return datetime(
            int(match.group(3)),
            MONTHS[month],
            int(match.group(1)),
            tzinfo=timezone.utc,
        ).date().isoformat()
    except (KeyError, ValueError):
        return None


def extract_itinerary_text(text: str) -> str:
    clean = clean_space(text)
    collection_match = re.search(r"\bCollection\b", clean, re.IGNORECASE)
    before_collection = clean[:collection_match.start()] if collection_match else clean
    date_matches = list(DATE_RE.finditer(before_collection))
    if date_matches:
        route = before_collection[date_matches[-1].end():]
    else:
        marker = re.search(r"\bITINERAIRE\b", before_collection, re.IGNORECASE)
        route = before_collection[marker.end():] if marker else ""
    route = re.sub(r"^\s*ITINERAIRE\s*", "", route, flags=re.IGNORECASE)
    route = re.sub(r"^\s*(?:Dakar\s+Urbain\s+)?Ligne\s+\d{1,3}[A-Z]?\s*", "", route, flags=re.IGNORECASE)
    return clean_space(route).strip(" :-–—")


def split_route_segments(itinerary: str) -> list[str]:
    parts = re.split(r"\s+(?:-\s+|–\s+|—\s+|→\s+|->\s+)", itinerary or "")
    return [clean_space(part).strip(" .;") for part in parts if clean_space(part).strip(" .;")]


def extract_return_hints(itinerary: str) -> list[str]:
    hints = re.findall(
        r"\bRETOUR(?:\s+PAR)?\s+([^);–—]+)",
        itinerary or "",
        flags=re.IGNORECASE,
    )
    return [clean_space(item).strip(" .,-") for item in hints if clean_space(item)]


def extract_balanced_json(text: str, start: int) -> tuple[dict | list | None, int]:
    while start < len(text) and text[start].isspace():
        start += 1
    while start < len(text) and text[start] not in "{[":
        start += 1
    if start >= len(text):
        return None, start
    stack: list[str] = []
    in_string = False
    escaped = False
    pairs = {"}": "{", "]": "["}
    for index in range(start, len(text)):
        char = text[index]
        if in_string:
            if escaped:
                escaped = False
            elif char == "\\":
                escaped = True
            elif char == '"':
                in_string = False
            continue
        if char == '"':
            in_string = True
        elif char in "{[":
            stack.append(char)
        elif char in "}]":
            if not stack or stack[-1] != pairs[char]:
                return None, index + 1
            stack.pop()
            if not stack:
                try:
                    return json.loads(text[start:index + 1]), index + 1
                except json.JSONDecodeError:
                    return None, index + 1
    return None, len(text)


def extract_waymark_geojson(html: str) -> list[dict]:
    payloads = []
    marker = "waymark_viewer.load_json"
    cursor = 0
    while True:
        index = html.find(marker, cursor)
        if index < 0:
            break
        open_paren = html.find("(", index + len(marker))
        if open_paren < 0:
            break
        payload, end = extract_balanced_json(html, open_paren + 1)
        cursor = max(end, open_paren + 1)
        if isinstance(payload, dict) and payload.get("type") == "FeatureCollection":
            payloads.append(payload)
    return payloads


def extract_map_id(html: str, page_url: str) -> str | None:
    for pattern in (
        r"\bpostid-(\d+)\b",
        r"\bwaymark[-_]map[-_]id[\"'=:\s]+(\d+)",
        r"[?&]p=(\d+)",
    ):
        match = re.search(pattern, html, re.IGNORECASE)
        if match:
            return match.group(1)
    return None


def extract_waymark_nonce(html: str) -> str | None:
    patterns = (
        r"waymark_security\s*[:=]\s*[\"']([^\"']+)[\"']",
        r"waymark_nonce\s*[:=]\s*[\"']([^\"']+)[\"']",
    )
    for pattern in patterns:
        match = re.search(pattern, html, re.IGNORECASE)
        if match:
            return match.group(1)
    return None


def extract_waymark_endpoint(html: str, page_url: str) -> str:
    match = re.search(
        r"waymark_http_endpoint\s*[:=]\s*[\"']([^\"']+)[\"']",
        html,
        re.IGNORECASE,
    )
    if match:
        return urljoin(page_url, match.group(1))
    parts = urlsplit(page_url)
    return f"{parts.scheme}://{parts.netloc}/?waymark_http=1"


def geometry_type_counts(payloads: list[dict]) -> dict:
    counts: dict[str, int] = {}
    total = 0
    for payload in payloads:
        for feature in payload.get("features") or []:
            geometry = feature.get("geometry") or {}
            geometry_type = geometry.get("type") or "null"
            counts[geometry_type] = counts.get(geometry_type, 0) + 1
            total += 1
    return {"featureCount": total, "geometryTypes": counts}


def fetch_waymark_fallback(
    html: str, page_url: str, map_id: str | None
) -> list[dict]:
    nonce = extract_waymark_nonce(html)
    if not map_id or not nonce:
        return []
    endpoint = extract_waymark_endpoint(html, page_url)
    separator = "&" if "?" in endpoint else "?"
    query = urlencode({
        "waymark_action": "get_map_data",
        "map_id": map_id,
        "waymark_security": nonce,
    })
    response, _, _ = fetch_url(endpoint + separator + query, referer=page_url)
    try:
        payload = json.loads(response)
    except json.JSONDecodeError:
        return []
    if isinstance(payload, dict) and payload.get("type") == "FeatureCollection":
        return [payload]
    if isinstance(payload, dict) and isinstance(payload.get("map_data"), dict):
        data = payload["map_data"]
        if data.get("type") == "FeatureCollection":
            return [data]
    return []


def parse_route_page(route: dict) -> dict:
    page_url = route["url"]
    html, status, final_url = fetch_url(page_url)
    text = extract_text(html)
    title_match = re.search(r"<title[^>]*>(.*?)</title>", html, re.IGNORECASE | re.DOTALL)
    title = clean_space(title_match.group(1)) if title_match else None
    published_date = parse_french_date(text)
    itinerary = extract_itinerary_text(text)
    map_id = extract_map_id(html, final_url)
    payloads = extract_waymark_geojson(html)
    map_data_source = "inline_waymark_geojson" if payloads else None
    if not payloads:
        try:
            payloads = fetch_waymark_fallback(html, final_url, map_id)
            if payloads:
                map_data_source = "public_waymark_http_endpoint"
        except Exception as error:
            fallback_error = str(error)
        else:
            fallback_error = None
    else:
        fallback_error = None
    stats = geometry_type_counts(payloads)
    return {
        "line": route["line"],
        "url": final_url,
        "title": title,
        "httpStatus": status,
        "publishedDate": published_date,
        "itineraryText": itinerary,
        "itinerarySegments": split_route_segments(itinerary),
        "returnHints": extract_return_hints(itinerary),
        "mapId": map_id,
        "mapDataSource": map_data_source,
        "geojsonPayloadCount": len(payloads),
        "geojsonFeatureCount": stats["featureCount"],
        "geojsonGeometryTypes": stats["geometryTypes"],
        "geojson": payloads,
        "waymarkFallbackError": fallback_error,
    }


def scrape(index_url: str, workers: int = 3) -> dict:
    index_html, index_status, final_index_url = fetch_url(index_url)
    index = parse_index(index_html, final_index_url)
    routes = []
    errors = []
    with ThreadPoolExecutor(max_workers=max(1, workers)) as executor:
        futures = {
            executor.submit(parse_route_page, route): route
            for route in index["routePages"]
        }
        for future in as_completed(futures):
            route = futures[future]
            try:
                routes.append(future.result())
            except Exception as error:
                errors.append({
                    "line": route["line"],
                    "url": route["url"],
                    "error": str(error),
                })
    routes.sort(key=lambda item: (int(re.match(r"\d+", item["line"]).group()), item["line"]))
    summary = {
        "linesListed": len(index["linesListed"]),
        "linkedRoutePages": len(index["routePages"]),
        "routePagesFetched": len(routes),
        "routePagesWithItinerary": sum(bool(route["itineraryText"]) for route in routes),
        "routePagesWithGeoJSON": sum(bool(route["geojsonFeatureCount"]) for route in routes),
        "totalGeoJSONFeatures": sum(route["geojsonFeatureCount"] for route in routes),
        "totalLineGeometryFeatures": sum(
            sum(route["geojsonGeometryTypes"].get(kind, 0) for kind in ("LineString", "MultiLineString"))
            for route in routes
        ),
        "failedPages": len(errors),
        "linesWithoutRoutePage": index["linesWithoutRoutePage"],
    }
    return {
        "generatedAt": datetime.now(timezone.utc).isoformat(),
        "source": {
            "indexUrl": final_index_url,
            "operatorSite": "https://aftu-senegal.org/",
            "method": "Public AFTU route pages and Waymark map data; read-only extraction",
            "indexHttpStatus": index_status,
        },
        "summary": summary,
        "routes": routes,
        "errors": errors,
        "warning": (
            "AFTU website page count is not treated as the CETUD active-line count. "
            "Extracted map features remain candidates until road alignment, direction, "
            "stop order and current service operation are independently validated."
        ),
    }


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--index-url", default=DEFAULT_INDEX_URL)
    parser.add_argument("--output", required=True)
    parser.add_argument("--workers", type=int, default=3)
    args = parser.parse_args()
    report = scrape(args.index_url, args.workers)
    output = Path(args.output)
    output.parent.mkdir(parents=True, exist_ok=True)
    output.write_text(json.dumps(report, ensure_ascii=False) + "\n", encoding="utf-8")
    print(json.dumps(report["summary"], ensure_ascii=False))
    if report["summary"]["routePagesFetched"] == 0:
        return 1
    if report["summary"]["failedPages"] > max(3, report["summary"]["linkedRoutePages"] // 4):
        return 1
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
