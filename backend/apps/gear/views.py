from django.shortcuts import get_object_or_404
from rest_framework import generics
from rest_framework.pagination import PageNumberPagination

from apps.core.mixins import OwnedQuerySetMixin

from .models import Gear, GearMaintenanceEntry
from .serializers import GearMaintenanceEntrySerializer, GearSerializer


class _GearPagination(PageNumberPagination):
    page_size = 100


class GearListView(OwnedQuerySetMixin, generics.ListAPIView):
    serializer_class = GearSerializer
    queryset = Gear.objects.all().order_by("is_retired", "-total_distance_m")
    pagination_class = _GearPagination


class GearDetailView(OwnedQuerySetMixin, generics.RetrieveAPIView):
    serializer_class = GearSerializer
    queryset = Gear.objects.all()


class GearMaintenanceListCreateView(generics.ListCreateAPIView):
    serializer_class = GearMaintenanceEntrySerializer

    def get_queryset(self):
        return GearMaintenanceEntry.objects.filter(
            gear_id=self.kwargs["gear_id"], gear__user=self.request.user
        ).order_by("-performed_at")

    def perform_create(self, serializer):
        gear = get_object_or_404(Gear, id=self.kwargs["gear_id"], user=self.request.user)
        serializer.save(gear=gear)
