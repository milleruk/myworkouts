from celery.exceptions import TimeoutError as CeleryTimeoutError
from rest_framework import generics, status
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import GarminAccount, SyncLog
from .serializers import (
    ConnectSerializer,
    GarminAccountSerializer,
    SyncLogSerializer,
    VerifyMfaSerializer,
)
from .tasks import complete_garmin_login, start_garmin_login, sync_garmin_account

CONNECT_TIMEOUT_SECONDS = 25


class GarminAccountView(APIView):
    def get(self, request):
        try:
            account = request.user.garmin_account
        except GarminAccount.DoesNotExist:
            return Response({"status": "not_connected"})
        return Response(GarminAccountSerializer(account).data)

    def delete(self, request):
        GarminAccount.objects.filter(user=request.user).delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class ConnectView(APIView):
    def post(self, request):
        serializer = ConnectSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        result = start_garmin_login.delay(
            request.user.id,
            serializer.validated_data["garmin_email"],
            serializer.validated_data["garmin_password"],
        )
        try:
            data = result.get(timeout=CONNECT_TIMEOUT_SECONDS)
        except CeleryTimeoutError:
            return Response(
                {"status": "error", "message": "Timed out talking to Garmin. Please try again."},
                status=status.HTTP_504_GATEWAY_TIMEOUT,
            )
        return Response(data)


class VerifyMfaView(APIView):
    def post(self, request):
        serializer = VerifyMfaSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        result = complete_garmin_login.delay(
            request.user.id,
            serializer.validated_data["pending_login_id"],
            serializer.validated_data["mfa_code"],
        )
        try:
            data = result.get(timeout=CONNECT_TIMEOUT_SECONDS)
        except CeleryTimeoutError:
            return Response(
                {"status": "error", "message": "Timed out talking to Garmin. Please try again."},
                status=status.HTTP_504_GATEWAY_TIMEOUT,
            )
        return Response(data)


class SyncNowView(APIView):
    def post(self, request):
        try:
            account = request.user.garmin_account
        except GarminAccount.DoesNotExist:
            return Response(
                {"message": "Connect your Garmin account first."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        if account.status not in (GarminAccount.Status.CONNECTED,):
            return Response(
                {"message": f"Account status is '{account.status}', cannot sync."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        sync_garmin_account.delay(account.id)
        return Response({"message": "Sync started."}, status=status.HTTP_202_ACCEPTED)


class SyncLogListView(generics.ListAPIView):
    serializer_class = SyncLogSerializer

    def get_queryset(self):
        return SyncLog.objects.filter(garmin_account__user=self.request.user)
