"""Read-only audit of real public Dakar traffic candidates, NOT an alert feed.

Discovered endpoints and provenance are documented in
``docs/acces-flux-reels-2026-10-11.md``. A successful HTTP read does not establish
freshness, geographic completeness, re-use rights or operator API credentials.
Nothing returned by this command is published to /api/traffic/alerts.
"""
from __future__ import annotations

import argparse
import json
import re
from concurrent.futures import ThreadPoolExecutor
from dataclasses import dataclass
from datetime import datetime, timezone
from html import unescape
from typing import Any, Callable
from urllib.error import HTTPError
from urllib.request import Request, build_opener
from zoneinfo import ZoneInfo

if __package__ in (None, ""):
    from traffic_feeds import FEED_TIMEOUT_SECONDS, MAX_FEED_BYTES, NoFeedRedirect, iso
else:
    from .traffic_feeds import FEED_TIMEOUT_SECONDS, MAX_FEED_BYTES, NoFeedRedirect, iso


@dataclass(frozen=True)
class Candidate:
    source_id: str
    url: str
    kind: str


# These are verified public URLs, not guessed operator endpoints. Do not accept
# arbitrary URLs, auth cookies or a URL supplied by a passenger.
CANDIDATES = {
    "cetud": Candidate("cetud", "https://cetud.sn/wp-json/wp/v2/posts?per_page=3&_fields=id,date_gmt,modified_gmt,title,link", "editorial"),
    "ter": Candidate("ter", "https://www.terdakar.sn/toute-l-info-trafic/", "html"),
    "sunubrt": Candidate("sunubrt", "https://www.sunubrt.sn/wp-json/", "unknown"),
    "ddd": Candidate("ddd", "https://demdikk.sn/wp-json/", "unknown"),
    "road": Candidate("road", "https://www.autoroutedelavenir.sn/wp-json/trafic-avenir/v1/state", "secaa"),
}
SECAA_TIMEZONE_URL = "https://www.autoroutedelavenir.sn/wp-json/?_fields=gmt_offset,timezone_string"
# Same registered WordPress posts endpoint, including the bulletin content.
CETUD_WATCH_URL = "https://cetud.sn/wp-json/wp/v2/posts?per_page=10&_fields=id,date_gmt,modified_gmt,title,content,link"


@dataclass(frozen=True)
class Response:
    status: int
    content_type: str
    body: str


def read_public_url(url: str) -> Response:
    allowed = {candidate.url for candidate in CANDIDATES.values()} | {SECAA_TIMEZONE_URL, CETUD_WATCH_URL}
    if url not in allowed:
        raise ValueError("Seules les URL publiques du registre d'audit sont acceptées.")
    request = Request(url, headers={
        "Accept": "application/json,text/html", "Cache-Control": "no-cache, no-store",
        "User-Agent": "DakarBus-SourceAudit/1",
    })
    try:
        response = build_opener(NoFeedRedirect()).open(request, timeout=FEED_TIMEOUT_SECONDS)
    except HTTPError as error:
        response = error
    with response:
        body = response.read(MAX_FEED_BYTES + 1)
        if len(body) > MAX_FEED_BYTES:
            raise ValueError("Réponse d'audit trop volumineuse.")
        return Response(response.code, response.headers.get_content_type(), body.decode("utf-8"))


def _json(response: Response) -> Any:
    return json.loads(response.body)


def inspect_response(candidate: Candidate, response: Response, now: datetime, *, source_timezone: dict[str, Any] | None = None) -> dict[str, Any]:
    """Classify access separately from proof; never issue a LIVE status."""
    result: dict[str, Any] = {
        "source": candidate.source_id, "url": candidate.url,
        "httpStatus": response.status, "readAccess": False,
        "classification": "UNAVAILABLE", "eligibleForLiveTraffic": False,
        "reuseRightsVerified": False,
    }
    if response.status in (401, 403):
        result["classification"] = "AUTHENTICATION_OR_PERMISSION_REQUIRED"
        return result
    if 300 <= response.status < 400:
        result["classification"] = "REDIRECT_NOT_FOLLOWED"
        return result
    if not 200 <= response.status < 300:
        if response.status == 503 and response.content_type == "text/html" and "maintenance" in response.body.lower():
            result["classification"] = "MAINTENANCE"
        return result
    result["readAccess"] = True
    if response.content_type == "application/json":
        try:
            payload = _json(response)
        except (ValueError, TypeError):
            result["classification"] = "INVALID_JSON"
            return result
        # Some gateways wrap REST denial in a successful HTTP response.
        if isinstance(payload, dict) and payload.get("code") in ("rest_login_required", "rest_not_logged_in", "rest_forbidden"):
            result.update(readAccess=False, classification="AUTHENTICATION_OR_PERMISSION_REQUIRED")
        elif candidate.kind == "editorial" and isinstance(payload, list) and all(isinstance(post, dict) and isinstance(post.get("date_gmt"), str) for post in payload):
            result.update(classification="PUBLIC_EDITORIAL_API", trafficSnapshotComplete=False)
            result["latestPublicationRaw"] = payload[0]["date_gmt"] if payload else None
        elif candidate.kind == "secaa" and isinstance(payload, dict) and payload.get("success") is True and isinstance(payload.get("state"), dict) and isinstance(payload.get("incidents"), list):
            result.update(classification="PUBLIC_ROAD_STATE_API", coverage="AUTOROUTE_ONLY", trafficSnapshotComplete=False)
            result["lastOperatorUpdateRaw"] = payload.get("updated_at")
            result["reportedIncidentCount"] = len(payload["incidents"])
            # The verified native schema gives places/PKs, not GPS coordinates.
            # Do not convert names, PKs or map colors into invented points.
            result["incidentGpsVerified"] = False
            result["freshness"] = "TIMESTAMP_OR_TIMEZONE_UNVERIFIED"
            # Re-read the publisher's timezone setting; never assume that a
            # naive SQL timestamp has UTC semantics just because it was fetched.
            if source_timezone and source_timezone.get("timezone_string") == "Africa/Dakar" and type(source_timezone.get("gmt_offset")) in (int, float) and source_timezone["gmt_offset"] == 0:
                raw = payload.get("updated_at")
                if isinstance(raw, str) and re.fullmatch(r"\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}", raw):
                    try:
                        at = datetime.strptime(raw, "%Y-%m-%d %H:%M:%S").replace(tzinfo=ZoneInfo("Africa/Dakar"))
                        age = (now - at).total_seconds()
                        result["lastOperatorUpdateUtc"] = iso(at)
                        result["freshness"] = "FUTURE" if age < 0 else "STALE" if age >= 3600 else "RECENT_PARTIAL"
                    except (ValueError, KeyError):
                        pass
        else:
            result["classification"] = "UNVERIFIED_JSON_API"
    elif response.content_type == "text/html":
        text = " ".join(unescape(re.sub(r"<[^>]*>", " ", response.body)).lower().split())
        result["classification"] = "MAINTENANCE" if "site est actuellement en maintenance" in text else "PUBLIC_HTML_NOT_A_VERIFIED_FEED"
        result["trafficSnapshotComplete"] = False
    else:
        result["classification"] = "UNSUPPORTED_FORMAT"
    return result


def probe(candidate: Candidate, now: datetime, reader: Callable[[str], Response] = read_public_url) -> dict[str, Any]:
    try:
        response = reader(candidate.url)
        metadata = None
        if candidate.kind == "secaa" and response.status == 200 and response.content_type == "application/json":
            try:
                timezone_response = reader(SECAA_TIMEZONE_URL)
                if timezone_response.status == 200 and timezone_response.content_type == "application/json":
                    parsed = _json(timezone_response)
                    if isinstance(parsed, dict):
                        metadata = parsed
            except Exception:
                pass  # Access may work even if the source clock cannot be checked.
        return inspect_response(candidate, response, now, source_timezone=metadata)
    except Exception:
        # No remote bodies, authentication headers or raw exception messages in
        # the output. Network failure is not evidence that no feed exists.
        return {"source": candidate.source_id, "url": candidate.url, "httpStatus": None,
                "readAccess": False, "classification": "NETWORK_OR_RESPONSE_ERROR",
                "eligibleForLiveTraffic": False, "reuseRightsVerified": False}


def audit(source_ids: list[str], *, now: datetime | None = None, reader: Callable[[str], Response] = read_public_url) -> dict[str, Any]:
    if not source_ids or len(source_ids) != len(set(source_ids)) or set(source_ids) - CANDIDATES.keys():
        raise ValueError("Sélection d'audit invalide.")
    now = now or datetime.now(timezone.utc)
    with ThreadPoolExecutor(max_workers=len(source_ids)) as pool:
        sources = list(pool.map(lambda source_id: probe(CANDIDATES[source_id], now, reader), source_ids))
    return {"auditVersion": 1, "auditedAt": iso(now), "purpose": "ACCESS_RESEARCH_NOT_ALERTS",
            "allFiveRealtimeFeedsVerified": False, "sources": sources}


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--source", choices=list(CANDIDATES), action="append", help="Source à auditer ; toutes par défaut.")
    args = parser.parse_args()
    report = audit(args.source or list(CANDIDATES))
    print(json.dumps(report, ensure_ascii=False, indent=2))
    # The objective is five usable realtime feeds, not five successful downloads.
    return 0 if report["allFiveRealtimeFeedsVerified"] else 1


if __name__ == "__main__":
    raise SystemExit(main())
