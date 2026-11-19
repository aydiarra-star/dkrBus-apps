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

from scripts.extract_dakar_pedestrian_ways_from_pbf import is_walkable

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


def audit(pbf):
    import osmium

    platforms, restrictions = {}, set()
    member_of = defaultdict(list)
    touch = defaultdict(set)
    graph = defaultdict(list)

    def save(osm_id, osm, tags, refs, xy):
        sites = [
            k
            for k, (lat, lon, r) in SITES.items()
            if any(distance(p, (lat, lon)) <= r for p in xy)
        ]
        if sites:
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
    results = {}
    for site in SITES:
        ps = [p for p in platforms.values() if site in p["sites"]]
        pairs = []
        for p in ps:
            p["touchingFootways"] = sorted({w for n in p["refs"] for w in touch[n]})
            p["memberships"] = member_of[p["id"]]
            dist, prev = reachable(p["refs"], graph, 1200)
            for q in ps:
                if q is p:
                    continue
                target = min(
                    (n for n in q["refs"] if n in dist), key=dist.get, default=None
                )
                if target is None:
                    continue
                end = target
                ways = []
                while target in prev:
                    target, w = prev[target]
                    if not ways or ways[-1] != w:
                        ways.append(w)
                pairs.append(
                    [p["id"], q["id"], round(dist[end], 1), target, end, ways[::-1]]
                )
        results[site] = {"platforms": ps, "candidatePaths": pairs}
    return results


def summary(sites):
    for name, s in sites.items():
        ps = s["platforms"]
        brief = [
            [
                p["id"],
                p["tags"].get("name"),
                p["tags"].get("network"),
                p["tags"].get("route_ref"),
                p["touchingFootways"],
            ]
            for p in ps
        ]
        # Limit annotations; the artifact retains every identified candidate.
        print(
            f"::notice title=Quais {name}::"
            + json.dumps(
                {
                    "count": len(ps),
                    "connected": sum(bool(p["touchingFootways"]) for p in ps),
                    "paths": len(s["candidatePaths"]),
                    "sample": brief[:30],
                },
                ensure_ascii=False,
            ).replace("%", "%25")
        )
        if s["candidatePaths"]:
            print(
                f"::notice title=Jonctions {name}::"
                + json.dumps(s["candidatePaths"][:24])
            )


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("pbf", type=Path)
    parser.add_argument("output", type=Path)
    parser.add_argument("--ci-summary", action="store_true")
    args = parser.parse_args()
    sites = audit(args.pbf)
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
