from django.urls import path

from .views import GearDetailView, GearListView, GearMaintenanceListCreateView

urlpatterns = [
    path("gear/", GearListView.as_view(), name="gear-list"),
    path("gear/<int:pk>/", GearDetailView.as_view(), name="gear-detail"),
    path(
        "gear/<int:gear_id>/maintenance/",
        GearMaintenanceListCreateView.as_view(),
        name="gear-maintenance",
    ),
]
