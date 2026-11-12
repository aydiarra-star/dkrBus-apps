"""Import Dakar bus-stop candidates from the official Geofabrik OSM PBF extract.

The script never changes canonical mobility_stops coordinates. It only submits
OSM candidates to the authenticated staging path of the Supabase Edge Function.
"""
from __future__ import annotations

import argparse
import json
import os
import sys
import time
from datetime import datetime
from urllib.error import HTTPError, URLError
from urllib.request import Request, urlopen

PBF_URL = "https://download.geofabrik.de/africa/senegal-and-gambia-latest.osm.pbf"
SUPABASE_FUNCTION = "/functions/v1/dakar-bus-osm-stops-sync"
BATCH_SIZE = 100
BOUNDS = (14.60, -17.56, 14.91, -17.12)  # south, west, north, east
ALLOWED = {
    "highway": "bus_stop",
    "public_transport": "platform",
}


def in_dakar(lat: float, lon: float) -> bool:
    south, west, north, east = BOUNDS
    return south <= lat <= north and west <= lon <= east


def relevant(tags: dict[str, str]) -> bool:
    return (
        tags.get("highway") == "bus_stop"
        or tags.get("public_transport") == "platform"
        or (tags.get("public_transport") == "stop_position" and tags.get("bus") == "yes")
    )


def timestamp_text(value: object) -> str | None:
    if not value:
        return None
    if isinstance(value, datetime):
        return value.isoformat().replace("+00:00", "Z")
    return str(value)


def extract(pbf_path: str) -> list[dict[str, object]]:
    try:
        import osmium
    except ImportError as exc:
        raise RuntimeError("Le paquet Python 'osmium' est requis.") from exc

    class DakarStops(osmium.SimpleHandler):
        def __init__(self) -> None:
            super().__init__()
            self.items: list[dict[str, object]] = []

        def add(self, obj: object, lat: float, lon: float) -> None:
            if not in_dakar(lat, lon):
                return
            tags = dict(obj.tags)
            if not relevant(tags):
                return
            # Keep only useful, bounded OSM tags; do not ingest contributor metadata.
            safe_tags = {
                str(key): str(value)[:500]
                for key, value in list(tags.items())[:40]
                if len(str(key)) <= 80
            }
            self.items.append({
                "type": "node" if isinstance(obj, osmium.osm.Node) else "way",
                "id": int(obj.id),
                "lat": round(lat, 7),
                "lon": round(lon, 7),
                "tags": safe_tags,
                "version": int(obj.version),
                "timestamp": timestamp_text(obj.timestamp),
            })

        def node(self, node: object) -> None:
            if node.location.valid():
                self.add(node, node.location.lat, node.location.lon)

        def way(self, way: object) -> None:
            if dict(way.tags).get("public_transport") != "platform":
                return
            coords = [
                (node.location.lat, node.location.lon)
                for node in way.nodes
                if node.location.valid()
            ]
            if not coords:
                return
            # A way's bounding-box centre is a candidate point, never canonical data.
            lat = (min(point[0] for point in coords) + max(point[0] for point in coords)) / 2
            lon = (min(point[1] for point in coords) + max(point[1] for point in coords)) / 2
            self.add(way, lat, lon)

    handler = DakarStops()
    handler.apply_file(pbf_path, locations=True)
    # Stable ordering makes reruns and logs easy to compare.
    handler.items.sort(key=lambda item: (str(item["type"]), int(item["id"])))
    return handler.items


def post_batch(url: str, publishable_key: str, ingest_token: str,
               batch: list[dict[str, object]]) -> dict[str, object]:
    body = json.dumps({"mode": "ingest_pbf_batch", "elements": batch}).encode("utf-8")
    request = Request(
        url,
        data=body,
        method="POST",
        headers={
            "Content-Type": "application/json",
            "Accept": "application/json",
            "apikey": publishable_key,
            "Authorization": f"Bearer {publishable_key}",
            "x-dakar-bus-ingest-token": ingest_token,
            "User-Agent": "DakarBus-GeofabrikImporter/1.0 (+https://github.com/aydiarra-star/dkrBus-apps)",
        },
    )
    for attempt in range(3):
        try:
            with urlopen(request, timeout=90) as response:
                payload = json.loads(response.read().decode("utf-8"))
                if response.status < 200 or response.status >= 300 or payload.get("ok") is not True:
                    raise RuntimeError(f"Import refusé par Supabase: HTTP {response.status}, {payload}")
                return payload
        except HTTPError as error:
            if error.code == 429 and attempt < 2:
                wait = min(int(error.headers.get("Retry-After", "10")), 60)
                time.sleep(max(wait, 1))
                continue
            detail = error.read(500).decode("utf-8", errors="replace")
            raise RuntimeError(f"Supabase HTTP {error.code}: {detail}") from error
        except URLError as error:
            if attempt < 2:
                time.sleep(5 * (attempt + 1))
                continue
            raise RuntimeError(f"Connexion Supabase impossible: {error.reason}") from error
    raise RuntimeError("Échec après trois tentatives.")


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--pbf", help="PBF déjà téléchargé (facultatif).")
    args = parser.parse_args()

    supabase_url = os.environ.get("SUPABASE_URL", "").rstrip("/")
    publishable_key = os.environ.get("SUPABASE_PUBLISHABLE_KEY", "")
    ingest_token = os.environ.get("DAKAR_BUS_INGEST_TOKEN", "")
    if not all((supabase_url, publishable_key, ingest_token)):
        print("Secrets requis absents: SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, DAKAR_BUS_INGEST_TOKEN.", file=sys.stderr)
        return 2

    pbf_path = args.pbf or "/tmp/senegal-and-gambia-latest.osm.pbf"
    if not args.pbf:
        request = Request(PBF_URL, headers={"User-Agent": "DakarBus-GeofabrikImporter/1.0 (+https://github.com/aydiarra-star/dkrBus-apps)"})
        with urlopen(request, timeout=180) as response, open(pbf_path, "wb") as target:
            while chunk := response.read(1024 * 1024):
                target.write(chunk)
    if os.path.getsize(pbf_path) < 1024 * 1024:
        raise RuntimeError("Le fichier PBF téléchargé est anormalement petit.")

    items = extract(pbf_path)
    print(json.dumps({
        "dataset": PBF_URL,
        "attribution": "© OpenStreetMap contributors, ODbL",
        "extracted_at": datetime.utcnow().isoformat() + "Z",
        "dakar_candidates_found": len(items),
        "batch_size": BATCH_SIZE,
    }, ensure_ascii=False))

    if not items:
        print("Aucun arrêt OSM candidat trouvé dans la zone de Dakar; aucune écriture effectuée.", file=sys.stderr)
        return 1

    endpoint = supabase_url + SUPABASE_FUNCTION
    total = 0
    for offset in range(0, len(items), BATCH_SIZE):
        batch = items[offset:offset + BATCH_SIZE]
        result = post_batch(endpoint, publishable_key, ingest_token, batch)
        total += int(result.get("imported_bus_stop_objects", 0))
        print(json.dumps({
            "batch": offset // BATCH_SIZE + 1,
            "submitted": len(batch),
            "upserted": result.get("imported_bus_stop_objects", 0),
            "matches_refreshed": result.get("candidate_matches_created_or_refreshed", 0),
        }, ensure_ascii=False))
    print(json.dumps({"complete": True, "total_upserted": total, "source": "OpenStreetMap contributors"}))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
