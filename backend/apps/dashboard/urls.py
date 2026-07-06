from django.urls import path

from .views import DashboardLayoutView, DashboardSummaryView, RecomputeStatsView

urlpatterns = [
    path("dashboard/layout/", DashboardLayoutView.as_view(), name="dashboard-layout"),
    path("dashboard/summary/", DashboardSummaryView.as_view(), name="dashboard-summary"),
    path("dashboard/recompute/", RecomputeStatsView.as_view(), name="dashboard-recompute"),
]
