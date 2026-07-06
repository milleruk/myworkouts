from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import ComputedStat, DashboardLayout
from .serializers import DashboardLayoutSerializer
from .tasks import STAT_BUILDERS, build_stats_for_user
from .widgets import DEFAULT_LAYOUT, backfill_layout


class DashboardLayoutView(APIView):
    def get(self, request):
        layout, _ = DashboardLayout.objects.get_or_create(
            user=request.user, defaults={"widgets": DEFAULT_LAYOUT}
        )
        backfilled = backfill_layout(layout.widgets)
        if backfilled != layout.widgets:
            layout.widgets = backfilled
            layout.save(update_fields=["widgets", "updated_at"])
        return Response({"widgets": layout.widgets})

    def put(self, request):
        serializer = DashboardLayoutSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        layout, _ = DashboardLayout.objects.get_or_create(user=request.user)
        layout.widgets = serializer.validated_data["widgets"]
        layout.save(update_fields=["widgets", "updated_at"])
        return Response({"widgets": layout.widgets})


class DashboardSummaryView(APIView):
    def get(self, request):
        stats_param = request.query_params.get("stats")
        keys = (
            [k.strip() for k in stats_param.split(",") if k.strip()]
            if stats_param
            else list(STAT_BUILDERS)
        )

        rows = ComputedStat.objects.filter(user=request.user, stat_key__in=keys)

        summary: dict = {}
        computed_at: dict = {}
        for row in rows:
            summary.setdefault(row.stat_key, {})[row.scope] = row.value
            existing = computed_at.get(row.stat_key)
            if existing is None or row.computed_at > existing:
                computed_at[row.stat_key] = row.computed_at

        summary["_meta"] = {
            "computed_at": {k: v.isoformat() for k, v in computed_at.items()}
        }
        return Response(summary)


class RecomputeStatsView(APIView):
    def post(self, request):
        build_stats_for_user.delay(request.user.id)
        return Response({"message": "Recomputing stats."}, status=status.HTTP_202_ACCEPTED)
