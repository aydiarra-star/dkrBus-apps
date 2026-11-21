"""Save the ranked terminal measurements from one CI check, not route geometry.

Use the *measuring job's* revision and URL. Fail on truncated notices rather
than treating an incomplete array of route roles as a negative observation.
"""

import argparse
import json
import re
from pathlib import Path


def ranked(notices, title, total):
    groups = sorted(
        (int(m[1]), json.loads(row["message"]))
        for row in notices
        if (m := re.fullmatch(re.escape(title) + r" (\d+)", row["title"] or ""))
    )
    rows = []
    for rank, batch in groups:
        if rank != len(rows) + 1 or not isinstance(batch, list) or not batch:
            raise ValueError(f"Rangs discontinus : {title}")
        rows.extend(batch)
    if len(rows) != total:
        raise ValueError(f"Annotations incomplètes : {title} ({len(rows)}/{total})")
    return rows


def freeze_terminal(notices, revision, job):
    def one(title):
        [s] = [n["message"] for n in notices if n["title"] == title]
        return s

    counts = json.loads(one("Terminus AFTU et poteaux nommés"))
    if (
        not re.fullmatch("[0-9a-f]{40}", revision)
        or counts["scope"] != "SURVEY_ONLY"
        or not re.fullmatch("[0-9a-f]{64}", counts["pbfSha256"])
        or counts["pbfSha256"] != one("Voirie Sénégal")
    ):
        raise ValueError("Édition de mesure non identifiée")
    near = ranked(notices, "Piste terminus", counts["nearby"])
    refs = ranked(notices, "Numéros sur poteaux", counts["multi"])
    roles = ranked(notices, "Rangs des poteaux proches", counts["platformMemberships"])
    if sum(v[5] for v in near) != counts["both"] or len(
        {tuple(v[:3]) for v in near}
    ) != len(near):
        raise ValueError("Résultats de proximité incohérents")
    pages = {
        p[0]: p[4]
        for n in notices
        if n["title"] == "Cartes AFTU"
        for p in json.loads(n["message"])
    }
    return {
        "sourceRevision": revision,
        "check": job,
        "attribution": "© OpenStreetMap contributors · ODbL 1.0",
        "radiusM": 20,
        "counts": counts,
        "nearbyColumns": [
            "line",
            "symbolRole",
            "osmNode",
            "symbolToNodeM",
            "lineEndToNodeM",
            "bothWithinRadius",
        ],
        "nearby": near,
        "overlaySha256": {k: pages[k] for k in sorted({v[0] for v in near}, key=int)},
        "multipleLineReferences": refs,
        "membershipColumns": [
            "osmNode",
            "relation",
            "version",
            "literalRef",
            "role",
            "platformRank",
            "platformCount",
            "previous",
            "next",
        ],
        "platformMemberships": roles,
        "patteDoie60": json.loads(one("60 AFTU et chemin de Patte d’Oie")),
        "ouakam67": json.loads(one("Approche du terminus 67 à Ouakam")),
    }


if __name__ == "__main__":
    cli = argparse.ArgumentParser(description=__doc__)
    cli.add_argument("annotations", type=Path)
    cli.add_argument("revision")
    cli.add_argument("job_url")
    a = cli.parse_args()
    print(
        json.dumps(
            freeze_terminal(
                json.loads(a.annotations.read_text()), a.revision, a.job_url
            ),
            indent=2,
            ensure_ascii=False,
        )
    )
