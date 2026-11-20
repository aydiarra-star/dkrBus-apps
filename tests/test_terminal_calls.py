import unittest

from scripts.audit_terminal_calls import occurrences


def call(i, stop, pickup="0", drop="0"):
    return dict(
        stop_sequence=str(i), stop_id=stop, pickup_type=pickup, drop_off_type=drop
    )


class HistoricalTerminalTest(unittest.TestCase):
    def test_literal_order_roles_and_repeated_occurrences(self):
        # Do not drop the penultimate stop because the last has the same label,
        # or use a first/last flag in place of the literal pickup/drop-off code.
        status, hits = occurrences(
            [call(30, "a", "1"), call(10, "a"), call(20, "b", "0", "1")], {"a", "b"}
        )
        self.assertEqual(status, "MATCH")
        self.assertEqual(
            hits,
            (
                ("a", 1, None, "b", "0", "0"),
                ("b", 2, "a", "a", "0", "1"),
                ("a", 3, "b", None, "1", "0"),
            ),
        )

    def test_missing_rows_are_not_a_negative_stop_match(self):
        self.assertEqual(occurrences([], {"a"}), ("NO_JOINED_CALLS", ()))
        self.assertEqual(occurrences([call(1, "b")], {"a"}), ("NO_TARGET", ()))
        self.assertEqual(
            occurrences([call(1, "a"), call(1, "b")], {"a"}), ("TIED_RANKS", ())
        )
