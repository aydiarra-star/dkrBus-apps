#!/usr/bin/env python3
"""Read-only extraction of Dakar public-transport route relations from an OSM PBF.

The output preserves OSM relation member order and roles. It does not infer a
commercial direction, stitch disconnected ways, or activate any route.
"""
from __future__ import annotations

import argparse
import hashlib
import json
from datetime import datetime, timezone
from pathlib import Path

BOUNDS = {"south": 14.50, "west": -17.60, "north": 14.95, "east": -17.05}
ROUTE_MODES = {"bus", "share_taxi", "trolleybus"}
STOP_ROLES = {
    "stop", "platform", "stop_entry_only", "stop_exit_only",
    "platform_entry_only", "platform_exit_only",
}
ROUTE_WAY_ROLES = {"", "forward", "backward", "route"}


def is_public_transport_route(tags: dict[str, str]) -> bool:
    relation_type = str(tags.get("type", "")).lower()
    if relation_type == "route":
        return str(tags.get("route", "")).lower() in ROUTE_MODES
    if relation_type == "route_master":
        return str(tags.get("route_master", "")).lower() in ROUTE_MODES
    return False


def is_stop_member(member_type: str, role: str) -> bool:
    return member_type in {"n", "w"} and role in STOP_ROLES


def is_route_way_member(member_type: str, role: str) -> bool:
    return member_type == "w" and role in ROUTE_WAY_ROLES


def relation_intersects_dakar(members: list[dict], node_ids: set[int], way_ids: set[int]) -> bool:
    return any(
        (member["type"] == "n" and member["ref"] in node_ids)
        or (member["type"] == "w" and member["ref"] in way_ids)
        for member in members
    )


def audit_route_way_topology(route_ways: list[dict]) -> dict:
    """Audit shared-node connectivity without joining or drawing any geometry."""
    node_neighbors: dict[int, set[int]] = {}
    node_way_membership: dict[int, set[int]] = {}
    valid_way_count = 0

    for index, way in enumerate(route_ways):
        refs = [int(ref) for ref in (way.get("nodeRefs") or [])]
        if len(refs) < 2:
            continue
        valid_way_count += 1
        for ref in refs:
            node_way_membership.setdefault(ref, set()).add(index)
            node_neighbors.setdefault(ref, set())
        for left, right in zip(refs, refs[1:]):
            node_neighbors[left].add(right)
            node_neighbors[right].add(left)

    unseen = set(node_neighbors)
    component_way_counts: list[int] = []
    while unseen:
        stack = [unseen.pop()]
        component_nodes: set[int] = set()
        while stack:
            node_id = stack.pop()
            component_nodes.add(node_id)
            for neighbor in node_neighbors[node_id]:
                if neighbor in unseen:
                    unseen.remove(neighbor)
                    stack.append(neighbor)
        component_ways = set()
        for node_id in component_nodes:
            component_ways.update(node_way_membership.get(node_id, set()))
        component_way_counts.append(len(component_ways))

    adjacent_member_join_count = 0
    adjacent_member_endpoint_join_count = 0
    reversed_endpoint_join_count = 0
    for left, right in zip(route_ways, route_ways[1:]):
        a = [int(ref) for ref in (left.get("nodeRefs") or [])]
        b = [int(ref) for ref in (right.get("nodeRefs") or [])]
        if len(a) < 2 or len(b) < 2:
            continue
        if set(a).intersection(b):
            adjacent_member_join_count += 1
        if a[-1] == b[0] or a[-1] == b[-1] or a[0] == b[0] or a[0] == b[-1]:
            adjacent_member_endpoint_join_count += 1
        if a[-1] == b[-1] or a[0] == b[0]:
            reversed_endpoint_join_count += 1

    degrees = [len(neighbors) for neighbors in node_neighbors.values()]
    component_count = len(component_way_counts)
    largest_component = max(component_way_counts, default=0)
    branch_node_count = sum(degree > 2 for degree in degrees)
    odd_degree_node_count = sum(degree % 2 == 1 for degree in degrees)
    simple_path_candidate = (
        component_count == 1
        and branch_node_count == 0
        and odd_degree_node_count in {0, 2}
        and valid_way_count == len(route_ways)
        and valid_way_count > 0
    )
    return {
        "routeWayCount": len(route_ways),
        "validRouteWayCount": valid_way_count,
        "uniqueNodeCount": len(node_neighbors),
        "connectedComponentCount": component_count,
        "largestComponentWayCount": largest_component,
        "isolatedWayCount": sum(1 for size in component_way_counts if size == 1),
        "branchNodeCount": branch_node_count,
        "degreeOneEndpointCount": sum(1 for degree in degrees if degree == 1),
        "oddDegreeNodeCount": odd_degree_node_count,
        "adjacentMemberSharedNodeCount": adjacent_member_join_count,
        "adjacentMemberEndpointJoinCount": adjacent_member_endpoint_join_count,
        "adjacentMemberReversedEndpointJoinCount": reversed_endpoint_join_count,
        "simplePathCandidate": simple_path_candidate,
        "warning": "Topology candidate only; this audit does not stitch ways or certify a commercial direction.",
    }

def _inside(lat: float, lon: float) -> bool:
    return BOUNDS["south"] <= lat <= BOUNDS["north"] and BOUNDS["west"] <= lon <= BOUNDS["east"]


def extract_route_relations(pbf_path: str, pinned: dict | None = None) -> dict:
    try:
        import osmium
    except ImportError as exc:
        raise RuntimeError("Le module Python pyosmium est requis (pip install osmium).") from exc

    pin_relations = {r['id'] for r in (pinned or {}).get('relations', [])}
    station_relations = []

    class CandidateCollector(osmium.SimpleHandler):
        def __init__(self):
            super().__init__()
            self.node_ids: set[int] = set()
            self.way_ids: set[int] = set()
            self.raw_relations: list[dict] = []

        def node(self, node):
            if node.location.valid() and _inside(float(node.location.lat), float(node.location.lon)):
                self.node_ids.add(int(node.id))

        def way(self, way):
            if any(
                node.location.valid() and _inside(float(node.location.lat), float(node.location.lon))
                for node in way.nodes
            ):
                self.way_ids.add(int(way.id))

        def relation(self, relation):
            tags = {tag.k: tag.v for tag in relation.tags}
            if int(relation.id) not in pin_relations and not is_public_transport_route(tags):
                return
            members = [
                {"type": str(member.type), "ref": int(member.ref), "role": str(member.role or "")}
                for member in relation.members
            ]
            if int(relation.id) in pin_relations:
                station_relations.append({"id": int(relation.id), "version": int(relation.version), "members": members})
            if not is_public_transport_route(tags):
                return  # station area metadata is not a route
            self.raw_relations.append({
                "id": int(relation.id),
                "version": int(relation.version),
                "timestamp": str(relation.timestamp),
                "changeset": int(relation.changeset),
                "uid": int(relation.uid),
                "user": str(relation.user),
                "tags": tags,
                "members": members,
            })

    collector = CandidateCollector()
    collector.apply_file(pbf_path, locations=True)

    route_relations = [
        relation for relation in collector.raw_relations
        if relation["tags"].get("type") == "route"
        and relation_intersects_dakar(relation["members"], collector.node_ids, collector.way_ids)
    ]
    route_relation_ids = {relation["id"] for relation in route_relations}
    route_masters = [
        relation for relation in collector.raw_relations
        if relation["tags"].get("type") == "route_master"
        and any(member["type"] == "r" and member["ref"] in route_relation_ids for member in relation["members"])
    ]
    selected_relations = route_relations + route_masters

    # Additional bounded road/marker objects for evidence checks. They may not
    # belong to ANY bus relation. Never add them to a relation's members.
    pin_nodes = {m[0] for m in (pinned or {}).get("markers", [])}
    pin_ways = {w[0] for w in (pinned or {}).get("ways", [])}
    needed_node_ids = set(pin_nodes)
    needed_way_ids = set(pin_ways)
    for relation in selected_relations:
        for member in relation["members"]:
            if member["type"] == "n":
                needed_node_ids.add(member["ref"])
            elif member["type"] == "w":
                needed_way_ids.add(member["ref"])

    class MemberCollector(osmium.SimpleHandler):
        def __init__(self):
            super().__init__()
            self.nodes: dict[int, dict] = {}
            self.ways: dict[int, dict] = {}

        def node(self, node):
            node_id = int(node.id)
            if node_id not in needed_node_ids or not node.location.valid():
                return
            self.nodes[node_id] = {
                "id": node_id, "version": int(node.version),
                "lat": float(node.location.lat),
                "lon": float(node.location.lon),
                "tags": {tag.k: tag.v for tag in node.tags},
            }

        def way(self, way):
            way_id = int(way.id)
            if way_id not in needed_way_ids:
                return
            geometry = []
            node_refs = []
            for node in way.nodes:
                if not node.location.valid():
                    geometry = []
                    node_refs = []
                    break
                node_refs.append(int(node.ref))
                geometry.append([float(node.location.lon), float(node.location.lat)])
            self.ways[way_id] = {
                "id": way_id, "version": int(way.version),
                "tags": {tag.k: tag.v for tag in way.tags},
                "nodeRefs": node_refs,
                "geometry": geometry,
            }

    members = MemberCollector()
    members.apply_file(pbf_path, locations=True)

    output_relations = []
    for relation in selected_relations:
        ordered_members = []
        stops = []
        route_ways = []
        for member in relation["members"]:
            entry = dict(member)
            if member["type"] == "n":
                feature = members.nodes.get(member["ref"])
                if feature:
                    entry["feature"] = feature
                    if is_stop_member(member["type"], member["role"]):
                        stops.append({
                            "memberOrder": len(ordered_members),
                            "role": member["role"],
                            **feature,
                        })
            elif member["type"] == "w":
                feature = members.ways.get(member["ref"])
                if feature:
                    entry["feature"] = feature
                    if is_stop_member(member["type"], member["role"]):
                        stops.append({
                            "memberOrder": len(ordered_members),
                            "role": member["role"],
                            **feature,
                        })
                    if is_route_way_member(member["type"], member["role"]):
                        route_ways.append({
                            "memberOrder": len(ordered_members),
                            "role": member["role"],
                            **feature,
                        })
            ordered_members.append(entry)

        tags = relation["tags"]
        output_relations.append({
            "id": relation["id"],
            "version": relation.get("version"),
            "timestamp": relation.get("timestamp"),
            "changeset": relation.get("changeset"),
            "uid": relation.get("uid"),
            "user": relation.get("user"),
            "tags": tags,
            "mode": tags.get("route") or tags.get("route_master"),
            "operator": tags.get("operator"),
            "network": tags.get("network"),
            "ref": tags.get("ref"),
            "name": tags.get("name"),
            "memberCount": len(ordered_members),
            "stopMemberCount": len(stops),
            "routeWayMemberCount": len(route_ways),
            "membersInRelationOrder": ordered_members,
            "stopsInRelationOrder": stops,
            "routeWaysInRelationOrder": route_ways,
            "topologyAudit": audit_route_way_topology(route_ways),
            "activationStatus": "OSM_RELATION_CANDIDATE_ONLY",
            "directionWarning": "Relation member order and roles are preserved; no reverse direction is inferred.",
            "geometryWarning": "Way members are retained separately; disconnected ways are not stitched into a fabricated line.",
        })

    output_relations.sort(key=lambda item: (str(item.get("mode") or ""), str(item.get("ref") or ""), item["id"]))
    summary = {
        "routeRelationCount": len(route_relations),
        "routeMasterCount": len(route_masters),
        "relationsWithStopMembers": sum(bool(item["stopsInRelationOrder"]) for item in output_relations),
        "relationsWithRouteWays": sum(bool(item["routeWaysInRelationOrder"]) for item in output_relations),
        "simplePathTopologyCandidates": sum(bool(item["topologyAudit"]["simplePathCandidate"]) for item in output_relations),
        "dddAttributed": sum("dem dikk" in " ".join(str(item.get(key) or "") for key in ("operator", "network", "name")).lower() for item in output_relations),
        "aftuAttributed": sum("aftu" in " ".join(str(item.get(key) or "") for key in ("operator", "network", "name")).lower() for item in output_relations),
        "tataAttributed": sum("tata" in " ".join(str(item.get(key) or "") for key in ("operator", "network", "name")).lower() for item in output_relations),
    }
    return {
        "generatedAt": datetime.now(timezone.utc).isoformat(),
        "source": "OSM PBF, filtered by Dakar bbox membership",
        "attribution": "© OpenStreetMap contributors",
        "license": "ODbL-1.0",
        "geographicBounds": BOUNDS,
        "summary": summary,
        "pinnedObjects": {"relations": station_relations,
                          "nodes": [members.nodes[i] for i in sorted(pin_nodes & members.nodes.keys())],
                          "ways": [members.ways[i] for i in sorted(pin_ways & members.ways.keys())]},
        "relations": output_relations,
        "warning": "Audit candidates only. OSM route relations do not by themselves prove current commercial service, operator approval, exact stop equivalence, or both service directions.",
    }


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('input')
    parser.add_argument('output', type=Path)
    parser.add_argument('--inventory', type=Path, help='Also read the pinned way and marker IDs from audit:bus')
    parser.add_argument('--source-url', help='URL of the actual input, including mirror if used')
    args = parser.parse_args()
    pinned = json.loads(args.inventory.read_text())['pinnedOsm'] if args.inventory else None
    report = extract_route_relations(args.input, pinned)
    report["sourceUrl"] = args.source_url
    with open(args.input, "rb") as pbf:
        report["sourceSha256"] = hashlib.file_digest(pbf, "sha256").hexdigest()
    output = args.output
    output.parent.mkdir(parents=True, exist_ok=True)
    output.write_text(json.dumps(report, ensure_ascii=False) + "\n", encoding="utf-8")
    print(json.dumps(report["summary"], ensure_ascii=False))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
