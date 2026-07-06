from django.contrib import admin
from django.urls import include, path

urlpatterns = [
    path("admin/", admin.site.urls),
    path("api/v1/", include("apps.accounts.urls")),
    path("api/v1/", include("apps.garmin_sync.urls")),
    path("api/v1/", include("apps.activities.urls")),
]
