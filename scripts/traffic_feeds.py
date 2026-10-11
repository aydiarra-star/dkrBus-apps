"""Fresh, normalized multisource traffic observations for Dakar.

Official websites are documentary channels, not invented realtime APIs. An
administrator must configure authorized JSON adapters for CETUD, TER, SunuBRT,
DDD and geolocated road traffic. Optional public-channel watch can supply
strictly dated bulletin excerpts with PARTIAL coverage. Without either method,
source state is NOT_CONFIGURED, never normal traffic. The server fetches all configured feeds concurrently for
EACH request; it never persists or falls back to an old incident snapshot.
"""
from __future__ import annotations

import ipaddress
import json
import math
import os
import re
import threading
from concurrent.futures import ThreadPoolExecutor
from dataclasses import dataclass
from datetime import datetime, timedelta, timezone
from pathlib import Path
from typing import Any, Callable, Mapping
from urllib.parse import parse_qs, urlparse
from urllib.request import HTTPRedirectHandler, Request, build_opener

TRAFFIC_ROUTE = "/api/traffic/alerts"
TRAFFIC_TTL = timedelta(hours=1)
FEED_TIMEOUT_SECONDS = 5
MAX_FEED_BYTES = 1_048_576
MAX_INCIDENTS = 500
NETWORK_IDS = frozenset({"ter", "brt", "ddd", "aftu", "tata", "other"})
SOURCES: dict[str, dict[str, str]] = {
    "ter": {"id": "ter", "kind": "OFFICIAL", "label": "SENTER / SETER (TER)", "url": "https://sentersa.sn"},
    "sunubrt": {"id": "sunubrt", "kind": "OFFICIAL", "label": "SunuBRT", "url": "https://sunubrt.sn"},
    "cetud": {"id": "cetud", "kind": "OFFICIAL", "label": "CETUD", "url": "https://cetud.sn"},
    "ddd": {"id": "ddd", "kind": "OFFICIAL", "label": "Dakar Dem Dikk", "url": "https://demdikk.sn"},
    "road": {"id": "road", "kind": "TRAFFIC", "label": "Trafic routier géolocalisé"},
}
INSTANT_RE = re.compile(r"^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,6})?(?:Z|[+-]\d{2}:\d{2})$")


def instant(value: Any) -> datetime | None:
    if not isinstance(value, str) or not INSTANT_RE.fullmatch(value):
        return None
    try:
        result = datetime.fromisoformat(value.replace("Z", "+00:00"))
        return result.astimezone(timezone.utc)
    except ValueError:
        return None


def fresh(value: Any, now: datetime) -> bool:
    at = instant(value)
    return at is not None and timedelta() <= now - at < TRAFFIC_TTL


def iso(at: datetime) -> str:
    return at.astimezone(timezone.utc).isoformat(timespec="milliseconds").replace("+00:00", "Z")


@dataclass(frozen=True)
class FeedConfig:
    source_id: str
    url: str
    token_env: str | None = None


def load_feed_config(path: str | Path | None) -> dict[str, FeedConfig]:
    if path is None:
        return {}
    raw_bytes = Path(path).read_bytes()
    if len(raw_bytes) > 128 * 1024:
        raise ValueError("Configuration trafic trop volumineuse.")
    raw = json.loads(raw_bytes)
    if not isinstance(raw, dict) or set(raw) - SOURCES.keys():
        raise ValueError("La configuration trafic ne peut déclarer que cetud, ter, sunubrt, ddd et road.")
    feeds = {}
    for source_id, entry in raw.items():
        if not isinstance(entry, dict) or set(entry) - {"url", "tokenEnv"}:
            raise ValueError(f"Configuration trafic invalide pour {source_id}.")
        url = entry.get("url")
        if not isinstance(url, str):
            raise ValueError(f"Une URL d'adaptateur HTTPS est exigée pour {source_id}.")
        parsed = urlparse(url)
        if parsed.scheme != "https" or not parsed.hostname or parsed.username or parsed.password or parsed.fragment:
            raise ValueError(f"Une URL d'adaptateur HTTPS sans identifiants intégrés est exigée pour {source_id}.")
        if parsed.hostname.lower() == "localhost" or parsed.hostname.lower().endswith(".localhost"):
            raise ValueError("Un adaptateur trafic ne peut pas viser la boucle locale.")
        try:
            address = ipaddress.ip_address(parsed.hostname)
        except ValueError:
            pass
        else:
            if not address.is_global:
                raise ValueError("Un adaptateur trafic doit viser un hôte public.")
        token_env = entry.get("tokenEnv")
        if token_env is not None and (not isinstance(token_env, str) or not re.fullmatch(r"[A-Z][A-Z0-9_]{0,79}", token_env)):
            raise ValueError(f"Nom de variable de secret invalide pour {source_id}.")
        feeds[source_id] = FeedConfig(source_id, url, token_env)
    return feeds


class NoFeedRedirect(HTTPRedirectHandler):
    def redirect_request(self, req: Any, fp: Any, code: int, msg: str, headers: Any, newurl: str) -> None:
        # Pas de redirection de secret, ni d'URL choisie par une réponse tierce.
        return None


def fetch_json_feed(config: FeedConfig) -> Any:
    headers = {"Accept": "application/json", "Cache-Control": "no-cache, no-store", "User-Agent": "DakarBus-Traffic/1"}
    if config.token_env:
        token = os.environ.get(config.token_env)
        if not token:
            raise ValueError("Secret de flux non configuré.")
        headers["Authorization"] = f"Bearer {token}"
    request = Request(config.url, headers=headers)
    with build_opener(NoFeedRedirect()).open(request, timeout=FEED_TIMEOUT_SECONDS) as response:
        if response.status != 200 or response.headers.get_content_type() != "application/json":
            raise ValueError("Le flux trafic n'est pas une réponse JSON exploitable.")
        body = response.read(MAX_FEED_BYTES + 1)
    if len(body) > MAX_FEED_BYTES:
        raise ValueError("Le flux trafic dépasse la limite de taille.")
    return json.loads(body)


def validate_traffic_query(query: str) -> None:
    """GPS facultatif ; aucune URL ou configuration ne vient d'un voyageur.

    Les adaptateurs fournissent le snapshot de toute la région de Dakar. Le
    navigateur géofiltre la route au dernier point GPS (même entre requêtes) ;
    les coordonnées personnelles ne sont pas transmises aux fournisseurs.
    """
    parameters = parse_qs(query, keep_blank_values=True)
    if set(parameters) - {"lat", "lon", "radius"}:
        raise ValueError("Paramètre trafic inconnu.")
    if ("lat" in parameters) != ("lon" in parameters) or ("radius" in parameters and "lat" not in parameters):
        raise ValueError("La localisation trafic exige lat et lon ensemble.")
    for name, limits in {"lat": (-90, 90), "lon": (-180, 180), "radius": (1, 5000)}.items():
        if name not in parameters:
            continue
        if len(parameters[name]) != 1:
            raise ValueError("Un seul point GPS est accepté.")
        try:
            value = float(parameters[name][0])
        except ValueError:
            raise ValueError("Coordonnées trafic invalides.") from None
        if not math.isfinite(value) or not limits[0] <= value <= limits[1]:
            raise ValueError("Coordonnées trafic hors limites.")


def _text(value: Any, maximum: int, *, optional: bool = False) -> str | None:
    if value is None and optional:
        return None
    if not isinstance(value, str) or len(value) > maximum or (not optional and not value.strip()):
        raise ValueError("Texte d'incident invalide.")
    return value.strip()


def _texts(value: Any) -> list[str]:
    if not isinstance(value, list) or len(value) > 120:
        raise ValueError("Liste d'incident invalide.")
    return list(dict.fromkeys(_text(item, 160) for item in value))  # type: ignore[arg-type]


def normalize_incident(value: Any, source_id: str) -> dict[str, Any]:
    if not isinstance(value, dict):
        raise ValueError("Incident invalide.")
    status = value.get("status")
    severity = value.get("severity", "info" if status != "ACTIVE" else None)
    if status not in ("ACTIVE", "RESOLVED", "UNCONFIRMED") or severity not in ("info", "warning", "critical"):
        raise ValueError("État d'incident invalide.")
    updated_at = value.get("updatedAt")
    confirmed_at = value.get("confirmedAt")
    expires_at = value.get("expiresAt")
    if instant(updated_at) is None or (confirmed_at is not None and instant(confirmed_at) is None) or (expires_at is not None and instant(expires_at) is None):
        raise ValueError("Horodatage d'incident invalide.")
    lat, lon = value.get("lat"), value.get("lon")
    if lat is not None or lon is not None:
        if any(isinstance(item, bool) or not isinstance(item, (int, float)) or not math.isfinite(item) for item in (lat, lon)) or not -90 <= lat <= 90 or not -180 <= lon <= 180:
            raise ValueError("Position d'incident invalide.")
    networks = _texts(value.get("affectedNetworks", []))
    if set(networks) - NETWORK_IDS:
        raise ValueError("Réseau d'incident inconnu.")
    stops = _texts(value.get("affectedStopIds", []))
    if status == "ACTIVE" and lat is None and (source_id == "road" or not networks):
        raise ValueError("Un incident actif doit être géolocalisé ou concerner un réseau identifié.")
    delay = value.get("delayMinutes")
    if delay is not None and (isinstance(delay, bool) or not isinstance(delay, (int, float)) or not math.isfinite(delay) or not 0 <= delay <= 1440):
        raise ValueError("Retard d'incident invalide.")
    return {
        "id": _text(value.get("id"), 160), "status": status, "severity": severity,
        "headlineFr": _text(value.get("headlineFr", ""), 160, optional=status != "ACTIVE") or "",
        "summaryFr": _text(value.get("summaryFr", ""), 1500, optional=status != "ACTIVE") or "",
        "headlineWo": _text(value.get("headlineWo", ""), 160, optional=True) or "",
        "summaryWo": _text(value.get("summaryWo", ""), 1500, optional=True) or "",
        "recommendationFr": _text(value.get("recommendationFr"), 1500, optional=True),
        "recommendationWo": _text(value.get("recommendationWo"), 1500, optional=True),
        "source": dict(SOURCES[source_id]), "affectedNetworks": networks,
        "affectedLines": _texts(value.get("affectedLines", [])), "affectedStopIds": stops,
        "lat": lat, "lon": lon, "delayMinutes": delay,
        "updatedAt": updated_at, "confirmedAt": confirmed_at, "expiresAt": expires_at,
    }


def active_incident(alert: dict[str, Any], now: datetime) -> bool:
    expires_at = instant(alert["expiresAt"])
    return (alert["status"] == "ACTIVE" and fresh(alert["updatedAt"], now) and fresh(alert["confirmedAt"], now)
            and (alert["expiresAt"] is None or expires_at is not None and expires_at > now))


class TrafficFeedService:
    def __init__(self, feeds: Mapping[str, FeedConfig] | None = None, *, fetcher: Callable[[FeedConfig], Any] = fetch_json_feed,
                 public_watch: Callable[[str, datetime | None], dict[str, Any]] | None = None):
        self.feeds = dict(feeds or {})
        if set(self.feeds) - SOURCES.keys():
            raise ValueError("Source trafic inconnue.")
        self.fetcher = fetcher
        self.public_watch = public_watch
        # Seulement des tombstones de résolution/retrait de confirmation (pas
        # d'historique) : un flux retardataire ne ressuscite pas un état retiré.
        self._withdrawn: dict[str, datetime] = {}
        self._lock = threading.Lock()

    @classmethod
    def from_config(cls, path: str | Path | None = None, *, public_watch: bool = False) -> TrafficFeedService:
        fallback = None
        if public_watch:
            if __package__ in (None, ""):
                from public_traffic_watch import PublicTrafficWatch
            else:
                from .public_traffic_watch import PublicTrafficWatch
            fallback = PublicTrafficWatch().source_snapshot
        return cls(load_feed_config(path or os.environ.get("DAKAR_TRAFFIC_FEEDS_FILE")), public_watch=fallback)

    def _source_snapshot(self, source_id: str, now: datetime | None) -> tuple[dict[str, Any], list[dict[str, Any]]]:
        state = {"id": source_id, "status": "NOT_CONFIGURED", "checkedAt": None}
        config = self.feeds.get(source_id)
        if config is None and self.public_watch is None:
            return state, []
        try:
            if config is None:
                observation = self.public_watch(source_id, now)
                if observation.get("status") not in ("PARTIAL", "STALE", "UNAVAILABLE"):
                    raise ValueError("État de veille publique invalide.")
                state.update(status=observation["status"], checkedAt=observation.get("observedAt"), channel="PUBLIC_WATCH")
                if state["checkedAt"] is not None and instant(state["checkedAt"]) is None:
                    raise ValueError("Date de veille publique invalide.")
                if state["status"] != "PARTIAL":
                    return state, []
                payload = {**observation, "region": "Dakar", "complete": False}
            else:
                # A configured authenticated feed is never silently replaced by
                # scraping if it fails; provenance and completeness stay honest.
                payload = self.fetcher(config)
            now = now or datetime.now(timezone.utc)
            if not isinstance(payload, dict) or payload.get("region") != "Dakar" or not isinstance(payload.get("complete"), bool):
                raise ValueError("Snapshot régional invalide.")
            observed_at = payload.get("observedAt")
            if instant(observed_at) is None:
                raise ValueError("Date de vérification absente.")
            state["checkedAt"] = observed_at
            if not fresh(observed_at, now):
                state["status"] = "STALE"
                return state, []
            items = payload.get("incidents")
            if not isinstance(items, list) or len(items) > MAX_INCIDENTS:
                raise ValueError("Liste d'incidents invalide.")
            state["status"] = "LIVE" if payload["complete"] else "PARTIAL"
            alerts = []
            for item in items:
                alert = normalize_incident(item, source_id)
                updated = instant(alert["updatedAt"])
                confirmed = instant(alert["confirmedAt"])
                if updated > instant(observed_at) or (confirmed is not None and confirmed > instant(observed_at)):
                    state["status"] = "PARTIAL"
                    continue
                if alert["status"] == "UNCONFIRMED" or (alert["status"] == "ACTIVE" and not active_incident(alert, now)):
                    state["status"] = "PARTIAL"
                if fresh(alert["updatedAt"], now):
                    alerts.append(alert)
            return state, alerts
        except Exception:
            # Pas de corps/URL/secret de fournisseur dans les réponses publiques.
            return {"id": source_id, "status": "UNAVAILABLE", "checkedAt": None}, []

    def snapshot(self, *, now: datetime | None = None) -> dict[str, Any]:
        # Les cinq requêtes sont indépendantes : un opérateur en panne ne bloque
        # ni le trafic routier, ni les autres opérateurs.
        with ThreadPoolExecutor(max_workers=len(SOURCES)) as executor:
            results = list(executor.map(lambda source_id: self._source_snapshot(source_id, now), SOURCES))
        at = (now or datetime.now(timezone.utc)).astimezone(timezone.utc)
        states = [result[0] for result in results]
        for state in states:
            if state["status"] in ("LIVE", "PARTIAL") and not fresh(state["checkedAt"], at):
                state["status"] = "STALE"
        records = []
        for state, source_alerts in results:
            if state["status"] not in ("LIVE", "PARTIAL"):
                continue
            for alert in source_alerts:
                # La preuve peut expirer pendant la lecture d'un autre opérateur.
                if alert["status"] == "ACTIVE" and not active_incident(alert, at):
                    state["status"] = "PARTIAL"
                if fresh(alert["updatedAt"], at):
                    records.append(alert)
        groups: dict[str, list[dict[str, Any]]] = {}
        for alert in records:
            groups.setdefault(alert["id"], []).append(alert)
        alerts = []
        with self._lock:
            self._withdrawn = {key: timestamp for key, timestamp in self._withdrawn.items() if timedelta() <= at - timestamp < TRAFFIC_TTL}
            for alert in records:
                if not active_incident(alert, at):
                    timestamp = instant(alert["updatedAt"])
                    self._withdrawn[alert["id"]] = max(timestamp, self._withdrawn.get(alert["id"], timestamp))
            # État le plus récent ; à égalité une résolution gagne toujours.
            state_priority = {"ACTIVE": 0, "UNCONFIRMED": 1, "RESOLVED": 2}
            for incident_id, entries in groups.items():
                latest = max(entries, key=lambda entry: (instant(entry["updatedAt"]), state_priority[entry["status"]], entry["source"]["kind"] == "OFFICIAL"))
                withdrawal = self._withdrawn.get(incident_id)
                if not active_incident(latest, at) or withdrawal is not None and instant(latest["updatedAt"]) <= withdrawal:
                    continue
                confirmed = [entry for entry in entries if active_incident(entry, at)]
                latest = dict(latest)
                latest["corroboratingSources"] = list({entry["source"]["id"]: entry["source"] for entry in confirmed if entry["source"]["id"] != latest["source"]["id"]}.values())
                for field in ("affectedNetworks", "affectedLines", "affectedStopIds"):
                    latest[field] = list(dict.fromkeys(value for entry in confirmed for value in entry[field]))[:120]
                # Chaque fait consolidé doit rester frais (y compris la
                # provenance et les lignes apportées par une seconde source).
                expiry = min(min(instant(entry["updatedAt"]) + TRAFFIC_TTL, instant(entry["confirmedAt"]) + TRAFFIC_TTL,
                                 instant(entry["expiresAt"]) or datetime.max.replace(tzinfo=timezone.utc)) for entry in confirmed)
                latest["expiresAt"] = iso(expiry)
                alerts.append(latest)
            self._withdrawn = dict(sorted(self._withdrawn.items(), key=lambda item: item[1], reverse=True)[:MAX_INCIDENTS])
        if len(alerts) > MAX_INCIDENTS:
            # Une réponse tronquée n'est jamais une preuve de trafic fluide.
            for state in states:
                if state["status"] == "LIVE":
                    state["status"] = "PARTIAL"
        # Horodatage de l'enveloppe uniquement ; les preuves source restent intactes.
        return {"region": "Dakar", "generatedAt": iso(at), "sources": states, "alerts": alerts[:MAX_INCIDENTS]}
