from rest_framework import generics

from apps.core.mixins import OwnedQuerySetMixin

from .models import Activity
from .serializers import ActivityDetailSerializer, ActivitySerializer


class ActivityListView(OwnedQuerySetMixin, generics.ListAPIView):
    serializer_class = ActivitySerializer
    queryset = Activity.objects.all()


class ActivityDetailView(OwnedQuerySetMixin, generics.RetrieveAPIView):
    serializer_class = ActivityDetailSerializer
    queryset = Activity.objects.all()
