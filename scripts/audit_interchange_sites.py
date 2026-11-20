"""Read-only physical interchange reconnaissance. No proximity edges or publication.

In the named search windows count mapped passenger platforms (not station
centroids or vehicle positions). Trace only actual common OSM node IDs on
mapped pedestrian ways. A match is a candidate: role, service, crossings,
barriers, station gates and timetables still require independent review.
"""

import argparse
import hashlib
import heapq
import json
import math
from collections import defaultdict
from pathlib import Path

from scripts.extract_dakar_pedestrian_ways_from_pbf import inside_bounds, is_walkable
from scripts.audit_bus_osm_occurrences import identity

# Windows for discovery, not transfer distances or passenger coordinates.
SITES = {
    "Maristes": (14.72770, -17.4369, 900),
    "Médina": (14.6825, -17.451, 1000),
    "Colobane": (14.7003482, -17.4416523, 850),
    "Petersen": (14.6766438, -17.4406354, 650),
    "Guédiawaye": (14.7719791, -17.3868591, 850),
    "Pikine": (14.7498644, -17.3916937, 700),
    "Rufisque": (14.7159649, -17.2699985, 850),
    "Diamniadio": (14.7160641, -17.1984512, 850),
    "Thiaroye dépôt": (14.7471089, -17.3780703, 600),
    "Ouakam Boutique Diallo": (14.7256037, -17.4827764, 650),
}
KEEP = (
    "name",
    "network",
    "operator",
    "ref",
    "route_ref",
    "local_ref",
    "public_transport",
    "railway",
    "highway",
    "bus",
    "shelter",
    "bench",
    "source",
    "check_date",
)


def distance(a, b):
    y = math.radians(b[0] - a[0])
    x = math.radians(b[1] - a[1]) * math.cos(math.radians((a[0] + b[0]) / 2))
    return math.hypot(x, y) * 6371000


def is_platform(tags):
    if tags.get("public_transport") in {"station", "stop_position"}:
        return False
    return (
        tags.get("public_transport") == "platform"
        or tags.get("railway") == "platform"
        or tags.get("highway") in {"bus_stop", "platform"}
    )


def foot_directions(tags):
    if (
        not is_walkable(tags)
        or tags.get("area") == "yes"
        or any("conditional" in k for k in tags)
    ):
        return ()
    if (
        tags.get("access") not in (None, "yes", "designated", "permissive")
        or tags.get("foot") not in (None, "yes", "designated", "permissive")
        or tags.get("barrier")
    ):
        return ()
    if tags.get("oneway:foot") in ("yes", "1", "true"):
        return (1,)
    if tags.get("oneway:foot") == "-1":
        return (-1,)
    return (1, -1) if tags.get("oneway:foot") in (None, "no", "0", "false") else ()


def reachable(origins, graph, limit):
    # Start only on actual vertices of the platform. For polygons these are
    # POSSIBLE entry points; no distance across a platform is inferred.
    distances = {n: 0.0 for n in origins if n in graph}
    prev = {}
    queue = [(0.0, n) for n in distances]
    heapq.heapify(queue)
    while queue:
        d, n = heapq.heappop(queue)
        if d != distances[n]:
            continue
        for m, length, way in graph.get(n, ()):
            cost = d + length
            if cost <= limit and cost < distances.get(m, math.inf):
                distances[m] = cost
                prev[m] = (n, way)
                heapq.heappush(queue, (cost, m))
    return distances, prev


def collect(pbf, regional=False):
    import osmium

    platforms, restrictions, routes = {}, set(), {}
    member_of = defaultdict(list)
    touch = defaultdict(set)
    graph = defaultdict(list)

    def save(osm_id, osm, tags, refs, xy):
        sites = [
            k
            for k, (lat, lon, r) in SITES.items()
            if any(distance(p, (lat, lon)) <= r for p in xy)
        ]
        if sites or (regional and any(inside_bounds(*pos) for pos in xy)):
            platforms[osm_id] = dict(
                id=osm_id,
                version=osm.version,
                tags={k: tags[k] for k in KEEP if k in tags},
                positions=xy,
                refs=refs,
                sites=sites,
            )

    class Collect(osmium.SimpleHandler):
        def node(self, n):
            t = dict(n.tags)
            if (
                t.get("barrier")
                or any(
                    t.get(k) not in (None, "yes", "designated", "permissive")
                    for k in ("access", "foot", "foot:access")
                )
                or any("conditional" in k for k in t)
            ):
                restrictions.add(n.id)
            if is_platform(t) and n.location.valid():
                save(f"n{n.id}", n, t, [n.id], [(n.location.lat, n.location.lon)])

        def way(self, w):
            t = dict(w.tags)
            platform = is_platform(t)
            signs = foot_directions(t)
            if (
                not (signs or platform)
                or not w.nodes
                or not all(n.location.valid() for n in w.nodes)
            ):
                return
            refs = [n.ref for n in w.nodes]
            xy = [(n.location.lat, n.location.lon) for n in w.nodes]
            if platform:
                save(f"w{w.id}", w, t, refs, xy)
            for sign in signs:
                seq = list(zip(refs, xy))[::sign]
                for (a, pa), (b, pb) in zip(seq, seq[1:]):
                    if a != b and a not in restrictions and b not in restrictions:
                        graph[a].append((b, distance(pa, pb), w.id))
                        touch[a].add(w.id)
                        touch[b].add(w.id)

        def relation(self, r):
            t = dict(r.tags)
            if (
                t.get("route") not in ("train", "bus")
                and t.get("public_transport") != "stop_area"
            ):
                return
            if t.get("route") in ("train", "bus"):
                family, line = identity(t)
                declared = {t.get("operator"), t.get("network")}
                if t.get("route") == "bus" and "SunuBRT" in declared:
                    family = "brt"
                if t.get("route") == "train" and (
                    line == "TER" or "TER Dakar" in declared
                ):
                    family = "ter"
                routes[r.id] = family
            for m in r.members:
                key = f"{m.type}{m.ref}"
                if key in platforms:
                    member_of[key].append(
                        [
                            r.id,
                            r.version,
                            m.role,
                            t.get("route", "stop_area"),
                            t.get("ref"),
                            t.get("from"),
                            t.get("to"),
                        ]
                    )

    Collect().apply_file(str(pbf), locations=True)
    for p in platforms.values():
        p["touchingFootways"] = sorted({w for n in p["refs"] for w in touch[n]})
        p["memberships"] = member_of[p["id"]]
    return platforms, graph, routes


def trace(end, distances, previous):
    if end not in distances:
        return None
    start, ways = end, []
    while start in previous:
        start, way = previous[start]
        if not ways or ways[-1] != way:
            ways.append(way)
    return [round(distances[end], 1), start, end, ways[::-1]]


# Ends of BRT infrastructure and separately identified marked crossings.
# These are survey landmarks, NOT the vehicle door or a DDD boarding node.
APPROACHES = (
    ("Petersen", "w1458575520", 13376766706, 13376766714, None),
    ("Guédiawaye NO", "w1458592784", 13376903833, 13376903816, "n6440488778"),
    ("Guédiawaye SE", "w1458592786", 13376903836, 13376903816, "n6440488778"),
)


def survey_approaches(platforms, graph):
    def route(a, b):
        return trace(b, *reachable([a], graph, 1200))

    rows = []
    for site, infrastructure, end, crossing, marker in APPROACHES:
        p = platforms.get(infrastructure, {})
        ok = end in p.get("refs", ())
        bus = platforms.get(marker, {}) if marker else {}
        ref = bus["refs"][0] if bus else None
        rows.append(
            {
                "site": site,
                "platformWay": infrastructure,
                "version": p.get("version"),
                "endNode": end,
                "crossingNode": crossing,
                "busMarker": marker,
                "toCrossing": route(end, crossing) if ok else None,
                "fromCrossing": route(crossing, end) if ok else None,
                "toBusMarker": route(end, ref) if ok and ref else None,
                "fromBusMarker": route(ref, end) if ok and ref else None,
            }
        )
    return rows


def candidate_paths(ps, graph):
    # Invert actual vertices, not a spatial index. Disconnected roadside
    # markers never acquire an edge by snapping to even a very close path.
    ends = defaultdict(list)
    for p in ps:
        if p["touchingFootways"]:
            for n in set(p["refs"]):
                ends[n].append(p["id"])
    pairs = []
    for p in ps:
        if not p["touchingFootways"]:
            continue
        dist, prev = reachable(p["refs"], graph, 1200)
        best = {}
        for n, d in dist.items():
            for to in ends.get(n, ()):
                if to != p["id"] and (d, n) < best.get(to, (math.inf, 0)):
                    best[to] = d, n
        for to, (_, end) in sorted(best.items()):
            pairs.append([p["id"], to, *trace(end, dist, prev)])
    return pairs


def site_results(platforms, graph):
    results = {}
    for site in SITES:
        ps = [p for p in platforms.values() if site in p["sites"]]
        results[site] = {"platforms": ps, "candidatePaths": candidate_paths(ps, graph)}
    return results


def audit(pbf):
    ps, graph, _ = collect(pbf)
    return site_results(ps, graph)


def regional_candidates(platforms, graph, routes):
    def calls(p, role):
        # A stop_area, unassigned relation, stop_position or reversed
        # entry/exit-only member does not certify a service on this quay.
        roles = {
            "platform",
            "platform_exit_only" if role == "alight" else "platform_entry_only",
        }
        return [
            [routes[m[0]], *m]
            for m in p["memberships"]
            if routes.get(m[0]) and m[2] in roles
        ]

    def pairs(p, q):
        return [
            [a, b]
            for a in calls(p, "alight")
            for b in calls(q, "board")
            if a[0] != b[0]
        ]

    ps = list(platforms.values())
    paths = candidate_paths(ps, graph)
    shared = {p["id"]: c for p in ps if (c := pairs(p, p))}
    linked = [
        [path, c]
        for path in paths
        if (c := pairs(platforms[path[0]], platforms[path[1]]))
    ]

    # Keep the less precise candidates for MANUAL investigation: platform
    # objects often have a network tag but no membership in a bus relation.
    def label(p):
        t = p["tags"]
        return [
            p["id"],
            t.get("railway"),
            t.get("network"),
            t.get("operator"),
            t.get("route_ref"),
            t.get("name"),
        ]

    path_labels = {i: label(platforms[i]) for path in paths for i in path[:2]}
    return {
        "status": "REVIEW_ONLY",
        "platforms": len(ps),
        "touching": sum(bool(p["touchingFootways"]) for p in ps),
        "directedPaths": paths,
        "labels": path_labels,
        "sameObjectByRole": shared,
        "pathsBetweenRouteRoles": linked,
    }


def summary(sites):
    # Report all windows in one receipt: there can be more sites than
    # GitHub's ten annotations/step. Full features and paths stay in the file.
    rows = {}
    for name, site in sites.items():
        ps = site["platforms"]
        rows[name] = [len(ps), sum(bool(p["touchingFootways"]) for p in ps), len(site["candidatePaths"])]
    print("::notice title=Quais par site::" + json.dumps(rows, ensure_ascii=False))


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("pbf", type=Path)
    parser.add_argument("output", type=Path)
    parser.add_argument("--ci-summary", action="store_true")
    parser.add_argument(
        "--regional",
        type=Path,
        help="Also inspect exact shared objects and directed footpaths in the entire Dakar extract, not just the named sites",
    )
    args = parser.parse_args()
    ps, graph, routes = collect(args.pbf, bool(args.regional))
    sites = site_results(ps, graph)
    with args.pbf.open("rb") as stream:
        digest = hashlib.file_digest(stream, "sha256").hexdigest()
    args.output.write_text(
        json.dumps(
            {
                "source": "© OpenStreetMap contributors, ODbL 1.0",
                "extractSha256": digest,
                "scope": "Mapped topological candidates only; no inferred boarding or transfer",
                "windows": SITES,
                "sites": sites,
            },
            ensure_ascii=False,
            indent=2,
        )
        + "\n"
    )
    if args.ci_summary:
        summary(sites)

    if args.regional:
        region = regional_candidates(ps, graph, routes)
        region.update(
            surveyApproaches=survey_approaches(ps, graph),
            extractSha256=digest,
            attribution="© OpenStreetMap contributors · ODbL 1.0",
        )
        args.regional.write_text(
            json.dumps(region, ensure_ascii=False, indent=2) + "\n"
        )
