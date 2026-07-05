from django.conf import settings
from django.db import models


class UserOwnedModel(models.Model):
    """Abstract base for every per-user table, so multi-tenant scoping is consistent."""

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="+"
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        abstract = True
