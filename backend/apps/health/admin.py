from django.contrib import admin

from .models import BodyComposition, DailyStats


@admin.register(DailyStats)
class DailyStatsAdmin(admin.ModelAdmin):
    list_display = ["user", "date", "total_steps", "resting_hr", "sleep_seconds"]


@admin.register(BodyComposition)
class BodyCompositionAdmin(admin.ModelAdmin):
    list_display = ["user", "recorded_at", "weight_kg"]
