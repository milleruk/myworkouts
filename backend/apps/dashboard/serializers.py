from rest_framework import serializers

from .widgets import WIDGET_KEYS, WIDTH_CHOICES


class WidgetConfigSerializer(serializers.Serializer):
    id = serializers.CharField()
    widget = serializers.ChoiceField(choices=WIDGET_KEYS)
    width = serializers.ChoiceField(choices=WIDTH_CHOICES)
    enabled = serializers.BooleanField()
    config = serializers.DictField(required=False, default=dict)


class DashboardLayoutSerializer(serializers.Serializer):
    widgets = WidgetConfigSerializer(many=True)
