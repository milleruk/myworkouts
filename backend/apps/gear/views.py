from rest_framework import generics
from rest_framework.pagination import PageNumberPagination

from apps.core.mixins import OwnedQuerySetMixin

from .models import Gear
from .serializers import GearSerializer


class _GearPagination(PageNumberPagination):
    page_size = 100


class GearListView(OwnedQuerySetMixin, generics.ListAPIView):
    serializer_class = GearSerializer
    queryset = Gear.objects.all().order_by("is_retired", "-total_distance_m")
    pagination_class = _GearPagination
