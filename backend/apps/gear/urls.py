from django.urls import path

from .views import GearListView

urlpatterns = [
    path("gear/", GearListView.as_view(), name="gear-list"),
]
