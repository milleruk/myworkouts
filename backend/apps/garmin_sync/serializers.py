from rest_framework import serializers

from .models import GarminAccount, SyncLog


class GarminAccountSerializer(serializers.ModelSerializer):
    class Meta:
        model = GarminAccount
        fields = [
            "garmin_email",
            "display_name",
            "status",
            "last_synced_at",
            "last_error",
            "created_at",
        ]


class ConnectSerializer(serializers.Serializer):
    garmin_email = serializers.EmailField()
    garmin_password = serializers.CharField(write_only=True)


class VerifyMfaSerializer(serializers.Serializer):
    pending_login_id = serializers.CharField()
    mfa_code = serializers.CharField()


class SyncLogSerializer(serializers.ModelSerializer):
    class Meta:
        model = SyncLog
        fields = [
            "id",
            "task_type",
            "started_at",
            "finished_at",
            "status",
            "records_imported",
            "error_message",
        ]
