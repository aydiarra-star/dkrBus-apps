"""Conservative watch of registered PUBLIC operator channels, never a full feed.

Only an explicitly dated, fresh traffic bulletin declaring a current incident
is extracted. News, undated HTML, maintenance, future plans and old republications
are not live evidence. No login, social-network bypass, geocoding or LLM is used.
Public watch is opt-in on the server; private normalized feeds take precedence.
"""
from __future__ import annotations

import argparse
import hashlib
import json
import re
import unicodedata
from datetime import datetime, timezone
from html import unescape
from html.parser import HTMLParser
from typing import Any, Callable

if __package__ in (None, ""):
    from probe_traffic_access import CANDIDATES, SECAA_TIMEZONE_URL, CETUD_WATCH_URL, Response, read_public_url
    from traffic_feeds import SOURCES, TRAFFIC_TTL, fresh, instant, iso, normalize_incident
else:
    from .probe_traffic_access import CANDIDATES, SECAA_TIMEZONE_URL, CETUD_WATCH_URL, Response, read_public_url
    from .traffic_feeds import SOURCES, TRAFFIC_TTL, fresh, instant, iso, normalize_incident

WATCH_URLS = {key: candidate.url for key, candidate in CANDIDATES.items()}
WATCH_URLS["cetud"] = CETUD_WATCH_URL
MAX_BULLETINS = 50


class VisibleText(HTMLParser):
    def __init__(self) -> None:
        super().__init__(convert_charrefs=True)
        self.parts: list[str] = []
        self.hidden = 0

    def handle_starttag(self, tag: str, attrs: list[tuple[str, str | None]]) -> None:
        if tag in ("script", "style"):
            self.hidden += 1
        elif tag in ("p", "br", "div", "li", "h1", "h2", "h3") and not self.hidden:
            self.parts.append(" ")

    def handle_endtag(self, tag: str) -> None:
        if tag in ("script", "style"):
            self.hidden = max(0, self.hidden - 1)
        elif not self.hidden:
            self.parts.append(" ")

    def handle_data(self, data: str) -> None:
        if not self.hidden:
            self.parts.append(data)


def plain(value: Any) -> str:
    if not isinstance(value, str):
        return ""
    parser = VisibleText()
    parser.feed(value)
    return " ".join(unescape("".join(parser.parts)).split())


def normalized(value: str) -> str:
    return "".join(char for char in unicodedata.normalize("NFD", value.lower()) if unicodedata.category(char) != "Mn").replace("’", "'")


class BulletinJsonLd(HTMLParser):
    """Read only dated Article/NewsArticle objects, never a page/footer clock."""
    def __init__(self) -> None:
        super().__init__()
        self.capture = False
        self.parts: list[str] = []
        self.documents: list[Any] = []

    def handle_starttag(self, tag: str, attrs: list[tuple[str, str | None]]) -> None:
        if tag == "script" and dict(attrs).get("type", "").lower() == "application/ld+json":
            self.capture = True
            self.parts = []

    def handle_data(self, data: str) -> None:
        if self.capture:
            self.parts.append(data)

    def handle_endtag(self, tag: str) -> None:
        if tag == "script" and self.capture:
            self.capture = False
            try:
                self.documents.append(json.loads("".join(self.parts)))
            except ValueError:
                pass


def json_ld_articles(value: Any, depth: int = 0) -> list[dict[str, Any]]:
    if depth > 6:
        return []
    if isinstance(value, list):
        return [article for child in value[:MAX_BULLETINS] for article in json_ld_articles(child, depth + 1)][:MAX_BULLETINS]
    if not isinstance(value, dict):
        return []
    types = value.get("@type", [])
    types = types if isinstance(types, list) else [types]
    if any(kind in ("NewsArticle", "Article") for kind in types):
        return [value]
    return json_ld_articles(value.get("@graph"), depth + 1)


def wordpress_instant(value: Any) -> str | None:
    # WordPress date_gmt is documented UTC, unlike an arbitrary naive date.
    if not isinstance(value, str) or not re.fullmatch(r"\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}", value):
        return None
    return value + "Z" if instant(value + "Z") is not None else None


def mentions_other_day(text: str, now: datetime) -> bool:
    """A fresh post about another day is NOT a current observation."""
    words = normalized(text)
    months = {"janvier": 1, "fevrier": 2, "mars": 3, "avril": 4, "mai": 5, "juin": 6,
              "juillet": 7, "aout": 8, "septembre": 9, "octobre": 10, "novembre": 11, "decembre": 12}
    today = now.astimezone(timezone.utc).date()  # Dakar's verified UTC civil date.
    dates = [(int(year), int(month), int(day)) for year, month, day in re.findall(r"\b(\d{4})-(\d{2})-(\d{2})\b", words)]
    dates += [(int(year), int(month), int(day)) for day, month, year in re.findall(r"\b(\d{1,2})/(\d{1,2})/(\d{4})\b", words)]
    for day, month, year in re.findall(r"\b(\d{1,2})\s+(" + "|".join(months) + r")(?:\s+(\d{4}))?\b", words):
        dates.append((int(year or today.year), months[month], int(day)))
    for year, month, day in dates:
        try:
            if datetime(year, month, day).date() != today:
                return True
        except ValueError:
            return True
    return False


def bulletin_state(title: str, body: str) -> str | None:
    heading, text = normalized(title), normalized(f"{title}. {body}")
    # Require a traffic-bulletin heading and explicit present-tense facts.
    if not re.search(r"\b(info(?:rmation)?[ -]trafic|alerte(?: de)? trafic|perturbations?|incident(?:s)? en cours)\b", heading):
        return None
    if re.search(r"\b(demain|hier|prevu(?:e|s|es)?|prevision|simulation|exercice|pourrait|sera|seront|historique|bilan|archives?|conditionnel|rumeur|non confirme|non verifie|chaque|habituellement|suppose)\b", text):
        return None
    if re.search(r"\b(?:aucune perturbation|trafic (?:est |redevenu )?normal|circulation (?:est )?fluide|incident (?:est )?resolu|reprise du trafic)\b", text):
        if re.search(r"\b(?:ne|pas|sans garantie)\b", text):
            return None
        return "RESOLVED"
    # Negation/uncertainty is not an assertion of a current incident.
    if re.search(r"\b(?:pas|aucun|aucune|ne|peut|possible|eventuel(?:le)?|risque)\b", text):
        return None
    if re.search(r"\b(?:trafic|circulation|service) (?:est |reste )(?:perturbe[es]*|ralenti[es]*|interrompu[es]*|suspendu[es]*)\b", text):
        return "ACTIVE"
    if re.search(r"\b(?:route|voie|ligne) (?:[\w-]+ )?(?:est |reste )(?:coupee?|fermee?|bloquee?)\b", text):
        return "ACTIVE"
    return None


def bulletin_networks(source_id: str, text: str) -> list[str]:
    if source_id in ("ter", "sunubrt", "ddd"):
        return [{"ter": "ter", "sunubrt": "brt", "ddd": "ddd"}[source_id]]
    words = normalized(text)
    return [network for network, pattern in (("ter", r"\bter\b"), ("brt", r"\b(?:brt|sunubrt)\b"), ("ddd", r"\b(?:ddd|dem dikk|demdikk)\b")) if re.search(pattern, words)]


def extract_bulletins(source_id: str, response: Response, now: datetime) -> list[dict[str, Any]]:
    articles: list[dict[str, Any]] = []
    if source_id == "cetud" and response.content_type == "application/json":
        payload = json.loads(response.body)
        if not isinstance(payload, list):
            return []
        for post in payload[:MAX_BULLETINS]:
            if not isinstance(post, dict):
                continue
            title, content = post.get("title"), post.get("content")
            articles.append({"headline": title.get("rendered") if isinstance(title, dict) else title,
                             "articleBody": content.get("rendered") if isinstance(content, dict) else content,
                             "datePublished": wordpress_instant(post.get("date_gmt")),
                             "identifier": str(post.get("id", ""))})
    elif response.content_type == "text/html":
        parser = BulletinJsonLd()
        parser.feed(response.body)
        articles = json_ld_articles(parser.documents)
    result = []
    full_resolutions: set[str] = set()
    for article in articles:
        published = article.get("datePublished")
        # Modifying/re-fetching yesterday's article never revives it.
        if not fresh(published, now):
            continue
        title, text = plain(article.get("headline")), plain(article.get("articleBody"))
        state = None if mentions_other_day(f"{title} {text}", now) else bulletin_state(title, text)
        networks = bulletin_networks(source_id, f"{title} {text}")
        if state is None or not networks:
            continue
        stable_id = str(article.get("identifier") or article.get("@id") or title)
        identifier = hashlib.sha256(stable_id.encode()).hexdigest()[:24]
        # A local "normal at station X" bulletin must not withdraw an
        # unrelated event elsewhere. Only explicit network-wide all-clears
        # can supersede different bulletin ids.
        scope_text = normalized(f"{title} {text}")
        if state == "RESOLVED" and re.search(r"\bsur (?:l'ensemble (?:du |des ))?(?:le reseau|tout le reseau|le ter|le brt)\b", scope_text) and not re.search(r"\b(?:entre|gare|station|troncon|portion|sauf|hors|partiel)\b", scope_text):
            full_resolutions.add(f"public-{source_id}-{identifier}")
        result.append(normalize_incident({
            "id": f"public-{source_id}-{identifier}", "status": state, "severity": "warning",
            "headlineFr": title[:160],
            "summaryFr": f"Veille publique · annonce officielle horodatée : « {(text or title)[:300]} »",
            "updatedAt": published, "confirmedAt": published if state == "ACTIVE" else None,
            "expiresAt": iso(instant(published) + TRAFFIC_TTL),
            "affectedNetworks": networks, "affectedLines": [], "affectedStopIds": [],
            "recommendationFr": "Consultez le bulletin de votre opérateur avant de partir.",
        }, source_id))
    # A newer explicit all-clear supersedes older bulletins for the SAME network,
    # not an unrelated operator. Do not infer a resolution from disappearance.
    resolutions: dict[str, datetime] = {}
    for item in result:
        if item["status"] == "RESOLVED" and item["id"] in full_resolutions:
            for network in item["affectedNetworks"]:
                stamp = instant(item["updatedAt"])
                resolutions[network] = max(stamp, resolutions.get(network, stamp))
    reconciled = []
    for item in result:
        if item["status"] != "ACTIVE":
            reconciled.append(item)
            continue
        remaining = [network for network in item["affectedNetworks"] if network not in resolutions or instant(item["updatedAt"]) > resolutions[network]]
        if remaining:
            reconciled.append({**item, "affectedNetworks": remaining})
        else:
            # Canonical tombstone for the previous bulletin: a delayed channel
            # cannot resurrect it after a known, newer explicit resolution.
            resolved_at = max(resolutions[network] for network in item["affectedNetworks"])
            reconciled.append({**item, "status": "RESOLVED", "confirmedAt": None,
                               "updatedAt": iso(resolved_at), "expiresAt": iso(resolved_at + TRAFFIC_TTL)})
    return reconciled


class PublicTrafficWatch:
    def __init__(self, *, reader: Callable[[str], Response] = read_public_url) -> None:
        self.reader = reader

    def source_snapshot(self, source_id: str, now: datetime | None = None) -> dict[str, Any]:
        if source_id not in WATCH_URLS:
            raise ValueError("Canal public inconnu.")
        result: dict[str, Any] = {"status": "UNAVAILABLE", "observedAt": None, "incidents": []}
        try:
            response = self.reader(WATCH_URLS[source_id])
            at = now or datetime.now(timezone.utc)
            if response.status != 200:
                return result
            if source_id == "road":
                payload = json.loads(response.body) if response.content_type == "application/json" else None
                if not isinstance(payload, dict) or payload.get("success") is not True or not isinstance(payload.get("incidents"), list):
                    return result
                zone_response = self.reader(SECAA_TIMEZONE_URL)
                zone = json.loads(zone_response.body) if zone_response.status == 200 and zone_response.content_type == "application/json" else None
                if not isinstance(zone, dict) or zone.get("timezone_string") != "Africa/Dakar" or type(zone.get("gmt_offset")) not in (int, float) or zone["gmt_offset"] != 0:
                    return result
                raw = payload.get("updated_at")
                if not isinstance(raw, str) or not re.fullmatch(r"\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}", raw):
                    return result
                stamp = raw.replace(" ", "T") + "Z"
                if instant(stamp) is None:
                    return result
                result.update(status="PARTIAL" if fresh(stamp, at) else "STALE", observedAt=stamp)
                # Native incident places/PKs are not GPS nor explicit confirmation.
                # Until an authorized georeferenced adapter exists, NO road alert
                # is published from this payload, even when the state is recent.
                return result
            items = extract_bulletins(source_id, response, at)
            if items:
                result.update(status="PARTIAL", observedAt=min((item["updatedAt"] for item in items), key=instant), incidents=items)
        except Exception:
            # No stale cache, remote error body, secret or inferred all-clear.
            pass
        return result


def main() -> int:
    if __package__ in (None, ""):
        from traffic_feeds import TrafficFeedService
    else:
        from .traffic_feeds import TrafficFeedService
    parser = argparse.ArgumentParser(description=__doc__)
    parser.parse_args()
    watch = PublicTrafficWatch()
    print(json.dumps(TrafficFeedService(public_watch=watch.source_snapshot).snapshot(), ensure_ascii=False, indent=2))
    return 0  # Partial/unavailable coverage is reported in source states, not hidden.


if __name__ == "__main__":
    raise SystemExit(main())
