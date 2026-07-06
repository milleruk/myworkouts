from rest_framework import serializers

from .models import Gear, GearMaintenanceEntry


class GearSerializer(serializers.ModelSerializer):
    class Meta:
        model = Gear
        fields = [
            "id",
            "name",
            "gear_type",
            "is_retired",
            "total_distance_m",
            "total_duration_seconds",
        ]


class GearMaintenanceEntrySerializer(serializers.ModelSerializer):
    class Meta:
        model = GearMaintenanceEntry
        fields = ["id", "description", "performed_at", "distance_at_service_m", "notes"]
