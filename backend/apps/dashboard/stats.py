"""Pure stat-computation functions. Each takes a user plus a pre-fetched list
of activity dicts (see apps.dashboard.tasks.build_stats_for_user for the
single shared query) and returns {scope: value}, so the orchestrator task can
treat every stat the same way regardless of how many scopes it produces.
"""

from collections import defaultdict
from datetime import date, timedelta

from django.utils import timezone

# Real Garmin activity_type values are messy (road_biking, trail_running,
# indoor_cycling, breathwork, strength_training, ...). Eddington number is a
# distance metric, so only distance-bearing sports are grouped; things like
# breathwork/strength are excluded entirely rather than guessed at.
ENDURANCE_GROUPS = {
    "running": {
        "running", "trail_running", "treadmill_running", "track_running",
        "street_running", "virtual_run",
    },
    "cycling": {
        "cycling", "road_biking", "mountain_biking", "gravel_cycling",
        "indoor_cycling", "virtual_ride", "cyclocross", "track_cycling",
        "commuting",
    },
    "walking_hiking": {"walking", "hiking", "casual_walking", "speed_walking"},
    "swimming": {"lap_swimming", "open_water_swimming", "swimming"},
}


def _eddington_for_distances(distances_km: list[float]) -> dict:
    if not distances_km:
        return {"number": 0, "unit": "km", "activities_counted": 0, "curve": []}
    sorted_desc = sorted(distances_km, reverse=True)
    e = 0
    for i, d in enumerate(sorted_desc, start=1):
        if d >= i:
            e = i
        else:
            break
    lo, hi = max(1, e - 5), e + 15
    curve = [
        {"distance_km": t, "count_at_least": sum(1 for d in distances_km if d >= t)}
        for t in range(lo, hi + 1)
    ]
    return {"number": e, "unit": "km", "activities_counted": len(distances_km), "curve": curve}


def compute_eddington_number(user, activities: list[dict]) -> dict[str, dict]:
    result = {}
    all_distances = []
    for group_name, type_keys in ENDURANCE_GROUPS.items():
        distances = [
            a["distance_m"] / 1000
            for a in activities
            if a["activity_type"] in type_keys and a["distance_m"]
        ]
        if distances:
            result[group_name] = _eddington_for_distances(distances)
            all_distances.extend(distances)
    if all_distances:
        result["overall"] = _eddington_for_distances(all_distances)
    return result


def _consecutive_runs(dates: list[date]) -> list[tuple[date, date, int]]:
    """dates must be sorted ascending and unique. Returns (start, end, length)
    for each run of consecutive calendar days."""
    runs = []
    run_start = prev = dates[0]
    length = 1
    for d in dates[1:]:
        if (d - prev).days == 1:
            length += 1
        else:
            runs.append((run_start, prev, length))
            run_start = d
            length = 1
        prev = d
    runs.append((run_start, prev, length))
    return runs


def compute_streaks(user, activities: list[dict]) -> dict[str, dict]:
    dates = sorted({a["start_time_local"].date() for a in activities})
    empty = {
        "current_streak_days": 0, "current_streak_start": None,
        "longest_streak_days": 0, "longest_streak_start": None,
        "longest_streak_end": None, "last_activity_date": None,
    }
    if not dates:
        return {"all": empty}

    runs = _consecutive_runs(dates)
    longest_start, longest_end, longest_len = max(runs, key=lambda r: r[2])

    today = timezone.localdate()
    last_date = dates[-1]
    if (today - last_date).days <= 1:
        current_start, _, current_len = runs[-1]
    else:
        current_start, current_len = None, 0

    return {"all": {
        "current_streak_days": current_len,
        "current_streak_start": current_start.isoformat() if current_start else None,
        "longest_streak_days": longest_len,
        "longest_streak_start": longest_start.isoformat(),
        "longest_streak_end": longest_end.isoformat(),
        "last_activity_date": last_date.isoformat(),
    }}


def _empty_bucket() -> dict:
    return {"distance_m": 0.0, "duration_seconds": 0.0, "elevation_gain_m": 0.0, "activity_count": 0, "calories": 0.0}


def _add_to_bucket(bucket: dict, a: dict) -> None:
    bucket["distance_m"] += a["distance_m"] or 0
    bucket["duration_seconds"] += a["duration_seconds"] or 0
    bucket["elevation_gain_m"] += a["elevation_gain_m"] or 0
    bucket["activity_count"] += 1
    bucket["calories"] += a["calories"] or 0


def _week_start(d: date) -> date:
    return d - timedelta(days=d.weekday())  # Monday-start


def compute_weekly_stats(user, activities: list[dict]) -> dict[str, dict]:
    today = timezone.localdate()
    current_week_start = _week_start(today)
    week_starts = [current_week_start - timedelta(weeks=i) for i in range(11, -1, -1)]
    buckets = {ws: _empty_bucket() for ws in week_starts}

    for a in activities:
        ws = _week_start(a["start_time_local"].date())
        if ws in buckets:
            _add_to_bucket(buckets[ws], a)

    periods = [{"period": ws.isoformat(), **buckets[ws]} for ws in week_starts]
    return {"current": {"periods": periods}}


def _month_start(d: date) -> date:
    return d.replace(day=1)


def _add_months(d: date, n: int) -> date:
    month_index = d.month - 1 + n
    year = d.year + month_index // 12
    month = month_index % 12 + 1
    return date(year, month, 1)


def compute_monthly_stats(user, activities: list[dict]) -> dict[str, dict]:
    today = timezone.localdate()
    current_month_start = _month_start(today)
    month_starts = [_add_months(current_month_start, -i) for i in range(11, -1, -1)]
    buckets = {ms: _empty_bucket() for ms in month_starts}

    for a in activities:
        ms = _month_start(a["start_time_local"].date())
        if ms in buckets:
            _add_to_bucket(buckets[ms], a)

    periods = [
        {"period": f"{ms.year}-{ms.month:02d}", **buckets[ms]} for ms in month_starts
    ]
    return {"current": {"periods": periods}}


def _activity_summary(a: dict) -> dict:
    return {
        "id": a["id"],
        "name": a["name"],
        "activity_type": a["activity_type"],
        "start_time_local": a["start_time_local"].isoformat(),
        "distance_m": a["distance_m"],
        "duration_seconds": a["duration_seconds"],
        "elevation_gain_m": a["elevation_gain_m"],
    }


def compute_yearly_stats(user, activities: list[dict]) -> dict[str, dict]:
    by_year: dict[int, list[dict]] = defaultdict(list)
    for a in activities:
        by_year[a["start_time_local"].year].append(a)

    result = {}
    for year, acts in by_year.items():

        def _highlight(key):
            candidates = [a for a in acts if a.get(key)]
            if not candidates:
                return None
            return _activity_summary(max(candidates, key=lambda a: a[key]))

        result[str(year)] = {
            "year": year,
            "distance_m": sum(a["distance_m"] or 0 for a in acts),
            "duration_seconds": sum(a["duration_seconds"] or 0 for a in acts),
            "elevation_gain_m": sum(a["elevation_gain_m"] or 0 for a in acts),
            "activity_count": len(acts),
            "calories": sum(a["calories"] or 0 for a in acts),
            "active_days": len({a["start_time_local"].date() for a in acts}),
            "highlights": {
                "longest_duration_activity": _highlight("duration_seconds"),
                "most_elevation_gain_activity": _highlight("elevation_gain_m"),
                "longest_distance_activity": _highlight("distance_m"),
            },
        }
    return result


def compute_activity_heatmap(user, activities: list[dict]) -> dict[str, dict]:
    today = timezone.localdate()
    start = today - timedelta(days=364)
    by_date: dict[date, dict] = defaultdict(lambda: {"count": 0, "duration_seconds": 0.0})

    for a in activities:
        d = a["start_time_local"].date()
        if start <= d <= today:
            entry = by_date[d]
            entry["count"] += 1
            entry["duration_seconds"] += a["duration_seconds"] or 0

    days = []
    d = start
    while d <= today:
        entry = by_date.get(d)
        days.append({
            "date": d.isoformat(),
            "count": entry["count"] if entry else 0,
            "duration_minutes": round((entry["duration_seconds"] if entry else 0) / 60),
        })
        d += timedelta(days=1)

    return {"last_365": {"start_date": start.isoformat(), "end_date": today.isoformat(), "days": days}}


def compute_training_load(user, activities: list[dict]) -> dict[str, dict]:
    daily_hours: dict[date, float] = defaultdict(float)
    for a in activities:
        d = a["start_time_local"].date()
        daily_hours[d] += (a["duration_seconds"] or 0) / 3600

    def _sum_window(end_date: date, days: int) -> float:
        return sum(daily_hours.get(end_date - timedelta(days=i), 0.0) for i in range(days))

    today = timezone.localdate()
    points = []
    for i in range(89, -1, -1):
        d = today - timedelta(days=i)
        acute = _sum_window(d, 7)
        chronic = _sum_window(d, 28) / 4
        acwr = round(acute / chronic, 2) if chronic > 0 else None
        points.append({
            "date": d.isoformat(),
            "acute_hours": round(acute, 2),
            "chronic_hours": round(chronic, 2),
            "acwr": acwr,
        })

    latest_acwr = points[-1]["acwr"]
    if latest_acwr is None:
        status = "low_data"
    elif latest_acwr < 0.8:
        status = "detraining"
    elif latest_acwr <= 1.3:
        status = "optimal"
    elif latest_acwr <= 1.5:
        status = "caution"
    else:
        status = "high_risk"

    return {"current": {"points": points, "latest_acwr": latest_acwr, "status": status}}
