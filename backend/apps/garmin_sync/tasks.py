import logging
from datetime import datetime, timezone as dt_timezone

from celery import shared_task
from django.utils import timezone
from garminconnect import (
    Garmin,
    GarminConnectAuthenticationError,
    GarminConnectConnectionError,
    GarminConnectTooManyRequestsError,
)

from apps.activities.models import Activity

from . import crypto
from .models import GarminAccount, SyncLog
from .services import pending_logins

logger = logging.getLogger(__name__)

# Safety cap on a Phase 2 manual full backfill; incremental, unbounded sync
# lands in Phase 3.
MAX_BACKFILL_ACTIVITIES = 2000
ACTIVITIES_PAGE_SIZE = 100


@shared_task
def start_garmin_login(user_id: int, garmin_email: str, garmin_password: str) -> dict:
    account, _ = GarminAccount.objects.update_or_create(
        user_id=user_id,
        defaults={
            "garmin_email": garmin_email,
            "encrypted_password": crypto.encrypt(garmin_password),
            "status": GarminAccount.Status.NEEDS_MFA,
            "last_error": "",
        },
    )

    client = Garmin(garmin_email, garmin_password, return_on_mfa=True)
    try:
        mfa_status, _ = client.login()
    except GarminConnectAuthenticationError:
        account.status = GarminAccount.Status.ERROR
        account.last_error = "Invalid Garmin email or password."
        account.save(update_fields=["status", "last_error", "updated_at"])
        return {"status": "error", "message": account.last_error}
    except GarminConnectTooManyRequestsError:
        account.status = GarminAccount.Status.ERROR
        account.last_error = "Garmin rate-limited this login attempt. Try again shortly."
        account.save(update_fields=["status", "last_error", "updated_at"])
        return {"status": "error", "message": account.last_error}
    except GarminConnectConnectionError as exc:
        account.status = GarminAccount.Status.ERROR
        account.last_error = f"Could not reach Garmin: {exc}"
        account.save(update_fields=["status", "last_error", "updated_at"])
        return {"status": "error", "message": account.last_error}

    if mfa_status == "needs_mfa":
        pending_login_id = pending_logins.store(client, user_id)
        account.status = GarminAccount.Status.NEEDS_MFA
        account.save(update_fields=["status", "updated_at"])
        return {"status": "mfa_required", "pending_login_id": pending_login_id}

    _persist_connected(account, client)
    return {"status": "connected"}


@shared_task
def complete_garmin_login(user_id: int, pending_login_id: str, mfa_code: str) -> dict:
    entry = pending_logins.pop(pending_login_id)
    if entry is None or entry.user_id != user_id:
        return {
            "status": "error",
            "message": "That login attempt has expired. Please reconnect.",
        }

    try:
        account = GarminAccount.objects.get(user_id=user_id)
    except GarminAccount.DoesNotExist:
        return {"status": "error", "message": "No pending Garmin connection found."}

    try:
        entry.client.resume_login(None, mfa_code)
    except GarminConnectAuthenticationError:
        account.status = GarminAccount.Status.ERROR
        account.last_error = "Incorrect MFA code."
        account.save(update_fields=["status", "last_error", "updated_at"])
        return {"status": "error", "message": account.last_error}

    _persist_connected(account, entry.client)
    return {"status": "connected"}


@shared_task
def purge_stale_pending_logins() -> int:
    return pending_logins.purge_stale()


def _persist_connected(account: GarminAccount, client: Garmin) -> None:
    account.encrypted_tokens = crypto.encrypt(client.client.dumps())
    account.status = GarminAccount.Status.CONNECTED
    account.last_error = ""
    try:
        profile = client.get_full_name()
        if profile:
            account.display_name = profile
    except Exception:  # noqa: BLE001 - cosmetic field, never block on it
        logger.exception("Failed to fetch Garmin display name")
    account.save()


def _client_for_account(account: GarminAccount) -> Garmin:
    """Build an authenticated client from stored tokens, falling back to a
    full credential re-login (which may itself require MFA -- if so, this
    raises and the caller marks the account needs_reauth, since a scheduled
    background task has no interactive channel to collect an MFA code)."""
    client = Garmin(return_on_mfa=True)
    tokens = crypto.decrypt(bytes(account.encrypted_tokens))
    try:
        client.login(tokenstore=tokens)
        return client
    except Exception:  # noqa: BLE001 - any failure loading stored tokens falls back to full login
        password = crypto.decrypt(bytes(account.encrypted_password))
        client = Garmin(account.garmin_email, password, return_on_mfa=True)
        mfa_status, _ = client.login()
        if mfa_status == "needs_mfa":
            raise GarminConnectAuthenticationError(
                "Reauthentication requires an MFA code"
            )
        _persist_connected(account, client)
        return client


@shared_task(bind=True, max_retries=3, default_retry_delay=300)
def sync_garmin_account(self, account_id: int):
    account = GarminAccount.objects.get(id=account_id)
    sync_log = SyncLog.objects.create(
        garmin_account=account, task_type=SyncLog.TaskType.ACTIVITIES
    )

    try:
        client = _client_for_account(account)
    except GarminConnectAuthenticationError:
        account.status = GarminAccount.Status.NEEDS_REAUTH
        account.last_error = "Reauthentication with MFA required."
        account.save(update_fields=["status", "last_error", "updated_at"])
        sync_log.status = SyncLog.Status.FAILED
        sync_log.error_message = account.last_error
        sync_log.finished_at = timezone.now()
        sync_log.save()
        return
    except GarminConnectTooManyRequestsError as exc:
        sync_log.status = SyncLog.Status.FAILED
        sync_log.error_message = str(exc)
        sync_log.finished_at = timezone.now()
        sync_log.save()
        raise self.retry(exc=exc)

    imported = 0
    try:
        start = 0
        while start < MAX_BACKFILL_ACTIVITIES:
            page = client.get_activities(start, ACTIVITIES_PAGE_SIZE)
            if not page:
                break
            for item in page:
                _upsert_activity(account, item)
                imported += 1
            start += ACTIVITIES_PAGE_SIZE

        account.status = GarminAccount.Status.CONNECTED
        account.last_synced_at = timezone.now()
        account.last_error = ""
        account.save(update_fields=["status", "last_synced_at", "last_error", "updated_at"])

        sync_log.status = SyncLog.Status.SUCCESS
        sync_log.records_imported = imported
        sync_log.finished_at = timezone.now()
        sync_log.save()
    except GarminConnectTooManyRequestsError as exc:
        sync_log.status = SyncLog.Status.PARTIAL
        sync_log.records_imported = imported
        sync_log.error_message = str(exc)
        sync_log.finished_at = timezone.now()
        sync_log.save()
        raise self.retry(exc=exc)
    except Exception as exc:  # noqa: BLE001
        logger.exception("Garmin activity sync failed for account %s", account.id)
        sync_log.status = SyncLog.Status.FAILED
        sync_log.records_imported = imported
        sync_log.error_message = str(exc)
        sync_log.finished_at = timezone.now()
        sync_log.save()


def _upsert_activity(account: GarminAccount, item: dict) -> None:
    activity_type = (item.get("activityType") or {}).get("typeKey", "unknown")
    start_local = _parse_garmin_datetime(item.get("startTimeLocal"))
    start_gmt = _parse_garmin_datetime(item.get("startTimeGMT"))
    Activity.objects.update_or_create(
        user_id=account.user_id,
        garmin_activity_id=item["activityId"],
        defaults={
            "activity_type": activity_type,
            "name": item.get("activityName", ""),
            "start_time_local": start_local,
            "start_time_gmt": start_gmt,
            "duration_seconds": item.get("duration"),
            "distance_m": item.get("distance"),
            "elevation_gain_m": item.get("elevationGain"),
            "average_hr": item.get("averageHR"),
            "max_hr": item.get("maxHR"),
            "calories": item.get("calories"),
            "raw_summary": item,
        },
    )


def _parse_garmin_datetime(value: str | None):
    if not value:
        return None
    # Garmin returns "YYYY-MM-DD HH:MM:SS" (space-separated, no offset).
    dt = datetime.strptime(value.replace("T", " ").split(".")[0], "%Y-%m-%d %H:%M:%S")
    return dt.replace(tzinfo=dt_timezone.utc)
