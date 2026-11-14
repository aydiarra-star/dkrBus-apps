from __future__ import annotations

import json
import subprocess
import stat
import sys
import tempfile
import unittest
import zipfile
from pathlib import Path
from unittest.mock import patch

from scripts.validate_gtfs import ValidationLimits, validate_gtfs_archive


VALID_TABLES = {
    "agency.txt": "agency_id,agency_name,agency_url,agency_timezone\n,Test Agency,https://example.invalid, Africa/Dakar\n",
    "stops.txt": (
        "stop_id,stop_name,stop_lat,stop_lon,location_type,parent_station\n"
        "S1,Stop One,14.7000,-17.4500,0,\n"
        "S2,Stop Two,14.7100,-17.4600,0,\n"
    ),
    "routes.txt": "route_id,agency_id,route_short_name,route_long_name,route_type\nR1,,1,Test Route,3\n",
    "trips.txt": "route_id,service_id,trip_id,direction_id,shape_id\nR1,WK,T1,0,\n",
    "stop_times.txt": (
        "trip_id,arrival_time,departure_time,stop_id,stop_sequence\n"
        "T1,25:10:00,25:10:00,S1,1\n"
        "T1,25:20:00,25:20:00,S2,2\n"
    ),
    "calendar.txt": (
        "service_id,monday,tuesday,wednesday,thursday,friday,saturday,sunday,start_date,end_date\n"
        "WK,1,1,1,1,1,0,0,20260101,20261231\n"
    ),
}


class GTFSValidatorTests(unittest.TestCase):
    def make_archive(self, tables: dict[str, str], wrapper: str | None = None) -> Path:
        directory = tempfile.TemporaryDirectory()
        self.addCleanup(directory.cleanup)
        archive_path = Path(directory.name) / "feed.zip"
        with zipfile.ZipFile(archive_path, "w", compression=zipfile.ZIP_DEFLATED) as archive:
            for filename, content in tables.items():
                name = f"{wrapper}/{filename}" if wrapper else filename
                archive.writestr(name, content.encode("utf-8"))
        return archive_path

    @staticmethod
    def issue_codes(report: dict[str, object]) -> set[str]:
        return {str(issue["code"]) for issue in report["issues"]}  # type: ignore[index]

    def test_valid_feed_accepts_gtfs_times_after_midnight(self) -> None:
        report = validate_gtfs_archive(self.make_archive(VALID_TABLES))
        self.assertTrue(report["structure_valid"])
        self.assertFalse(report["production_ready"])
        self.assertEqual(report["counts"], {"errors": 0, "warnings": 0})
        self.assertEqual(report["tables"]["stop_times.txt"], 2)  # type: ignore[index]
        self.assertIn("sha256", report["dataset"])  # type: ignore[operator]

    def test_accepts_a_single_enclosing_directory_in_the_zip(self) -> None:
        report = validate_gtfs_archive(self.make_archive(VALID_TABLES, wrapper="provider-export"))
        self.assertTrue(report["structure_valid"])

    def test_cli_emits_json_and_success_exit_code_for_a_valid_feed(self) -> None:
        archive = self.make_archive(VALID_TABLES)
        script = Path(__file__).resolve().parents[1] / "scripts" / "validate_gtfs.py"
        completed = subprocess.run([sys.executable, str(script), str(archive)], capture_output=True, text=True, check=False)
        self.assertEqual(completed.returncode, 0, completed.stderr)
        self.assertTrue(json.loads(completed.stdout)["structure_valid"])

    def test_calendar_dates_can_be_the_only_service_calendar(self) -> None:
        tables = {name: value for name, value in VALID_TABLES.items() if name != "calendar.txt"}
        tables["calendar_dates.txt"] = "service_id,date,exception_type\nWK,20261008,1\n"
        report = validate_gtfs_archive(self.make_archive(tables))
        self.assertTrue(report["structure_valid"])

    def test_missing_required_table_is_an_error(self) -> None:
        tables = {name: value for name, value in VALID_TABLES.items() if name != "routes.txt"}
        report = validate_gtfs_archive(self.make_archive(tables))
        self.assertFalse(report["structure_valid"])
        self.assertIn("MISSING_REQUIRED_TABLE", self.issue_codes(report))

    def test_duplicate_stop_id_and_invalid_coordinates_are_reported(self) -> None:
        tables = dict(VALID_TABLES)
        tables["stops.txt"] = (
            "stop_id,stop_name,stop_lat,stop_lon\n"
            "S1,Stop One,91,-17.45\n"
            "S1,Duplicate,14.70,-17.45\n"
        )
        report = validate_gtfs_archive(self.make_archive(tables))
        self.assertIn("DUPLICATE_ID", self.issue_codes(report))
        self.assertIn("COORDINATE_OUT_OF_RANGE", self.issue_codes(report))

    def test_unknown_stop_and_trip_references_are_reported(self) -> None:
        tables = dict(VALID_TABLES)
        tables["stop_times.txt"] = (
            "trip_id,arrival_time,departure_time,stop_id,stop_sequence\n"
            "MISSING,08:00:00,08:00:00,UNKNOWN_STOP,1\n"
        )
        report = validate_gtfs_archive(self.make_archive(tables))
        codes = self.issue_codes(report)
        self.assertIn("UNKNOWN_TRIP_REFERENCE", codes)
        self.assertIn("UNKNOWN_STOP_REFERENCE", codes)
        self.assertIn("TRIP_WITHOUT_STOP_TIMES", codes)

    def test_trip_service_must_exist_in_a_calendar(self) -> None:
        tables = dict(VALID_TABLES)
        tables["trips.txt"] = "route_id,service_id,trip_id\nR1,UNKNOWN,T1\n"
        report = validate_gtfs_archive(self.make_archive(tables))
        self.assertIn("UNKNOWN_SERVICE_REFERENCE", self.issue_codes(report))

    def test_non_monotonic_trip_times_are_rejected(self) -> None:
        tables = dict(VALID_TABLES)
        tables["stop_times.txt"] = (
            "trip_id,arrival_time,departure_time,stop_id,stop_sequence\n"
            "T1,08:10:00,08:10:00,S1,1\n"
            "T1,08:09:00,08:09:00,S2,2\n"
        )
        report = validate_gtfs_archive(self.make_archive(tables))
        self.assertIn("TIME_BEFORE_PREVIOUS_STOP", self.issue_codes(report))

    def test_frequency_rows_are_checked_and_never_promoted_to_realtime(self) -> None:
        tables = dict(VALID_TABLES)
        tables["frequencies.txt"] = "trip_id,start_time,end_time,headway_secs,exact_times\nT1,25:00:00,25:30:00,300,0\n"
        valid_report = validate_gtfs_archive(self.make_archive(tables))
        self.assertTrue(valid_report["structure_valid"])
        self.assertFalse(valid_report["production_ready"])

        tables["frequencies.txt"] = "trip_id,start_time,end_time,headway_secs\nUNKNOWN,25:30:00,25:00:00,0\n"
        invalid_report = validate_gtfs_archive(self.make_archive(tables))
        codes = self.issue_codes(invalid_report)
        self.assertIn("INVALID_HEADWAY", codes)
        self.assertIn("INVALID_FREQUENCY_RANGE", codes)
        self.assertIn("UNKNOWN_TRIP_REFERENCE", codes)

    def test_unchecked_optional_tables_are_rejected_until_supported(self) -> None:
        tables = dict(VALID_TABLES)
        tables["fare_rules.txt"] = "route_id\nR1\n"
        report = validate_gtfs_archive(self.make_archive(tables))
        self.assertFalse(report["structure_valid"])
        self.assertGreater(report["counts"]["errors"], 0)  # type: ignore[index]
        self.assertIn("OPTIONAL_TABLE_NOT_VALIDATED", self.issue_codes(report))

    def test_unrecognized_root_text_tables_are_rejected(self) -> None:
        tables = dict(VALID_TABLES)
        tables["vendor_extension.txt"] = "id,value\nX,ignored\n"
        report = validate_gtfs_archive(self.make_archive(tables))
        self.assertFalse(report["structure_valid"])
        self.assertIn("UNRECOGNIZED_TEXT_TABLE", self.issue_codes(report))

    def test_missing_stop_times_require_timepoint_zero(self) -> None:
        tables = dict(VALID_TABLES)
        tables["stops.txt"] = (
            "stop_id,stop_name,stop_lat,stop_lon,location_type,parent_station\n"
            "S1,Stop One,14.7000,-17.4500,0,\n"
            "S2,Stop Two,14.7100,-17.4600,0,\n"
            "S3,Stop Three,14.7200,-17.4700,0,\n"
        )
        tables["stop_times.txt"] = (
            "trip_id,arrival_time,departure_time,stop_id,stop_sequence,timepoint\n"
            "T1,08:00:00,08:00:00,S1,1,1\n"
            "T1,,,S2,2,1\n"
            "T1,08:20:00,08:20:00,S3,3,1\n"
        )
        invalid_report = validate_gtfs_archive(self.make_archive(tables))
        self.assertFalse(invalid_report["structure_valid"])
        self.assertIn("MISSING_STOP_TIME", self.issue_codes(invalid_report))

        tables["stop_times.txt"] = tables["stop_times.txt"].replace("T1,,,S2,2,1", "T1,,,S2,2,0")
        valid_report = validate_gtfs_archive(self.make_archive(tables))
        self.assertTrue(valid_report["structure_valid"], valid_report["issues"])

    def test_pickup_and_drop_off_types_must_use_gtfs_values(self) -> None:
        tables = dict(VALID_TABLES)
        tables["stop_times.txt"] = (
            "trip_id,arrival_time,departure_time,stop_id,stop_sequence,pickup_type,drop_off_type\n"
            "T1,08:00:00,08:00:00,S1,1,4,0\n"
            "T1,08:20:00,08:20:00,S2,2,0,9\n"
        )
        report = validate_gtfs_archive(self.make_archive(tables))
        self.assertFalse(report["structure_valid"])
        codes = self.issue_codes(report)
        self.assertIn("INVALID_PICKUP_TYPE", codes)
        self.assertIn("INVALID_DROP_OFF_TYPE", codes)

    def test_unsafe_archive_paths_are_rejected_without_extraction(self) -> None:
        tables = dict(VALID_TABLES)
        tables["../outside.txt"] = "should_not_be_written\n"
        report = validate_gtfs_archive(self.make_archive(tables))
        self.assertFalse(report["structure_valid"])
        self.assertIn("UNSAFE_ARCHIVE_PATH", self.issue_codes(report))

    def test_archive_size_limit_is_enforced(self) -> None:
        archive = self.make_archive(VALID_TABLES)
        report = validate_gtfs_archive(archive, ValidationLimits(max_archive_bytes=8))
        self.assertFalse(report["structure_valid"])
        self.assertIn("ARCHIVE_TOO_LARGE", self.issue_codes(report))

    def test_non_zip_input_returns_a_structured_error(self) -> None:
        with tempfile.TemporaryDirectory() as directory:
            path = Path(directory) / "not-a-zip.zip"
            path.write_text("not a zip", encoding="utf-8")
            report = validate_gtfs_archive(path)
        self.assertFalse(report["structure_valid"])
        self.assertIn("INVALID_ZIP", self.issue_codes(report))


    def test_non_monotonic_times_are_rejected_when_rows_are_out_of_order(self) -> None:
        tables = dict(VALID_TABLES)
        tables["stop_times.txt"] = (
            "trip_id,arrival_time,departure_time,stop_id,stop_sequence\n"
            "T1,08:00:00,08:00:00,S2,2\n"
            "T1,08:10:00,08:10:00,S1,1\n"
        )
        report = validate_gtfs_archive(self.make_archive(tables))
        codes = self.issue_codes(report)
        self.assertIn("TIME_BEFORE_PREVIOUS_STOP", codes)
        self.assertIn("STOP_TIMES_NOT_SORTED", codes)
        self.assertFalse(report["structure_valid"])

    def test_chronological_times_in_out_of_order_file_are_not_false_positive(self) -> None:
        tables = dict(VALID_TABLES)
        tables["stop_times.txt"] = (
            "trip_id,arrival_time,departure_time,stop_id,stop_sequence\n"
            "T1,08:10:00,08:10:00,S2,2\n"
            "T1,08:00:00,08:00:00,S1,1\n"
        )
        report = validate_gtfs_archive(self.make_archive(tables))
        self.assertTrue(report["structure_valid"])
        self.assertIn("STOP_TIMES_NOT_SORTED", self.issue_codes(report))
        self.assertNotIn("TIME_BEFORE_PREVIOUS_STOP", self.issue_codes(report))
        unsorted_issue = next(
            issue for issue in report["issues"] if issue["code"] == "STOP_TIMES_NOT_SORTED"
        )
        self.assertIn("après tri", unsorted_issue["message"])

    def test_windows_drive_archive_paths_are_rejected(self) -> None:
        tables = dict(VALID_TABLES)
        tables["C:/outside.txt"] = "must not be accepted\n"
        report = validate_gtfs_archive(self.make_archive(tables))
        self.assertFalse(report["structure_valid"])
        self.assertIn("UNSAFE_ARCHIVE_PATH", self.issue_codes(report))

    def test_archive_entry_expansion_and_row_limits_are_enforced(self) -> None:
        archive = self.make_archive(VALID_TABLES)
        entries_report = validate_gtfs_archive(archive, ValidationLimits(max_entries=1))
        self.assertIn("TOO_MANY_ENTRIES", self.issue_codes(entries_report))

        member_report = validate_gtfs_archive(archive, ValidationLimits(max_member_bytes=8))
        self.assertIn("ENTRY_TOO_LARGE", self.issue_codes(member_report))

        total_report = validate_gtfs_archive(archive, ValidationLimits(max_total_uncompressed_bytes=32))
        self.assertIn("FEED_TOO_LARGE", self.issue_codes(total_report))

        rows_report = validate_gtfs_archive(archive, ValidationLimits(max_rows_per_table=1))
        self.assertIn("TOO_MANY_ROWS", self.issue_codes(rows_report))

    def test_invalid_calendar_dates_and_times_are_reported(self) -> None:
        tables = dict(VALID_TABLES)
        tables["calendar.txt"] = (
            "service_id,monday,tuesday,wednesday,thursday,friday,saturday,sunday,start_date,end_date\n"
            "WK,2,1,1,1,1,0,0,20260230,20261231\n"
        )
        tables["stop_times.txt"] = (
            "trip_id,arrival_time,departure_time,stop_id,stop_sequence\n"
            "T1,25:60:00,25:60:00,S1,1\n"
            "T1,25:20:00,25:20:00,S2,2\n"
        )
        report = validate_gtfs_archive(self.make_archive(tables))
        codes = self.issue_codes(report)
        self.assertIn("INVALID_CALENDAR_DAY", codes)
        self.assertIn("INVALID_DATE", codes)
        self.assertIn("INVALID_TIME", codes)
        self.assertFalse(report["structure_valid"])

    def test_shape_points_use_sequence_values_not_physical_csv_row_order(self) -> None:
        tables = dict(VALID_TABLES)
        tables["shapes.txt"] = (
            "shape_id,shape_pt_lat,shape_pt_lon,shape_pt_sequence,shape_dist_traveled\n"
            "SH1,14.7100,-17.4600,11,15.8765\n"
            "SH1,14.7000,-17.4500,0,0\n"
            "SH1,14.7050,-17.4550,6,6.8310\n"
        )
        report = validate_gtfs_archive(self.make_archive(tables))
        self.assertTrue(report["structure_valid"], report["issues"])

    def test_shape_distances_must_increase_in_sequence_order(self) -> None:
        tables = dict(VALID_TABLES)
        tables["shapes.txt"] = (
            "shape_id,shape_pt_lat,shape_pt_lon,shape_pt_sequence,shape_dist_traveled\n"
            "SH1,14.7000,-17.4500,0,0\n"
            "SH1,14.7050,-17.4550,6,8\n"
            "SH1,14.7100,-17.4600,11,7\n"
        )
        report = validate_gtfs_archive(self.make_archive(tables))
        self.assertFalse(report["structure_valid"])
        self.assertIn("NON_INCREASING_SHAPE_DISTANCE", self.issue_codes(report))

    def test_shape_distances_must_be_finite_and_non_negative(self) -> None:
        tables = dict(VALID_TABLES)
        tables["shapes.txt"] = (
            "shape_id,shape_pt_lat,shape_pt_lon,shape_pt_sequence,shape_dist_traveled\n"
            "SH1,14.7000,-17.4500,0,-1\n"
            "SH1,14.7050,-17.4550,1,NaN\n"
        )
        report = validate_gtfs_archive(self.make_archive(tables))
        self.assertFalse(report["structure_valid"])
        self.assertIn("INVALID_SHAPE_DISTANCE", self.issue_codes(report))

    def test_frequency_ranges_for_one_trip_must_not_overlap(self) -> None:
        tables = dict(VALID_TABLES)
        tables["frequencies.txt"] = (
            "trip_id,start_time,end_time,headway_secs\n"
            "T1,08:00:00,09:00:00,600\n"
            "T1,08:30:00,09:30:00,600\n"
        )
        report = validate_gtfs_archive(self.make_archive(tables))
        self.assertFalse(report["structure_valid"])
        self.assertIn("OVERLAPPING_FREQUENCY_RANGES", self.issue_codes(report))

    def test_adjacent_frequency_ranges_and_other_trip_ranges_are_allowed(self) -> None:
        tables = dict(VALID_TABLES)
        tables["trips.txt"] = (
            "route_id,service_id,trip_id\n"
            "R1,WK,T1\n"
            "R1,WK,T2\n"
        )
        tables["stop_times.txt"] = (
            "trip_id,arrival_time,departure_time,stop_id,stop_sequence\n"
            "T1,08:00:00,08:00:00,S1,1\n"
            "T2,08:00:00,08:00:00,S1,1\n"
        )
        tables["frequencies.txt"] = (
            "trip_id,start_time,end_time,headway_secs\n"
            "T1,08:00:00,09:00:00,600\n"
            "T1,09:00:00,10:00:00,600\n"
            "T2,08:00:00,10:00:00,600\n"
        )
        report = validate_gtfs_archive(self.make_archive(tables))
        self.assertTrue(report["structure_valid"], report["issues"])

    def test_exact_times_must_be_consistent_for_each_trip(self) -> None:
        tables = dict(VALID_TABLES)
        tables["frequencies.txt"] = (
            "trip_id,start_time,end_time,headway_secs,exact_times\n"
            "T1,08:00:00,09:00:00,600,0\n"
            "T1,09:00:00,10:00:00,600,1\n"
        )
        report = validate_gtfs_archive(self.make_archive(tables))
        self.assertFalse(report["structure_valid"])
        self.assertIn("INCONSISTENT_EXACT_TIMES", self.issue_codes(report))

    def test_symlink_archive_entries_are_rejected(self) -> None:
        archive = self.make_archive(VALID_TABLES)
        with zipfile.ZipFile(archive, "a") as zipped:
            link = zipfile.ZipInfo("outside-link.txt")
            link.create_system = 3
            link.external_attr = (stat.S_IFLNK | 0o777) << 16
            zipped.writestr(link, "target.txt")
        report = validate_gtfs_archive(archive)
        self.assertFalse(report["structure_valid"])
        self.assertIn("UNSAFE_ARCHIVE_PATH", self.issue_codes(report))

    def test_duplicate_archive_member_names_are_rejected(self) -> None:
        archive = self.make_archive(VALID_TABLES)
        with zipfile.ZipFile(archive, "a") as zipped:
            zipped.writestr("agency.txt", "duplicate\n")
        report = validate_gtfs_archive(archive)
        self.assertFalse(report["structure_valid"])
        self.assertIn("DUPLICATE_ARCHIVE_ENTRY", self.issue_codes(report))

    def test_encrypted_archive_entries_are_rejected(self) -> None:
        archive = self.make_archive(VALID_TABLES)
        with zipfile.ZipFile(archive, "r") as zipped:
            infos = zipped.infolist()
        encrypted = zipfile.ZipInfo("encrypted.txt")
        encrypted.flag_bits |= 0x1
        with patch.object(zipfile.ZipFile, "infolist", return_value=infos + [encrypted]):
            report = validate_gtfs_archive(archive)
        self.assertFalse(report["structure_valid"])
        self.assertIn("ENCRYPTED_ENTRY", self.issue_codes(report))

    def test_unsupported_zip_compression_is_rejected_before_member_read(self) -> None:
        archive = self.make_archive(VALID_TABLES)
        unsupported = zipfile.ZipInfo("agency.txt")
        unsupported.compress_type = 99

        with patch.object(zipfile.ZipFile, "infolist", return_value=[unsupported]):
            report = validate_gtfs_archive(archive)

        self.assertFalse(report["structure_valid"])
        self.assertIn("UNSUPPORTED_COMPRESSION", self.issue_codes(report))

if __name__ == "__main__":
    unittest.main()
