import unittest

from scripts.fetch_aftu_official_route_pages import (
    extract_balanced_json,
    extract_itinerary_text,
    extract_map_id,
    extract_return_hints,
    extract_waymark_geojson,
    extract_waymark_nonce,
    extract_waymark_endpoint,
    parse_french_date,
    parse_index,
    split_route_segments,
)


class AftuOfficialRoutePageTests(unittest.TestCase):
    def test_index_parser_associates_itinerary_links_with_line_headings(self):
        html = """
        <h2>LAT DIOR - HLM GRAND YOFF</h2>
        <h3>LIGNE 1</h3>
        <a href="/map/dakar-urbain-ligne-1/">Voir itinéraire</a>
        <h2>PARCELLES - PETERSEN</h2>
        <h3>LIGNE 2</h3>
        <a href="/map/dakar-urbain-ligne-2/"><span>Voir itinéraire</span></a>
        <h3>LIGNE 3</h3>
        """
        index = parse_index(html, "https://aftu-senegal.org/infos-pratiques/")
        self.assertEqual(index["linesListed"], ["1", "2", "3"])
        self.assertEqual([item["line"] for item in index["routePages"]], ["1", "2"])
        self.assertEqual(index["linesWithoutRoutePage"], ["3"])

    def test_parses_french_published_dates(self):
        self.assertEqual(parse_french_date("Publié le 18 mai 2026"), "2026-05-18")
        self.assertEqual(parse_french_date("Publié le 25 juin 2026"), "2026-06-25")
        self.assertIsNone(parse_french_date("date non publiée"))

    def test_extracts_itinerary_after_last_date_and_before_collection(self):
        text = (
            "Dakar Urbain ligne 1 18 mai 2026 18 mai 2026 ITINERAIRE "
            "TERMINUS GARE LAT DIOR - RUE SANDINIERY - AVENUE BOURGUIBA "
            "- TERMINUS HLM GRAND MEDINE Collection Share"
        )
        self.assertEqual(
            extract_itinerary_text(text),
            "TERMINUS GARE LAT DIOR - RUE SANDINIERY - AVENUE BOURGUIBA - TERMINUS HLM GRAND MEDINE",
        )

    def test_extracts_route_text_when_itineraire_heading_is_absent(self):
        text = (
            "Dakar Urbain ligne 30 25 juin 2026 25 juin 2026 "
            "TERMINUS GADAYE - ROUTE DE NIAYES - TERMINUS PETERSEN Collection"
        )
        self.assertEqual(
            extract_itinerary_text(text),
            "TERMINUS GADAYE - ROUTE DE NIAYES - TERMINUS PETERSEN",
        )

    def test_splits_road_sequence_and_extracts_return_hints(self):
        itinerary = (
            "TERMINUS A - RUE 17 - AVENUE BOURGUIBA - RUE 39 (RETOUR PAR RUE 17) "
            "- TERMINUS B"
        )
        self.assertEqual(
            split_route_segments(itinerary),
            ["TERMINUS A", "RUE 17", "AVENUE BOURGUIBA", "RUE 39 (RETOUR PAR RUE 17)", "TERMINUS B"],
        )
        self.assertEqual(extract_return_hints(itinerary), ["RUE 17"])

    def test_splits_hyphenated_terminus_names_without_losing_route_separator(self):
        self.assertEqual(
            split_route_segments("TERMINUS YOFF-VILLAGE- AUTOROUTE SEYDINA LIMAMOULAYE - PETERSEN"),
            ["TERMINUS YOFF-VILLAGE", "AUTOROUTE SEYDINA LIMAMOULAYE", "PETERSEN"],
        )

    def test_extracts_multiple_return_road_hints_from_one_itinerary(self):
        itinerary = "RUE 39 - RETOUR RUE 17 - RUE 22 - RUE 25 - RETOUR RUE 37 - AVENUE BLAISE DIAGNE"
        self.assertEqual(extract_return_hints(itinerary), ["RUE 17", "RUE 37"])

    def test_balanced_json_parser_handles_nested_objects_and_braces_in_strings(self):
        raw = (
            '{"type":"FeatureCollection","features":['
            '{"type":"Feature","properties":{"name":"Route } segment"},'
            '"geometry":{"type":"LineString","coordinates":[[1,2],[3,4]]}}]}'
        )
        parsed, end = extract_balanced_json("prefix(" + raw + ");suffix", 7)
        self.assertEqual(parsed["type"], "FeatureCollection")
        self.assertEqual(parsed["features"][0]["properties"]["name"], "Route } segment")
        self.assertGreater(end, 7)

    def test_extracts_waymark_geojson_embedded_in_page_script(self):
        html = """
        <script>
        waymark_viewer.load_json({
          "type":"FeatureCollection",
          "features":[
            {"type":"Feature","properties":{"title":"Ligne 1"},
             "geometry":{"type":"LineString","coordinates":[[-17.4,14.7],[-17.3,14.8]]}}
          ]
        });
        </script>
        """
        payloads = extract_waymark_geojson(html)
        self.assertEqual(len(payloads), 1)
        self.assertEqual(payloads[0]["features"][0]["geometry"]["type"], "LineString")

    def test_extracts_waymark_map_id_nonce_and_http_endpoint(self):
        html = """
        <body class="single-waymark_map postid-48006">
        <script>
          var waymark_security = "nonce-value";
          var waymark_http_endpoint = "https://aftu-senegal.org/?waymark_http=1";
        </script>
        </body>
        """
        self.assertEqual(extract_map_id(html, "https://aftu-senegal.org/map/example/"), "48006")
        self.assertEqual(extract_waymark_nonce(html), "nonce-value")
        self.assertEqual(
            extract_waymark_endpoint(html, "https://aftu-senegal.org/map/example/"),
            "https://aftu-senegal.org/?waymark_http=1",
        )


if __name__ == "__main__":
    unittest.main()
