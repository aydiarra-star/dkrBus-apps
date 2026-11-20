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

from scripts.bus_change_candidates import platform_members
from scripts.audit_gt54 import nearest
from scripts.audit_interchange_sites import distance, is_platform
from scripts.audit_patte_doie import MARKERS
from scripts.ouakam_site import drawing_frame
from scripts.extract_dakar_pedestrian_ways_from_pbf import inside_bounds

# Discovery tolerance in metres, NOT a platform identity/access threshold.
LIMIT = 20
OWNER_FIELDS = ("name", "name:fr", "operator", "network")
FIELDS = (*OWNER_FIELDS, "route_ref", "ref")


def normalize(s):
    return "".join(
        c
        for c in unicodedata.normalize("NFKD", s.casefold())
        if not unicodedata.combining(c)
    )


def families(tags):
    text = " ".join(normalize(tags.get(k, "")) for k in OWNER_FIELDS)
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
    code = r"[0-9]{1,3}[a-z]?"
    sep = r"\s*(?:[;/,&+]|\bet\b)\s*"
    # Interpret a hyphen as a list separator only after explicit bus/line
    # wording, not in a bare address. A generic ref needs an L on EVERY item.
    prefix = r"^(?:(?:arret\s+(?:de\s+)?)?(?:(?:mini\s*|auto)?bus)(?:\s+ddd)?|terminus|lignes?)\s+"
    for field in ("route_ref", "name", "name:fr", "ref"):
        text = normalize(tags.get(field, "")).strip()
        token, delimiter = code, sep
        if field == "ref":
            token = "l" + code
        elif field in ("name", "name:fr"):
            text, removed = re.subn(prefix, "", text, count=1)
            if removed:
                delimiter = rf"(?:{sep}|\s*-\s*)"
                if text.startswith("(") and text.endswith(")"):
                    text = text[1:-1].strip()
        if re.fullmatch(rf"{token}(?:{delimiter}{token})+", text):
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


def route_memberships(pbf, targets):
    import osmium

    return [
        row
        for r in osmium.FileProcessor(str(pbf), osmium.osm.RELATION)
        for row in platform_members(r, targets)
    ]


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


def finish_to_start(endpoints):
    """Compare the actual finish of one AFTU drawing to another's start.
    Check both symbols AND both line ends; two starts never make a change."""
    rows = []
    for a, (_, finish) in endpoints.items():
        for b, (start, _) in endpoints.items():
            if a == b:
                continue
            dp, de = distance(finish[2], start[2]), distance(finish[3], start[3])
            if max(dp, de) <= LIMIT:
                rows.append([a, b, finish[1], start[1], round(dp, 1), round(de, 1)])
    return rows


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
    endpoints = {}
    for code, d in sorted(drawings.items()):
        ends = terminals(d)
        if not ends:
            out["withoutTwoDirectionalMarkers"].append(code)
        else:
            endpoints[code] = ends
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
    out["finishToOtherStart"] = finish_to_start(endpoints)
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
            "platformMemberships": len(r["nearbyRouteOccurrences"]),
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
    memberships = [
        [
            p[k]
            for k in (
                "pole",
                "relation",
                "version",
                "ref",
                "role",
                "rank",
                "platforms",
                "before",
                "after",
            )
        ]
        for p in r["nearbyRouteOccurrences"]
    ]
    for i in range(0, min(len(memberships), 40), 20):
        note(f"Rangs des poteaux proches {i+1}", memberships[i : i + 20])
    note("60 AFTU et chemin de Patte d’Oie", r["patteDoie60"])
    note("Approche du terminus 67 à Ouakam", r["ouakam67"])
    rows = r["finishToOtherStart"]
    note("AFTU fin vers autre départ", {"count": len(rows), "sample": sorted(rows, key=lambda v: (max(v[4:]), v[:2]))[:12]})


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
    report["nearbyRouteOccurrences"] = route_memberships(
        a.pbf, {p["pole"] for p in report["nearby"]}
    )
    with a.pbf.open("rb") as f:
        report.update(
            pbfSha256=hashlib.file_digest(f, "sha256").hexdigest(),
            attribution="© OpenStreetMap contributors · ODbL 1.0",
            patteDoie60=patte_doie(maps.get("60")),
            ouakam67=drawing_frame(maps.get("67"), terminals(maps.get("67", {}))),
        )
    a.output.write_text(json.dumps(report, indent=2, ensure_ascii=False) + "\n")
    if a.ci_summary:
        summary(report)
