#!/usr/bin/env python3
"""Read-only extraction of Dakar public-transport route relations from an OSM PBF.

The output preserves OSM relation member order and roles. It does not infer a
commercial direction, stitch disconnected ways, or activate any route.
"""
from __future__ import annotations

import json
import sys
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


def _inside(lat: float, lon: float) -> bool:
    return BOUNDS["south"] <= lat <= BOUNDS["north"] and BOUNDS["west"] <= lon <= BOUNDS["east"]


def extract_route_relations(pbf_path: str) -> dict:
    try:
        import osmium
    except ImportError as exc:
        raise RuntimeError("Le module Python pyosmium est requis (pip install osmium).") from exc

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
            if not is_public_transport_route(tags):
                return
            members = [
                {"type": str(member.type), "ref": int(member.ref), "role": str(member.role or "")}
                for member in relation.members
            ]
            self.raw_relations.append({
                "id": int(relation.id),
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

    needed_node_ids: set[int] = set()
    needed_way_ids: set[int] = set()
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
                "id": node_id,
                "lat": float(node.location.lat),
                "lon": float(node.location.lon),
                "tags": {tag.k: tag.v for tag in node.tags},
            }

        def way(self, way):
            way_id = int(way.id)
            if way_id not in needed_way_ids:
                return
            geometry = []
            for node in way.nodes:
                if not node.location.valid():
                    geometry = []
                    break
                geometry.append([float(node.location.lon), float(node.location.lat)])
            self.ways[way_id] = {
                "id": way_id,
                "tags": {tag.k: tag.v for tag in way.tags},
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
        "dddAttributed": sum("dem dikk" in " ".join(str(item.get(key) or "") for key in ("operator", "network", "name")).lower() for item in output_relations),
        "aftuAttributed": sum("aftu" in " ".join(str(item.get(key) or "") for key in ("operator", "network", "name")).lower() for item in output_relations),
        "tataAttributed": sum("tata" in " ".join(str(item.get(key) or "") for key in ("operator", "network", "name")).lower() for item in output_relations),
    }
    return {
        "generatedAt": datetime.now(timezone.utc).isoformat(),
        "source": "Geofabrik Senegal and Gambia OSM PBF, Dakar bbox extract",
        "sourceUrl": "https://download.geofabrik.de/africa/senegal-and-gambia-latest.osm.pbf",
        "attribution": "© OpenStreetMap contributors",
        "license": "ODbL-1.0",
        "geographicBounds": BOUNDS,
        "summary": summary,
        "relations": output_relations,
        "warning": "Audit candidates only. OSM route relations do not by themselves prove current commercial service, operator approval, exact stop equivalence, or both service directions.",
    }


def main() -> int:
    if len(sys.argv) != 3:
        print("Usage: extract_dakar_bus_route_relations_from_pbf.py INPUT.osm.pbf OUTPUT.json", file=sys.stderr)
        return 2
    report = extract_route_relations(sys.argv[1])
    output = Path(sys.argv[2])
    output.parent.mkdir(parents=True, exist_ok=True)
    output.write_text(json.dumps(report, ensure_ascii=False) + "\n", encoding="utf-8")
    print(json.dumps(report["summary"], ensure_ascii=False))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
