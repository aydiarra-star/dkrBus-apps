"""Where do the two *outbound drawings* leave the Thiaroye site?

Read-only comparisons with OSM and the calls immediately around the archived
termini. Never snap a passenger to a road, reverse a drawing, or compute a walk.
"""
import argparse
import hashlib
import json
import zipfile
from pathlib import Path

from scripts.audit_aftu_road_fit import ROADS
from scripts.audit_gt54 import nearest
from scripts.audit_interchange_sites import distance
from scripts.audit_terminal_calls import OID539, OID576
from scripts.audit_terminus_quays import terminals
from scripts.compare_bus_occurrences import DIGEST, tables
from scripts.extract_dakar_pedestrian_ways_from_pbf import WALKABLE
from scripts.ouakam_site import before_end

# Includes both carriageways by Ciel Oil, the depot outlets, RN1, and ALL
# seven calls before/at/after the termini in terminal-occurrences.json.
BBOX = (-17.382, 14.7435, -17.3745, 14.7525)  # W,S,E,N
POLE = 4419421889
AOI_CONTROLS = (POLE, 6046692545, 6046692541, 3956188298, 6039744390, 1247815427)
STOP_IDS = {"ddd": {"D_529", "D_686", "D_545"}, "aftu": {"A_265", "A_586", "A_266", "A_585"}}
# Pinned layer 0 OBJECTID_12=575 (not the similarly named airport at AIBD).
LSS = (14.746217321721589, -17.489620058327734)


def inside(lat, lon):
    return BBOX[0] <= lon <= BBOX[2] and BBOX[1] <= lat <= BBOX[3]


def osm_site(pbf):
    import osmium

    nodes = {}
    ways = {}
    for n in osmium.FileProcessor(str(pbf), osmium.osm.NODE):
        if n.location.valid() and inside(n.location.lat, n.location.lon):
            nodes[n.id] = (n.id, n.location.lat, n.location.lon)
    if POLE not in nodes:
        raise ValueError("Extrait sans le poteau de référence")
    # Keep only original segments with both vertices in the window. Do not
    # remove out-of-window vertices then bridge the gap between survivors.
    for w in osmium.FileProcessor(str(pbf), osmium.osm.WAY).with_filter(osmium.filter.KeyFilter("highway")):
        tags = dict(w.tags)
        refs = [n.ref for n in w.nodes]
        segments = bounded_segments(refs, nodes)
        if segments:
            ways[w.id] = (w.version, tags, segments)
    return nodes, ways


def bounded_segments(refs, nodes):
    return [(nodes[a], nodes[b]) for a, b in zip(refs, refs[1:]) if a != b and a in nodes and b in nodes]


def probe(point, ways):
    """All road axes within 12 m, and closest mapped dedicated pedestrian
    way in the window (even if restricted). Distances TO geometry only."""
    roads, foot = [], []
    for wid, (_, tags, segments) in ways.items():
        highway = tags["highway"]
        if tags.get("area") == "yes" or not (highway.removesuffix("_link") in ROADS or highway in WALKABLE):
            continue
        ds = [p[0] for segment in segments if (p := nearest(point, segment)) is not None]
        if not ds:
            continue
        d = min(ds)
        if highway.removesuffix("_link") in ROADS and d <= 12:
            roads.append((d, wid))
        if highway in WALKABLE:
            foot.append((d, wid))
    def row(item):
        d, wid = item
        return [wid, round(d, 1)]
    return {"roadsWithin12m": [row(v) for v in sorted(roads)], "nearestFootway": row(min(foot)) if foot else None}


def calls(family, file):
    with file.open("rb") as f:
        if hashlib.file_digest(f, "sha256").hexdigest() != DIGEST[family]:
            raise ValueError("Archive différente de la révision relue")
    with zipfile.ZipFile(file) as z:
        points = {r["stop_id"]: (float(r["stop_lat"]), float(r["stop_lon"])) for r in tables(z, "stops") if r["stop_id"] in STOP_IDS[family]}
    if points.keys() != STOP_IDS[family] or not all(inside(*p) for p in points.values()):
        raise ValueError("Les appels encadrants ne sont pas tous dans la fenêtre")
    return points


def arcgis_line(response):
    # Reject a missing, differently identified, multipart, backwards or
    # reprojected result instead of calling the far end a second depot gate.
    if response.get("spatialReference", {}).get("wkid") != 4326 or len(response.get("features", [])) != 1:
        raise ValueError("Pas de géométrie 218 unique en WGS84")
    feature = response["features"][0]
    attrs, paths = feature["attributes"], feature["geometry"]["paths"]
    if attrs.get("OBJECTID_12") != 7 or attrs.get("Nom_Ligne") != "Ligne 218" or len(paths) != 1 or len(paths[0]) < 2:
        raise ValueError("Objet 218 différent")
    line = [(lat, lon) for lon, lat in paths[0]]
    if not (distance(line[0], OID539) < 1 and distance(line[-1], LSS) < 20):
        raise ValueError("Pas le dessin depuis le dépôt vers LSS")
    return line


def samples(line, ways):
    # Sample actual line length, not straight chords between the calls.
    reverse = line[::-1]
    return {str(m): probe(p, ways)["roadsWithin12m"] if (p := before_end(reverse, m)) is not None else None
            for m in (0, 25, 75, 100, 150, 200, 300)}


def review(pbf, ddd, aftu, drawing, layer):
    nodes, ways = osm_site(pbf)
    points = calls("ddd", ddd) | calls("aftu", aftu) | {"osmPole": nodes[POLE][1:], "arcgis539": OID539, "arcgis576": OID576}
    views = {k: probe(p, ways) | {"toPoleM": round(distance(p, points["osmPole"]), 1)} for k, p in points.items()}
    d = json.loads(drawing.read_text()) if drawing.is_file() else {}
    ends = terminals(d)
    profiles = {}
    if ends and [p[1] for p in ends] == ["TERMINUS POSTE THIAROYE", "TERMINUS LAC ROSE"]:
        line = [(p[1], p[0]) for p in d["positions"]]
        if d["orientation"] == "start-last":
            line.reverse()
        profiles["aftu73"] = {"overlaySha256": d["overlayHash"], "fromStartM": samples(line, ways)}
    if layer.is_file():
        line = arcgis_line(json.loads(layer.read_text()))
        profiles["ddd218"] = {"objectId": 7, "responseSha256": hashlib.sha256(layer.read_bytes()).hexdigest(), "fromStartM": samples(line, ways)}
    contacts = {n: sorted(wid for wid, (_, _, segs) in ways.items() if any(a[0] == n or b[0] == n for a, b in segs))
                for n in AOI_CONTROLS if n in nodes}
    with pbf.open("rb") as f:
        pbf_hash = hashlib.file_digest(f, "sha256").hexdigest()
    return {
        "scope": "SITE_SURVEY_ONLY", "attribution": "© OpenStreetMap contributors · ODbL 1.0",
        "boundsWSEN": BBOX, "pbfSha256": pbf_hash, "archiveSha256": DIGEST,
        "ways": {wid: [version, t["highway"], t.get("oneway"), t.get("access"), t.get("foot")] for wid, (version, t, _) in ways.items()},
        "controlNodeHighwayContacts": contacts, "probes": views, "outboundDrawings": profiles,
        "unmeasuredDrawings": sorted({"aftu73", "ddd218"} - profiles.keys()),
    }


if __name__ == "__main__":
    cli = argparse.ArgumentParser(description=__doc__)
    for name in ("pbf", "ddd", "aftu", "drawing", "layer", "output"):
        cli.add_argument(name, type=Path)
    a = cli.parse_args()
    r = review(a.pbf, a.ddd, a.aftu, a.drawing, a.layer)
    a.output.write_text(json.dumps(r, ensure_ascii=False, indent=2) + "\n")
    # Compact, individually readable receipts; no geometry in the annotations.
    for k in ("pbfSha256", "controlNodeHighwayContacts", "probes", "outboundDrawings", "unmeasuredDrawings"):
        print(f"::notice title=Thiaroye {k}::" + json.dumps(r[k], separators=(",", ":")))
    used = {i for row in r["probes"].values() for i, _ in row["roadsWithin12m"]}
    used.update(row["nearestFootway"][0] for row in r["probes"].values() if row["nearestFootway"])
    used.update(i for ids in r["controlNodeHighwayContacts"].values() for i in ids)
    used.update(i for d in r["outboundDrawings"].values() for sample in d["fromStartM"].values() for i, _ in sample or [])
    print("::notice title=Thiaroye ways::" + json.dumps({i: r["ways"][i] for i in sorted(used)}, separators=(",", ":")))
