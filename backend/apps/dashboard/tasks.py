import logging

from celery import shared_task
from django.contrib.auth import get_user_model
from django.utils import timezone

from apps.activities.models import Activity

from . import stats
from .models import ComputedStat

logger = logging.getLogger(__name__)

STAT_BUILDERS = {
    "eddington_number": stats.compute_eddington_number,
    "streaks": stats.compute_streaks,
    "weekly_stats": stats.compute_weekly_stats,
    "monthly_stats": stats.compute_monthly_stats,
    "yearly_stats": stats.compute_yearly_stats,
    "activity_heatmap": stats.compute_activity_heatmap,
    "training_load": stats.compute_training_load,
}

ACTIVITY_FIELDS = [
    "id", "name", "activity_type", "start_time_local",
    "distance_m", "duration_seconds", "elevation_gain_m", "calories",
]


@shared_task
def build_stats_for_user(user_id: int) -> dict:
    user = get_user_model().objects.get(id=user_id)
    activities = list(Activity.objects.filter(user_id=user_id).values(*ACTIVITY_FIELDS))
    now = timezone.now()

    for stat_key, builder in STAT_BUILDERS.items():
        try:
            scoped_values = builder(user, activities)
        except Exception:  # noqa: BLE001 - one bad stat shouldn't block the others
            logger.exception("Failed computing %s for user %s", stat_key, user_id)
            continue
        for scope, value in scoped_values.items():
            ComputedStat.objects.update_or_create(
                user=user, stat_key=stat_key, scope=scope,
                defaults={"value": value, "computed_at": now},
            )

    return {"user_id": user_id, "computed_at": now.isoformat()}
