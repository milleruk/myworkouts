from django.contrib import admin

from .models import Activity


@admin.register(Activity)
class ActivityAdmin(admin.ModelAdmin):
    list_display = ["user", "activity_type", "name", "start_time_local", "distance_m"]
    list_filter = ["activity_type"]
