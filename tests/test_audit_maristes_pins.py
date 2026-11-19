import unittest
from scripts.audit_maristes_pins import Sheet


class PublicSheetTests(unittest.TestCase):
    def parse(self, html, sid="37702688"):
        s = Sheet(sid)
        s.feed(
            '<link rel="canonical" href="https://moovitapp.com/index/fr/transport_en_commun-Route_Des_Maristes_141-Dakar-stop_37702688-5996">'
            + html
        )
        return s.result()

    def test_position_is_not_assumed_from_a_nearby_stop_or_the_map(self):
        self.assertEqual(
            self.parse(
                '<a href="/?tsid=37702687&tll=14.73,-17.44">voisin</a><img src="/14.73,-17.44">'
            )["status"],
            "NO_EXPLICIT_PIN",
        )
        self.assertEqual(self.parse("", "37702687")["status"], "UNCONFIRMED_PAGE")

    def test_each_pin_keeps_its_source_and_coordinates_for_manual_disagreement_review(
        self,
    ):
        result = self.parse(
            '<script type="application/ld+json">{"@type":"BusStop","geo":{"latitude":14.73,"longitude":-17.44}}</script><a href="/?tsid=37702688&tll=14.72,-17.43"></a>'
        )
        self.assertEqual(result["status"], "REVIEW_ONLY")
        self.assertEqual(
            result["pins"],
            [("destination-link", 14.72, -17.43), ("stop-jsonld", 14.73, -17.44)],
        )
