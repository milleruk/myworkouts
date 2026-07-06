from django.urls import path

from .views import ConnectView, GarminAccountView, SyncLogListView, SyncNowView, VerifyMfaView

urlpatterns = [
    path("garmin-account/", GarminAccountView.as_view(), name="garmin-account"),
    path("garmin-account/connect/", ConnectView.as_view(), name="garmin-account-connect"),
    path("garmin-account/verify-mfa/", VerifyMfaView.as_view(), name="garmin-account-verify-mfa"),
    path("garmin-account/sync/", SyncNowView.as_view(), name="garmin-account-sync"),
    path("garmin-account/sync-logs/", SyncLogListView.as_view(), name="garmin-account-sync-logs"),
]
