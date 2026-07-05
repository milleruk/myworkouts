from django.contrib.auth.models import AbstractUser
from django.db import models

from .managers import UserManager


class User(AbstractUser):
    username = None
    email = models.EmailField(unique=True)

    USERNAME_FIELD = "email"
    REQUIRED_FIELDS = []

    objects = UserManager()

    def __str__(self):
        return self.email


class UserProfile(models.Model):
    class UnitSystem(models.TextChoices):
        METRIC = "metric", "Metric"
        IMPERIAL = "imperial", "Imperial"

    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name="profile")
    timezone = models.CharField(max_length=64, default="UTC")
    unit_system = models.CharField(
        max_length=16, choices=UnitSystem.choices, default=UnitSystem.METRIC
    )
    date_of_birth = models.DateField(null=True, blank=True)
    sex = models.CharField(
        max_length=1, choices=[("M", "M"), ("F", "F")], null=True, blank=True
    )

    def __str__(self):
        return f"Profile<{self.user.email}>"
