from django.contrib import admin

from .models import GarminAccount, SyncLog


@admin.register(GarminAccount)
class GarminAccountAdmin(admin.ModelAdmin):
    list_display = ["garmin_email", "user", "status", "last_synced_at"]
    readonly_fields = ["encrypted_password", "encrypted_tokens"]


@admin.register(SyncLog)
class SyncLogAdmin(admin.ModelAdmin):
    list_display = ["garmin_account", "task_type", "status", "started_at", "records_imported"]
    list_filter = ["task_type", "status"]
