"""Short-lived shared Direct rue reports; form validation is NOT fact checking.

No operator/AI verification is claimed. Reports are anonymous and expire exactly
one hour after server receipt. Ownership is a per-report opaque delete capability;
only its hash is stored server-side, never included in public reads. No passenger
GPS is fetched automatically or forwarded to an operator/LLM.
"""
from __future__ import annotations

import hashlib
import hmac
import json
import math
import re
import secrets
import sqlite3
import threading
from collections import defaultdict, deque
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

if __package__ in (None, ""):
    from traffic_feeds import NETWORK_IDS, TRAFFIC_TTL, iso
else:
    from .traffic_feeds import NETWORK_IDS, TRAFFIC_TTL, iso

COMMUNITY_ROUTE = "/api/traffic/community"
COMMUNITY_HEADER = "X-Dakar-Community"
REPORT_KEY_HEADER = "X-Dakar-Report-Key"
MAX_COMMUNITY_BODY_BYTES = 4096
MAX_SHARED_REPORTS = 500
MAX_WRITES_PER_MINUTE = 5
MAX_RATE_CLIENTS = 2048
KINDS = {"CONGESTION": "Embouteillage", "INCIDENT": "Incident", "ROADWORK": "Travaux", "BLOCKED": "Route coupée", "OTHER": "Autre"}
REPORT_ID_RE = re.compile(r"^cr_[0-9a-f]{32}$")
KEY_RE = re.compile(r"^[0-9a-f]{64}$")


class CommunityError(ValueError):
    def __init__(self, status: int, code: str, message: str):
        super().__init__(message)
        self.status, self.code, self.message = status, code, message


def clean_text(value: Any, name: str, minimum: int, maximum: int, *, optional: bool = False) -> str | None:
    if optional and value in (None, ""):
        return None
    if not isinstance(value, str):
        raise CommunityError(422, "INVALID_REPORT", f"Le champ {name} est invalide.")
    if re.search(r"[\x00-\x08\x0b\x0c\x0e-\x1f\x7f]", value) or re.search(r"<\s*/?\s*[a-z!]", value, re.I):
        raise CommunityError(422, "INVALID_REPORT", "Le signalement doit contenir du texte simple, sans balises ni caractères de contrôle.")
    text = " ".join(value.split())
    if not minimum <= len(text) <= maximum:
        raise CommunityError(422, "INVALID_REPORT", f"Le champ {name} doit contenir de {minimum} à {maximum} caractères.")
    return text


def validate_draft(value: Any) -> dict[str, Any]:
    if not isinstance(value, dict) or set(value) - {"kind", "place", "networkId", "comment", "lat", "lng"}:
        raise CommunityError(422, "INVALID_REPORT", "Seuls les champs du formulaire Direct rue sont acceptés ; les dates et la provenance sont attribuées par le serveur.")
    kind = value.get("kind")
    if not isinstance(kind, str) or kind not in KINDS:
        raise CommunityError(422, "INVALID_REPORT", "Choisissez une catégorie connue.")
    network = value.get("networkId")
    if network is not None and (not isinstance(network, str) or network not in NETWORK_IDS):
        raise CommunityError(422, "INVALID_REPORT", "Réseau inconnu.")
    lat, lng = value.get("lat"), value.get("lng")
    if lat is not None or lng is not None:
        if any(isinstance(item, bool) or not isinstance(item, (int, float)) or not math.isfinite(item) for item in (lat, lng)):
            raise CommunityError(422, "INVALID_REPORT", "La position exige deux coordonnées valides.")
        # Broad Dakar + access corridors, not a fabricated geocoding of the place.
        if not (14.5 <= lat <= 15.05 and -17.7 <= lng <= -16.8):
            raise CommunityError(422, "INVALID_REPORT", "La position jointe doit être dans la région de Dakar. Retirez-la si vous signalez sans être sur place.")
    return {"kind": kind, "place": clean_text(value.get("place"), "portion de route", 3, 80),
            "comment": clean_text(value.get("comment"), "précision", 1, 140, optional=True),
            "networkId": network, "lat": lat, "lng": lng}


def assistant_presentation(draft: dict[str, Any]) -> dict[str, Any]:
    # Fixed local templates, not a remote LLM and not an authority/confirmation.
    return {"headlineFr": f"{KINDS[draft['kind']]} · {draft['place']}",
            "summaryFr": f"{KINDS[draft['kind']]} signalé par un usager à {draft['place']}."
                         + (f" Précision de l’usager : « {draft['comment']} »." if draft["comment"] else "")
                         + " Témoignage non vérifié, pas une alerte officielle.",
            "validation": "FORM_CHECKED", "factsVerified": False, "method": "LOCAL_ASSISTANT_RULES"}


class CommunityReportStore:
    def __init__(self, root: str | Path):
        self.path = Path(root) / "reports.sqlite"
        self._lock = threading.RLock()
        self._rates: dict[str, deque[float]] = defaultdict(deque)
        self._rate_salt = secrets.token_bytes(32)

    def _connect(self) -> sqlite3.Connection:
        self.path.parent.mkdir(parents=True, exist_ok=True)
        connection = sqlite3.connect(self.path, timeout=5)
        connection.execute("PRAGMA secure_delete = ON")
        connection.execute("CREATE TABLE IF NOT EXISTS reports (id TEXT PRIMARY KEY, body TEXT NOT NULL, delete_hash TEXT NOT NULL, created_at REAL NOT NULL, expires_at REAL NOT NULL)")
        try:
            self.path.chmod(0o600)
        except OSError:
            connection.close()
            raise
        return connection

    @staticmethod
    def _purge(connection: sqlite3.Connection, stamp: float) -> None:
        connection.execute("DELETE FROM reports WHERE expires_at <= ? OR created_at > ?", (stamp, stamp))

    def _limit(self, client: str, stamp: float) -> None:
        # Ephemeral salted hashes, no IP addresses or stable fingerprint on disk.
        key = hmac.new(self._rate_salt, client.encode(), hashlib.sha256).hexdigest()
        for other, attempts in list(self._rates.items()):
            while attempts and attempts[0] <= stamp - 60:
                attempts.popleft()
            if not attempts or attempts[0] > stamp:
                self._rates.pop(other, None)
        if key not in self._rates and len(self._rates) >= MAX_RATE_CLIENTS:
            raise CommunityError(429, "COMMUNITY_RATE_LIMIT", "Service de signalements occupé ; réessayez dans une minute.")
        attempts = self._rates[key]
        if len(attempts) >= MAX_WRITES_PER_MINUTE:
            raise CommunityError(429, "COMMUNITY_RATE_LIMIT", "Trop de signalements ; réessayez dans une minute.")
        attempts.append(stamp)

    def snapshot(self, *, now: datetime | None = None) -> dict[str, Any]:
        at = now or datetime.now(timezone.utc)
        with self._lock:
            connection = self._connect()
            try:
                with connection:
                    self._purge(connection, at.timestamp())
                    rows = connection.execute("SELECT body FROM reports ORDER BY created_at DESC, id LIMIT ?", (MAX_SHARED_REPORTS,)).fetchall()
            finally:
                connection.close()
        return {"region": "Dakar", "generatedAt": iso(at), "sharingAvailable": True,
                "reports": [json.loads(row[0]) for row in rows], "verification": "SELF_REPORTED_NOT_OFFICIAL"}

    def publish(self, value: Any, *, client: str, now: datetime | None = None) -> dict[str, Any]:
        draft = validate_draft(value)
        at = now or datetime.now(timezone.utc)
        key = secrets.token_hex(32)
        report = {**draft, "id": f"cr_{secrets.token_hex(16)}", "source": "COMMUNITY", "status": "ACTIVE", "shared": True,
                  "createdAt": iso(at), "expiresAt": iso(at + TRAFFIC_TTL), "assistant": assistant_presentation(draft)}
        with self._lock:
            self._limit(client, at.timestamp())
            connection = self._connect()
            try:
                with connection:
                    self._purge(connection, at.timestamp())
                    if connection.execute("SELECT COUNT(*) FROM reports").fetchone()[0] >= MAX_SHARED_REPORTS:
                        raise CommunityError(429, "COMMUNITY_CAPACITY", "Le service a atteint sa capacité de signalements actifs.")
                    connection.execute("INSERT INTO reports VALUES (?, ?, ?, ?, ?)",
                                       (report["id"], json.dumps(report, ensure_ascii=False), hashlib.sha256(key.encode()).hexdigest(),
                                        at.timestamp(), (at + TRAFFIC_TTL).timestamp()))
            finally:
                connection.close()
        return {"report": report, "deleteKey": key}

    def remove(self, report_id: str, key: str, *, now: datetime | None = None) -> None:
        if not REPORT_ID_RE.fullmatch(report_id) or not KEY_RE.fullmatch(key):
            raise CommunityError(403, "REPORT_OWNERSHIP_REQUIRED", "Seul l’auteur peut retirer ce signalement.")
        at = now or datetime.now(timezone.utc)
        with self._lock:
            connection = self._connect()
            try:
                with connection:
                    self._purge(connection, at.timestamp())
                    row = connection.execute("SELECT delete_hash FROM reports WHERE id = ?", (report_id,)).fetchone()
                    if row is None:
                        return  # Idempotent expiry/deletion, does not revive anything.
                    if not hmac.compare_digest(row[0], hashlib.sha256(key.encode()).hexdigest()):
                        raise CommunityError(403, "REPORT_OWNERSHIP_REQUIRED", "Seul l’auteur peut retirer ce signalement.")
                    connection.execute("DELETE FROM reports WHERE id = ?", (report_id,))
            finally:
                connection.close()
