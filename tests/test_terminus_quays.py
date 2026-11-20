import unittest
from types import SimpleNamespace

from scripts.audit_terminus_quays import (
    families,
    multiple_refs,
    platform_members,
    screen,
    patte_doie,
)


class TerminusSurveyTest(unittest.TestCase):
    def test_text_is_a_lead_not_an_operator_crosswalk(self):
        self.assertEqual(multiple_refs({"name": "Arret bus 18 / 39"}), ["18", "39"])
        self.assertEqual(multiple_refs({"name": "Terminus 217 et 218"}), ["217", "218"])
        self.assertEqual(multiple_refs({"route_ref": "16A;16B"}), ["16A", "16B"])
        self.assertEqual(
            multiple_refs({"name": "Route des Maristes, 141", "ref": "1;2"}), []
        )
        self.assertEqual(multiple_refs({"name": "HLM 6 / 10"}), [])
        self.assertEqual(
            families({"network": "Dakar Dem Dikk", "name": "Arrêt bus AFTU"}), ["ddd"]
        )

    def test_tag_grammar_requires_context(self):
        self.assertEqual(multiple_refs({"ref": "L5;L12"}), ["5", "12"])
        self.assertEqual(
            multiple_refs({"name": "Arret Mini Bus 24-33-46-70-27-41"}),
            ["24", "33", "46", "70", "27", "41"],
        )
        self.assertEqual(
            multiple_refs({"name": "Arrêt bus DDD (220, 12, 5, 6)"}),
            ["220", "12", "5", "6"],
        )
        for tags in (
            {"ref": "L5;12"},
            {"name": "Rue 5-12"},
            {"name": "5-12"},
            {"name": "Arrêt bus (5)-12"},
            {"ref": "L5;L5"},
        ):
            self.assertEqual(multiple_refs(tags), [])

    def test_literal_members_separate_stop_areas_way_ids_and_entry_only(self):
        r = SimpleNamespace(
            id=42,
            version=3,
            tags={"type": "route", "route": "bus", "operator": "DDD", "ref": "7"},
            members=[
                SimpleNamespace(type=t, ref=i, role=role)
                for t, i, role in [
                    ("n", 8, "stop"),
                    ("w", 8, ""),
                    ("w", 8, "platform"),
                    ("n", 8, "platform_entry_only"),
                    ("n", 9, "platform_exit_only"),
                ]
            ],
        )
        rows = platform_members(r, {"n8", "n9"})
        self.assertEqual(
            [
                (
                    v["pole"],
                    v["role"],
                    v["rank"],
                    v["platforms"],
                    v["before"],
                    v["after"],
                )
                for v in rows
            ],
            [
                ("n8", "platform_entry_only", 2, 3, "w8", "n9"),
                ("n9", "platform_exit_only", 3, 3, "n8", None),
            ],
        )
        r.tags["type"] = "public_transport"
        self.assertEqual(platform_members(r, {"n8"}), [])

    def test_start_and_finish_are_symbols_not_just_vertices(self):
        pole = {
            "id": "n1",
            "version": 2,
            "xy": (14.73, -17.38),
            "tags": {"operator": "Dakar Dem Dikk"},
        }
        wrong = {**pole, "id": "n2", "tags": {"name": "Route 218"}}
        d = {
            "overlayHash": "a",
            "positions": [[-17.37, 14.73], [-17.38, 14.73]],
            "orientation": "start-last",
            "markers": [
                {"role": "Start", "name": "A", "position": [-17.3803, 14.73]},
                {"role": "Finish", "name": "B", "position": [-17.37, 14.73]},
            ],
        }
        r = screen([pole, wrong], {"73": d, "53": {**d, "orientation": None}})
        self.assertEqual(
            (r["platformNodes"], r["namedNetworkNodes"], r["examinedEnds"]), (2, 1, 2)
        )
        self.assertEqual(r["withoutTwoDirectionalMarkers"], ["53"])
        [lead] = r["nearby"]
        self.assertEqual(
            (lead["role"], lead["pole"], lead["lineEndToPoleM"]), ("start", "n1", 0)
        )
        self.assertGreater(lead["markerToPoleM"], 20)
        self.assertFalse(lead["bothWithinLimit"])
        d["markers"][0]["position"] = d["positions"][1]
        self.assertTrue(screen([pole], {"73": d})["nearby"][0]["bothWithinLimit"])
        d["markers"].append(d["markers"][0])
        self.assertEqual(screen([pole], {"73": d})["examinedEnds"], 0)

    def test_missing_map_is_not_zero_distance(self):
        self.assertEqual(patte_doie(None), {"status": "NO_DIRECTIONAL_DRAWING"})
