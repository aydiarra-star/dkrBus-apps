"""Find field-survey leads, NOT transfer edges. Use the operator's actual
Waymark start/finish symbols as well as its drawn line ends. Search passenger
nodes across Dakar, not station centroids, polygons or a hand-picked station.
Do not publish the operator's coordinates, flip a direction, or infer a walk.
"""

import argparse
import hashlib
import json
import re
import unicodedata
from pathlib import Path

from scripts.audit_gt54 import nearest
from scripts.audit_interchange_sites import distance, is_platform
from scripts.audit_patte_doie import MARKERS
from scripts.extract_dakar_pedestrian_ways_from_pbf import inside_bounds

# Discovery tolerance in metres, NOT a platform identity/access threshold.
LIMIT = 20
FIELDS = ("name", "name:fr", "operator", "network", "route_ref")


def normalize(s):
    return "".join(
        c
        for c in unicodedata.normalize("NFKD", s.casefold())
        if not unicodedata.combining(c)
    )


def families(tags):
    text = " ".join(normalize(tags.get(k, "")) for k in FIELDS[:-1])
    return [
        family
        for family, regex in (
            ("ddd", r"\b(?:ddd|dem[ -]?dikk?)\b"),
            ("brt", r"\b(?:sunu[ -]?brt|brt)\b"),
            ("ter", r"\bter\b"),
        )
        if re.search(regex, text)
    ]


def multiple_refs(tags):
    # A street number, a platform ref, or a hyphenated address is not a line.
    # Preserve the literal context: two refs need not mean different operators.
    code = r"\d{1,3}[a-z]?"
    listing = rf"{code}(?:\s*(?:[;/,&+]|\bet\b)\s*{code})+"
    for field in ("route_ref", "name", "name:fr"):
        text = normalize(tags.get(field, "")).strip()
        if field != "route_ref":
            text = re.sub(
                r"^(?:(?:arret\s+(?:de\s+)?)?(?:auto)?bus|terminus|lignes?)\s+",
                "",
                text,
            )
        if re.fullmatch(listing, text):
            codes = list(dict.fromkeys(re.findall(code, text)))
            if len(codes) > 1:
                return [s.upper() for s in codes]
    return []


def poles_in(pbf):
    import osmium

    rows = []
    for n in osmium.FileProcessor(str(pbf), osmium.osm.NODE):
        if (
            n.location.valid()
            and inside_bounds(n.location.lat, n.location.lon)
            and is_platform(n.tags)
        ):
            t = {k: n.tags[k] for k in FIELDS if k in n.tags}
            rows.append(
                {
                    "id": f"n{n.id}",
                    "version": n.version,
                    "xy": (n.location.lat, n.location.lon),
                    "tags": t,
                }
            )
    return rows


def terminals(drawing):
    side = drawing.get("orientation")
    if side not in ("start-first", "start-last"):
        return []
    line = drawing["positions"] if side == "start-first" else drawing["positions"][::-1]
    result = []
    for role, end in [("start", line[0]), ("finish", line[-1])]:
        pins = [p for p in drawing["markers"] if p["role"].lower() == role]
        if len(pins) != 1:
            return []
        pin = pins[0]
        result.append((role, pin["name"], pin["position"][:2][::-1], end[:2][::-1]))
    return result


def screen(poles, drawings):
    network_poles = [(p, f) for p in poles if (f := families(p["tags"]))]
    out = {
        "scope": "SURVEY_ONLY",
        "radiusM": LIMIT,
        "platformNodes": len(poles),
        "namedNetworkNodes": len(network_poles),
        "drawingsRead": len(drawings),
        "examinedEnds": 0,
        "withoutTwoDirectionalMarkers": [],
        "nearby": [],
        "multipleLineReferences": [],
    }
    for p in poles:
        if refs := multiple_refs(p["tags"]):
            out["multipleLineReferences"].append(
                {k: p[k] for k in ("id", "version", "tags")} | {"refs": refs}
            )
    for code, d in sorted(drawings.items()):
        ends = terminals(d)
        if not ends:
            out["withoutTwoDirectionalMarkers"].append(code)
        for role, name, pin, end in ends:
            out["examinedEnds"] += 1
            for p, f in network_poles:
                dm, de = distance(pin, p["xy"]), distance(end, p["xy"])
                if min(dm, de) <= LIMIT:
                    out["nearby"].append(
                        {
                            "line": code,
                            "role": role,
                            "label": name,
                            "overlaySha256": d["overlayHash"],
                            "pole": p["id"],
                            "version": p["version"],
                            "tags": p["tags"],
                            "mentions": f,
                            "markerToPoleM": round(dm, 1),
                            "lineEndToPoleM": round(de, 1),
                            "bothWithinLimit": max(dm, de) <= LIMIT,
                        }
                    )
    return out


def patte_doie(d):
    if not d or not terminals(d):
        return {"status": "NO_DIRECTIONAL_DRAWING"}
    ends = terminals(d)
    # Distances to *this* drawing only. The requested opposite direction may
    # use another carriageway, as may the TATA sheet with the same number.
    line = d["positions"][:: 1 if d["orientation"] == "start-first" else -1]
    coords = [(i, lat, lon) for i, (lon, lat, *_) in enumerate(line)]
    result = {}
    for pole, point in MARKERS.items():
        q = nearest(point, coords)
        if q is None:
            return {"status": "UNMEASURABLE_DRAWING"}
        result[pole] = {"offsetM": round(q[0], 1), "alongDrawingM": round(q[1], 1)}
    return {
        "status": "DRAWING_ONLY",
        "overlaySha256": d["overlayHash"],
        "from": ends[0][1],
        "to": ends[1][1],
        "toDrawing": result,
    }


def summary(r):
    def note(title, value):
        text = json.dumps(value, ensure_ascii=False, separators=(",", ":"))
        print(
            f"::notice title={title}::"
            + text.replace("%", "%25").replace("\r", "%0D").replace("\n", "%0A")
        )

    note(
        "Terminus AFTU et poteaux nommés",
        {
            k: r[k]
            for k in (
                "pbfSha256",
                "scope",
                "platformNodes",
                "namedNetworkNodes",
                "drawingsRead",
                "examinedEnds",
                "withoutTwoDirectionalMarkers",
            )
        }
        | {
            "nearby": len(r["nearby"]),
            "both": sum(x["bothWithinLimit"] for x in r["nearby"]),
            "multi": len(r["multipleLineReferences"]),
        },
    )
    # Short annotations for transport over the Checks API (4 KiB limit).
    compact = [
        [
            x["line"],
            x["role"],
            x["pole"],
            x["markerToPoleM"],
            x["lineEndToPoleM"],
            x["bothWithinLimit"],
        ]
        for x in r["nearby"]
    ]
    for i in range(0, min(len(compact), 120), 40):
        note(f"Piste terminus {i+1}", compact[i : i + 40])
    refs = [[p["id"], p["refs"]] for p in r["multipleLineReferences"]]
    for i in range(0, min(len(refs), 120), 40):
        note(f"Numéros sur poteaux {i+1}", refs[i : i + 40])
    note("60 AFTU et chemin de Patte d’Oie", r["patteDoie60"])


if __name__ == "__main__":
    cli = argparse.ArgumentParser(description=__doc__)
    cli.add_argument("pbf", type=Path)
    cli.add_argument("maps", type=Path)
    cli.add_argument("output", type=Path)
    cli.add_argument("--ci-summary", action="store_true")
    a = cli.parse_args()
    maps = {p.stem: json.loads(p.read_text()) for p in a.maps.glob("*.json")}
    if not maps:
        cli.error("Aucun dessin acquis")
    report = screen(poles_in(a.pbf), maps)
    with a.pbf.open("rb") as f:
        report.update(
            pbfSha256=hashlib.file_digest(f, "sha256").hexdigest(),
            attribution="© OpenStreetMap contributors · ODbL 1.0",
            patteDoie60=patte_doie(maps.get("60")),
        )
    a.output.write_text(json.dumps(report, indent=2, ensure_ascii=False) + "\n")
    if a.ci_summary:
        summary(report)
