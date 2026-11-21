"""Documentary candidates for DDD→DDD and AFTU→AFTU. Not transfer rules.

Use exact OSM member IDs, permitted literal roles and surrounding platform
members of two separately identified lines. Never join a stop by its name.
"""
import re

from scripts.audit_bus_osm_occurrences import identity


def platform_members(relation, targets):
    """Rank among signed platform members, not the number of road ways or a
    timetable rank. Do not assign the AFTU line from the nearby symbol.
    """
    tags = relation.tags
    if tags.get("type") != "route" or tags.get("route") not in ("bus", "train"):
        return []
    platforms = [
        (f"{m.type}{m.ref}", m.role)
        for m in relation.members
        if m.role in ("platform", "platform_entry_only", "platform_exit_only")
    ]
    family, ref = identity(tags)
    return [
        {
            "pole": pole,
            "role": role,
            "relation": relation.id,
            "version": relation.version,
            "family": family,
            "ref": ref,
            "from": tags.get("from"),
            "to": tags.get("to"),
            "rank": i + 1,
            "platforms": len(platforms),
            "before": platforms[i - 1][0] if i else None,
            "after": platforms[i + 1][0] if i + 1 < len(platforms) else None,
        }
        for i, (pole, role) in enumerate(platforms)
        if pole in targets
    ]


def single_line(row):
    # L23;L5 is not a reviewed assignment to either line. An alternate
    # spelling of the SAME reference (7 / L7) is not a second line.
    m = re.fullmatch(r"(?:L\s*)?(\d+[A-Z]?)", row["ref"].upper())
    return m[1] if m and row["from"] and row["to"] else None


def same_family_candidates(platforms, paths):
    result = {}
    for family in ("ddd", "aftu"):
        calls = {p: [r for r in pos.get("rankedBusCalls", []) if r["family"] == family and single_line(r)]
                 for p, pos in platforms.items()}

        def pairs(p, q):
            return [[a, b] for a in calls[p] if a["before"] and a["role"] != "platform_entry_only"
                    for b in calls[q] if b["after"] and b["role"] != "platform_exit_only" and single_line(a) != single_line(b)]

        shared = {p: rows for p in calls if (rows := pairs(p, p))}
        linked = [[path, rows] for path in paths if (rows := pairs(path[0], path[1]))]
        result[family] = {"sharedObjects": shared, "linkedObjects": linked,
                          "rankedCalls": sum(map(len, calls.values()))}
    return result


def same_family_summary(result):
    for family, observed in result.items():
        shared = observed["sharedObjects"]
        # One representative per ordered line pair, with ranks in BOTH OSM
        # relations. Full roles, labels, neighbours and versions are in JSON.
        examples = {}
        for p, pairs in sorted(shared.items()):
            for a, b in pairs:
                examples.setdefault((single_line(a), single_line(b)), [p, a["relation"], a["rank"], a["before"],
                                                                      b["relation"], b["rank"], b["after"]])
        yield family, {"rankedCalls": observed["rankedCalls"], "sharedObjects": len(shared),
                       "orderedOccurrences": sum(map(len, shared.values())), "linkedObjects": len(observed["linkedObjects"]),
                       "orderedLinePairsAtSameObject": len(examples),
                       "sample": [[*key, *v] for key, v in sorted(examples.items())[:18]]}
