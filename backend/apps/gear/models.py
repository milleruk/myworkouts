from django.db import models

from apps.core.models import UserOwnedModel


class Gear(UserOwnedModel):
    garmin_gear_uuid = models.CharField(max_length=64, blank=True)
    name = models.CharField(max_length=255)
    gear_type = models.CharField(max_length=64, blank=True)
    is_retired = models.BooleanField(default=False)
    total_distance_m = models.FloatField(default=0)
    total_duration_seconds = models.FloatField(default=0)
    raw = models.JSONField(null=True, blank=True)

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=["user", "garmin_gear_uuid"], name="uniq_user_gear_uuid"
            )
        ]

    def __str__(self):
        return self.name


class GearMaintenanceEntry(models.Model):
    gear = models.ForeignKey(Gear, on_delete=models.CASCADE, related_name="maintenance_entries")
    description = models.CharField(max_length=255)
    performed_at = models.DateField()
    distance_at_service_m = models.FloatField(null=True, blank=True)
    notes = models.TextField(blank=True)

    def __str__(self):
        return f"{self.gear.name}: {self.description}"
