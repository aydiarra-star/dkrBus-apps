"""Combine two successful, same-revision CI measurements for documentary review.

Verify the job SHAs before supplying their annotations (docs/depot-thiaroye.md).
A missing overlay or a partial set of probes is not a negative spatial result.
"""
import argparse
import json
import re
from pathlib import Path

from scripts.audit_interchange_sites import SITES
from scripts.audit_thiaroye_site import AOI_CONTROLS, BBOX, DIGEST, SAMPLE_METRES, STOP_IDS, measured_ways


def freeze_site(aftu, regional, revision, aftu_job, regional_job):
    def one(check, *titles):
        [value] = [n["message"] for n in check if n["title"] in titles]
        return value

    def local(key):
        return json.loads(one(aftu, "Thiaroye " + key))

    pbf = local("pbfSha256")
    if not re.fullmatch("[0-9a-f]{40}", revision) or not re.fullmatch("[0-9a-f]{64}", pbf):
        raise ValueError("Révision ou empreinte PBF manquante")
    if pbf != one(aftu, "Voirie Sénégal") or pbf != one(regional, "Empreinte continuité"):
        raise ValueError("Les deux mesures n’utilisent pas le même PBF national")
    # The comma in the bab2c86 workflow title was parsed by Actions as a separator.
    windows = json.loads(one(regional, "Quais par site", "Quais par site (total"))
    topology = json.loads(one(regional, "Topologie régionale quais"))
    if windows.keys() != SITES.keys() or any(len(row) != 3 for row in windows.values()):
        raise ValueError("Bilan des fenêtres incomplet")
    if not re.fullmatch("[0-9a-f]{64}", topology["extractSha256"]):
        raise ValueError("Découpe régionale non identifiée")

    probes, contacts, drawings = local("probes"), local("controlNodeHighwayContacts"), local("outboundDrawings")
    if probes.keys() != STOP_IDS['ddd'] | STOP_IDS['aftu'] | {'osmPole', 'arcgis539', 'arcgis576'} or set(map(int, contacts)) != set(AOI_CONTROLS):
        raise ValueError("Appels ou nœuds de contrôle manquants")
    if local("unmeasuredDrawings") != [] or drawings.keys() != {"aftu73", "ddd218"}:
        raise ValueError("Les deux dessins sortants n’ont pas été mesurés")
    ways = local("ways")
    for drawing in drawings.values():
        samples = drawing["fromStartM"]
        if samples.keys() != set(map(str, SAMPLE_METRES)) or None in samples.values():
            raise ValueError("Mesure incomplète des premiers 300 m")
    measured = {"controlNodeHighwayContacts": contacts, "probes": probes, "outboundDrawings": drawings}
    if set(map(int, ways)) != measured_ways(measured):
        raise ValueError("Versions de la voirie incomplètes")
    return {
        "scope": "SITE_SURVEY_ONLY", "sourceRevision": revision, "aftuJob": aftu_job, "regionalJob": regional_job,
        "attribution": "© OpenStreetMap contributors · ODbL 1.0", "boundsWSEN": BBOX, "pbfSha256": pbf,
        "archiveSha256": DIGEST, "wayColumns": ["version", "highway", "oneway", "access", "foot"],
        "probeDistanceColumns": ["way", "offsetToAxisM"], **measured, "ways": ways,
        "siteColumns": ["platforms", "touchingFootways", "directedPaths"], "siteWindows": windows, "region": topology,
    }


if __name__ == "__main__":
    cli = argparse.ArgumentParser(description=__doc__)
    for arg in ("aftu", "regional"):
        cli.add_argument(arg, type=Path)
    for arg in ("revision", "aftu_job", "regional_job"):
        cli.add_argument(arg)
    a = cli.parse_args()
    print(json.dumps(freeze_site(json.loads(a.aftu.read_text()), json.loads(a.regional.read_text()),
                                a.revision, a.aftu_job, a.regional_job), ensure_ascii=False, indent=2))
