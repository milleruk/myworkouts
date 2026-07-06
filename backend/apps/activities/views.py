from rest_framework import generics

from apps.core.mixins import OwnedQuerySetMixin

from .models import Activity
from .serializers import ActivitySerializer


class ActivityListView(OwnedQuerySetMixin, generics.ListAPIView):
    serializer_class = ActivitySerializer
    queryset = Activity.objects.all()
