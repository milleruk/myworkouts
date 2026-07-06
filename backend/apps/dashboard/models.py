from django.conf import settings
from django.db import models

from apps.core.models import UserOwnedModel


class DashboardLayout(models.Model):
    user = models.OneToOneField(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="dashboard_layout"
    )
    widgets = models.JSONField(default=list)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"DashboardLayout<{self.user_id}>"


class ComputedStat(UserOwnedModel):
    stat_key = models.CharField(max_length=64)
    scope = models.CharField(max_length=64)
    value = models.JSONField()
    computed_at = models.DateTimeField()

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=["user", "stat_key", "scope"], name="uniq_user_stat_scope"
            )
        ]
        indexes = [models.Index(fields=["user", "stat_key"])]

    def __str__(self):
        return f"ComputedStat<{self.stat_key}:{self.scope}>"
