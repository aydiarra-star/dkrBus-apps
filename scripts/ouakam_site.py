"""Local reference frame toward Palais. The OSM bus roadway is NOT a footway.
The regional inventory independently checks versions, member order and every
vertex of these two bounded way excerpts against the acquired PBF.
"""

import json
from pathlib import Path

from scripts.audit_gt54 import nearest
from scripts.audit_interchange_sites import distance

PINS = Path(__file__).resolve().parents[1] / "data/bus-review/ouakam-road.json"


def site():
    spec = json.loads(PINS.read_text())
    a, b = (v[2][::-1] for v in spec["ways"])
    if a[-1] != b[0]:
        raise ValueError("Jonction Ouakam absente")
    return a + b[1:], {f"n{i}": (lat, lon) for i, _, lat, lon in spec["markers"]}


def on_road(point, road):
    r = nearest(point, road)
    # Offsets at truncated ends do not locate a point on this section.
    return {"alongM": round(r[1], 1), "leftM": round(r[2], 1)} if r and r[3] else None


def before_end(line, meters):
    """A point on the last metres of the actual oriented drawing, not the
    chord to its start or its nearest terminus symbol. [lat, lon] in/out."""
    for i in range(len(line) - 1, 0, -1):
        p, q = line[i], line[i - 1]
        gap = distance(p, q)
        if gap > 0 and meters <= gap:
            return tuple(x + (y - x) * meters / gap for x, y in zip(p, q))
        meters -= gap
    return None


def drawing_frame(d, ends):
    if not ends:
        return {"status": "NO_DIRECTIONAL_DRAWING"}
    road, _ = site()
    points = [(p[1], p[0]) for p in d["positions"]]
    if d["orientation"] == "start-last":
        points.reverse()
    # Each control is measured independently on the DDD road. A pin can lie
    # across the street from a drawn vehicle approach. No snapping or walking.
    samples = {}
    for m in (75, 25, 0):
        q = before_end(points, m)
        samples[str(m)] = on_road(q, road) if q is not None else None
    return {
        "status": "DRAWING_ONLY",
        "overlaySha256": d["overlayHash"],
        "from": ends[0][1],
        "to": ends[1][1],
        "metersBeforeFinish": samples,
        "finishMarker": on_road(ends[1][2], road),
    }
