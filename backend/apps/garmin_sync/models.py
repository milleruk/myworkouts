from django.conf import settings
from django.db import models


class GarminAccount(models.Model):
    class Status(models.TextChoices):
        CONNECTED = "connected", "Connected"
        NEEDS_MFA = "needs_mfa", "Awaiting MFA code"
        NEEDS_REAUTH = "needs_reauth", "Needs reconnect"
        ERROR = "error", "Error"

    user = models.OneToOneField(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="garmin_account"
    )
    garmin_email = models.EmailField()
    encrypted_password = models.BinaryField()
    encrypted_tokens = models.BinaryField(null=True, blank=True)
    display_name = models.CharField(max_length=255, blank=True)
    is_cn = models.BooleanField(default=False)
    status = models.CharField(
        max_length=20, choices=Status.choices, default=Status.NEEDS_MFA
    )
    last_synced_at = models.DateTimeField(null=True, blank=True)
    last_error = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"GarminAccount<{self.garmin_email}> ({self.status})"


class SyncLog(models.Model):
    class TaskType(models.TextChoices):
        ACTIVITIES = "activities", "Activities"
        DAILY_HEALTH = "daily_health", "Daily health"
        BODY_COMPOSITION = "body_composition", "Body composition"
        GEAR = "gear", "Gear"
        FULL_BACKFILL = "full_backfill", "Full backfill"

    class Status(models.TextChoices):
        RUNNING = "running", "Running"
        SUCCESS = "success", "Success"
        PARTIAL = "partial", "Partial"
        FAILED = "failed", "Failed"

    garmin_account = models.ForeignKey(
        GarminAccount, on_delete=models.CASCADE, related_name="sync_logs"
    )
    task_type = models.CharField(max_length=30, choices=TaskType.choices)
    started_at = models.DateTimeField(auto_now_add=True)
    finished_at = models.DateTimeField(null=True, blank=True)
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.RUNNING)
    records_imported = models.PositiveIntegerField(default=0)
    error_message = models.TextField(blank=True)

    class Meta:
        ordering = ["-started_at"]

    def __str__(self):
        return f"SyncLog<{self.task_type}:{self.status}>"
