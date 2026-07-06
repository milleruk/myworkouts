from datetime import datetime, timedelta, timezone as dt_timezone

from django.test import SimpleTestCase

from .stats import (
    compute_activity_heatmap,
    compute_eddington_number,
    compute_streaks,
    compute_training_load,
    compute_weekly_stats,
)


def make_activity(days_ago: int, activity_type="running", distance_km=None, duration_min=30, **overrides):
    start = datetime.now(dt_timezone.utc) - timedelta(days=days_ago)
    activity = {
        "id": days_ago,
        "name": f"activity-{days_ago}",
        "activity_type": activity_type,
        "start_time_local": start,
        "distance_m": distance_km * 1000 if distance_km is not None else None,
        "duration_seconds": duration_min * 60,
        "elevation_gain_m": 0,
        "calories": 0,
    }
    activity.update(overrides)
    return activity


class EddingtonNumberTests(SimpleTestCase):
    def test_classic_example(self):
        # distances 1..7 km -> Eddington number is 4 (4 activities each >= 4km)
        activities = [
            make_activity(days_ago=i, distance_km=i) for i in range(1, 8)
        ]
        result = compute_eddington_number(None, activities)
        self.assertEqual(result["running"]["number"], 4)
        self.assertEqual(result["overall"]["number"], 4)

    def test_excludes_non_distance_types(self):
        activities = [make_activity(days_ago=1, activity_type="breathwork", distance_km=None)]
        result = compute_eddington_number(None, activities)
        self.assertEqual(result, {})

    def test_no_activities(self):
        self.assertEqual(compute_eddington_number(None, []), {})


class StreaksTests(SimpleTestCase):
    def test_current_and_longest_streak(self):
        # 5 consecutive days ending today, then a gap, then a 2-day run further back
        activities = [make_activity(days_ago=d) for d in [0, 1, 2, 3, 4, 10, 11]]
        result = compute_streaks(None, activities)["all"]
        self.assertEqual(result["current_streak_days"], 5)
        self.assertEqual(result["longest_streak_days"], 5)

    def test_grace_period_for_yesterday(self):
        activities = [make_activity(days_ago=d) for d in [1, 2, 3]]
        result = compute_streaks(None, activities)["all"]
        self.assertEqual(result["current_streak_days"], 3)

    def test_streak_broken_two_days_ago(self):
        activities = [make_activity(days_ago=d) for d in [2, 3, 4]]
        result = compute_streaks(None, activities)["all"]
        self.assertEqual(result["current_streak_days"], 0)

    def test_no_activities(self):
        result = compute_streaks(None, [])["all"]
        self.assertEqual(result["longest_streak_days"], 0)
        self.assertIsNone(result["last_activity_date"])


class ActivityHeatmapTests(SimpleTestCase):
    def test_covers_365_days_dense(self):
        result = compute_activity_heatmap(None, [make_activity(days_ago=0, duration_min=60)])["last_365"]
        self.assertEqual(len(result["days"]), 365)
        self.assertEqual(result["days"][-1]["count"], 1)
        self.assertEqual(result["days"][-1]["duration_minutes"], 60)
        self.assertEqual(result["days"][0]["count"], 0)


class WeeklyStatsTests(SimpleTestCase):
    def test_twelve_week_window(self):
        activities = [make_activity(days_ago=0, distance_km=10, duration_min=60)]
        result = compute_weekly_stats(None, activities)["current"]
        self.assertEqual(len(result["periods"]), 12)
        self.assertEqual(result["periods"][-1]["activity_count"], 1)
        self.assertEqual(result["periods"][-1]["distance_m"], 10000)


class TrainingLoadTests(SimpleTestCase):
    def test_steady_state_acwr_near_one(self):
        # One hour every day for 90 days -> acute (7d) and chronic (28d) hours
        # should both settle at ~7, so ACWR should converge to ~1.0.
        activities = [make_activity(days_ago=d, duration_min=60, distance_km=None) for d in range(90)]
        result = compute_training_load(None, activities)["current"]
        self.assertAlmostEqual(result["latest_acwr"], 1.0, delta=0.05)
        self.assertEqual(result["status"], "optimal")
