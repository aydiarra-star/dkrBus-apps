import unittest

from scripts.audit_terminus_quays import families, multiple_refs, screen, patte_doie


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
