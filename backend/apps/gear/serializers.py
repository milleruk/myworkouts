from rest_framework import serializers

from .models import Gear


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
