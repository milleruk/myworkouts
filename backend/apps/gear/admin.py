from django.contrib import admin

from .models import Gear, GearMaintenanceEntry


@admin.register(Gear)
class GearAdmin(admin.ModelAdmin):
    list_display = ["user", "name", "gear_type", "is_retired", "total_distance_m"]


@admin.register(GearMaintenanceEntry)
class GearMaintenanceEntryAdmin(admin.ModelAdmin):
    list_display = ["gear", "description", "performed_at"]
