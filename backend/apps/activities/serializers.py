from rest_framework import serializers

from .models import Activity


class ActivitySerializer(serializers.ModelSerializer):
    class Meta:
        model = Activity
        fields = [
            "id",
            "garmin_activity_id",
            "activity_type",
            "name",
            "start_time_local",
            "duration_seconds",
            "distance_m",
            "elevation_gain_m",
            "average_hr",
            "max_hr",
            "calories",
        ]


class ActivityDetailSerializer(ActivitySerializer):
    class Meta(ActivitySerializer.Meta):
        fields = ActivitySerializer.Meta.fields + ["raw_summary"]
