"""Read public stop-sheet metadata, not the private trip planner or a GTFS feed.

A page coordinate is only a candidate for matching a directional call to a
surveyed curb. Never infer one from a map centre, a tile or a nearby stop.
"""

import argparse
import hashlib
import json
from html.parser import HTMLParser
from urllib import error, parse, request, robotparser

BASE = "https://moovitapp.com"
AGENT = "DakarBus-stop-review/1.0"
STOPS = {
    "37702688": "Route_Des_Maristes_141",
    "37702687": "Route_Des_Maristes_141",
    "37702749": "Terminus_Gu%C3%A9diawaye",
    "37702627": "Pikine_Rue_10_1858",
    "37702002": "Gare_De_Colobane",
    "37702678": "Grands_Moulins",
}


class Sheet(HTMLParser):
    def __init__(self, stop):
        super().__init__()
        self.stop = stop
        self.jsonld = None
        self.canonical = ""
        self.pins = set()
        self.meta = {}

    def pin(self, label, a, b):
        try:
            lat, lon = float(a), float(b)
        except (TypeError, ValueError):
            return
        if 14.4 <= lat <= 15 and -17.7 <= lon <= -16.9:
            self.pins.add((label, lat, lon))

    def handle_starttag(self, name, attrs):
        d = dict(attrs)
        if name == "link" and d.get("rel") == "canonical":
            self.canonical = d.get("href") or ""
        if name == "script" and d.get("type") == "application/ld+json":
            self.jsonld = []
        if name == "meta":
            self.meta[d.get("property", d.get("name"))] = d.get("content")
        # Only links naming this exact stop AND an explicit destination.
        if name == "a":
            q = parse.parse_qs(parse.urlsplit(d.get("href") or "").query)
            if q.get("tsid") == [self.stop] and len(q.get("tll", [])) == 1:
                xy = q["tll"][0].split(",")
                if len(xy) == 2:
                    self.pin("destination-link", *xy)

    def handle_data(self, text):
        if self.jsonld is not None:
            self.jsonld.append(text)

    def handle_endtag(self, name):
        if name != "script" or self.jsonld is None:
            return
        try:
            obj = json.loads("".join(self.jsonld))
            rows = (
                obj
                if isinstance(obj, list)
                else obj.get("@graph", [obj]) if isinstance(obj, dict) else []
            )
            for r in rows:
                if (
                    isinstance(r, dict)
                    and r.get("@type") in ("BusStop", "BusStation", "TrainStation")
                    and isinstance(r.get("geo"), dict)
                ):
                    self.pin(
                        "stop-jsonld",
                        r["geo"].get("latitude"),
                        r["geo"].get("longitude"),
                    )
        except (ValueError, TypeError):
            pass
        self.jsonld = None

    def result(self):
        if not self.canonical.rstrip("/").endswith(f"-Dakar-stop_{self.stop}-5996"):
            return {"status": "UNCONFIRMED_PAGE"}
        self.pin(
            "page-location",
            self.meta.get("place:location:latitude"),
            self.meta.get("place:location:longitude"),
        )
        return {
            "status": "REVIEW_ONLY" if self.pins else "NO_EXPLICIT_PIN",
            "pins": sorted(self.pins),
        }


def read_url(url):
    req = request.Request(url, headers={"User-Agent": AGENT})
    with request.urlopen(req, timeout=9) as resp:
        if parse.urlsplit(resp.url).hostname != "moovitapp.com":
            raise ValueError("unexpected source")
        data = resp.read(2_000_001)
        if len(data) > 2_000_000:
            raise ValueError("page too large")
        return data


def audit():
    robots = robotparser.RobotFileParser()
    # Never retry a refusal, solve a challenge, or look inside private APIs.
    try:
        robots.parse(read_url(BASE + "/robots.txt").decode().splitlines())
    except (OSError, ValueError):
        return {"status": "ROBOTS_UNAVAILABLE"}
    rows = {}
    for stop, slug in STOPS.items():
        url = f"{BASE}/index/fr/transport_en_commun-{slug}-Dakar-stop_{stop}-5996"
        if not robots.can_fetch(AGENT, url):
            rows[stop] = {"status": "DISALLOWED"}
            continue
        try:
            body = read_url(url)
            parser = Sheet(stop)
            parser.feed(body.decode("utf-8"))
            parser.close()
            rows[stop] = {**parser.result(), "sha256": hashlib.sha256(body).hexdigest()}
        except error.HTTPError as ex:
            rows[stop] = {"status": f"HTTP_{ex.code}"}
            if ex.code in (401, 403, 429):
                break
        except (OSError, ValueError):
            rows[stop] = {"status": "SOURCE_UNAVAILABLE"}
    return {"status": "REVIEW_ONLY", "sheets": rows}


if __name__ == "__main__":
    cli = argparse.ArgumentParser(description=__doc__)
    cli.add_argument("--ci-summary", action="store_true")
    print(
        (
            "::notice title=Localisation des fiches Maristes::"
            if cli.parse_args().ci_summary
            else ""
        )
        + json.dumps(audit(), ensure_ascii=False)
    )
