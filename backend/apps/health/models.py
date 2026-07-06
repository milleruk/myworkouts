from django.db import models

from apps.core.models import UserOwnedModel


class DailyStats(UserOwnedModel):
    date = models.DateField()
    total_steps = models.PositiveIntegerField(null=True, blank=True)
    resting_hr = models.PositiveSmallIntegerField(null=True, blank=True)
    total_calories = models.PositiveIntegerField(null=True, blank=True)
    active_calories = models.PositiveIntegerField(null=True, blank=True)
    sleep_seconds = models.PositiveIntegerField(null=True, blank=True)
    stress_avg = models.PositiveSmallIntegerField(null=True, blank=True)
    body_battery_high = models.PositiveSmallIntegerField(null=True, blank=True)
    body_battery_low = models.PositiveSmallIntegerField(null=True, blank=True)
    hrv_status = models.CharField(max_length=32, blank=True)
    hrv_last_night_avg = models.FloatField(null=True, blank=True)
    training_readiness_score = models.PositiveSmallIntegerField(null=True, blank=True)
    vo2max_running = models.FloatField(null=True, blank=True)
    vo2max_cycling = models.FloatField(null=True, blank=True)
    raw = models.JSONField()

    class Meta:
        constraints = [
            models.UniqueConstraint(fields=["user", "date"], name="uniq_user_date_stats")
        ]
        ordering = ["-date"]

    def __str__(self):
        return f"DailyStats<{self.date}>"


class BodyComposition(UserOwnedModel):
    recorded_at = models.DateTimeField()
    weight_kg = models.FloatField()
    body_fat_pct = models.FloatField(null=True, blank=True)
    muscle_mass_kg = models.FloatField(null=True, blank=True)
    bone_mass_kg = models.FloatField(null=True, blank=True)
    bmi = models.FloatField(null=True, blank=True)
    raw = models.JSONField()

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=["user", "recorded_at"], name="uniq_user_weighin"
            )
        ]
        ordering = ["-recorded_at"]

    def __str__(self):
        return f"BodyComposition<{self.recorded_at}>"
