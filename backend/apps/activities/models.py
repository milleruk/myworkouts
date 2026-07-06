from django.db import models

from apps.core.models import UserOwnedModel


class Activity(UserOwnedModel):
    garmin_activity_id = models.BigIntegerField()
    activity_type = models.CharField(max_length=64)
    name = models.CharField(max_length=255, blank=True)
    start_time_local = models.DateTimeField()
    start_time_gmt = models.DateTimeField(null=True, blank=True)
    duration_seconds = models.FloatField(null=True, blank=True)
    distance_m = models.FloatField(null=True, blank=True)
    elevation_gain_m = models.FloatField(null=True, blank=True)
    average_hr = models.PositiveSmallIntegerField(null=True, blank=True)
    max_hr = models.PositiveSmallIntegerField(null=True, blank=True)
    calories = models.PositiveIntegerField(null=True, blank=True)
    raw_summary = models.JSONField()

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=["user", "garmin_activity_id"], name="uniq_user_activity"
            )
        ]
        indexes = [models.Index(fields=["user", "start_time_local"])]
        ordering = ["-start_time_local"]

    def __str__(self):
        return f"{self.activity_type} @ {self.start_time_local}"
