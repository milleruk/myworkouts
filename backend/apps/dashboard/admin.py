from django.contrib import admin

from .models import ComputedStat, DashboardLayout


@admin.register(DashboardLayout)
class DashboardLayoutAdmin(admin.ModelAdmin):
    list_display = ["user", "updated_at"]


@admin.register(ComputedStat)
class ComputedStatAdmin(admin.ModelAdmin):
    list_display = ["user", "stat_key", "scope", "computed_at"]
    list_filter = ["stat_key"]
