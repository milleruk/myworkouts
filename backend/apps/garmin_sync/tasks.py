import logging
from datetime import date, datetime, timedelta
from datetime import timezone as dt_timezone

from celery import shared_task
from django.utils import timezone
from garminconnect import (
    Garmin,
    GarminConnectAuthenticationError,
    GarminConnectConnectionError,
    GarminConnectTooManyRequestsError,
)

from apps.activities.models import Activity
from apps.gear.models import Gear
from apps.health.models import BodyComposition, DailyStats

from . import crypto
from .models import GarminAccount, SyncLog
from .services import pending_logins

logger = logging.getLogger(__name__)

# Safety cap on a first-ever full backfill. Later syncs are incremental and
# don't need this, since they only fetch what's new since the last sync.
MAX_BACKFILL_ACTIVITIES = 2000
ACTIVITIES_PAGE_SIZE = 100

# How far back to backfill health/body-composition data the first time an
# account connects. Chosen to give meaningful recent trends without a slow
# first sync or years of old data.
HEALTH_BACKFILL_DAYS = 90

ACTIVITY_SYNC_OVERLAP_DAYS = 2


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

    try:
        client = _client_for_account(account)
    except GarminConnectAuthenticationError:
        account.status = GarminAccount.Status.NEEDS_REAUTH
        account.last_error = "Reauthentication with MFA required."
        account.save(update_fields=["status", "last_error", "updated_at"])
        SyncLog.objects.create(
            garmin_account=account,
            task_type=SyncLog.TaskType.ACTIVITIES,
            status=SyncLog.Status.FAILED,
            error_message=account.last_error,
            finished_at=timezone.now(),
        )
        return
    except GarminConnectTooManyRequestsError as exc:
        SyncLog.objects.create(
            garmin_account=account,
            task_type=SyncLog.TaskType.ACTIVITIES,
            status=SyncLog.Status.FAILED,
            error_message=str(exc),
            finished_at=timezone.now(),
        )
        raise self.retry(exc=exc)

    any_failed = False
    for task_type, import_fn in (
        (SyncLog.TaskType.ACTIVITIES, _import_activities),
        (SyncLog.TaskType.DAILY_HEALTH, _import_daily_health),
        (SyncLog.TaskType.BODY_COMPOSITION, _import_body_composition),
        (SyncLog.TaskType.GEAR, _import_gear),
    ):
        sync_log = SyncLog.objects.create(garmin_account=account, task_type=task_type)
        try:
            imported = import_fn(client, account)
            sync_log.status = SyncLog.Status.SUCCESS
            sync_log.records_imported = imported
        except GarminConnectTooManyRequestsError as exc:
            any_failed = True
            sync_log.status = SyncLog.Status.FAILED
            sync_log.error_message = str(exc)
            logger.warning("Rate limited during %s import for account %s", task_type, account.id)
        except Exception as exc:  # noqa: BLE001 - one failing import shouldn't stop the others
            any_failed = True
            sync_log.status = SyncLog.Status.FAILED
            sync_log.error_message = str(exc)
            logger.exception("%s import failed for account %s", task_type, account.id)
        sync_log.finished_at = timezone.now()
        sync_log.save()

    account.status = GarminAccount.Status.CONNECTED
    account.last_synced_at = timezone.now()
    account.last_error = "Some data failed to sync; see recent syncs." if any_failed else ""
    account.save(update_fields=["status", "last_synced_at", "last_error", "updated_at"])


def _import_activities(client: Garmin, account: GarminAccount) -> int:
    last_activity = (
        Activity.objects.filter(user_id=account.user_id).order_by("-start_time_local").first()
    )
    imported = 0

    if last_activity is None:
        # First-ever sync: capped full backfill via the paginated list endpoint.
        start = 0
        while start < MAX_BACKFILL_ACTIVITIES:
            page = client.get_activities(start, ACTIVITIES_PAGE_SIZE)
            if not page:
                break
            for item in page:
                _upsert_activity(account, item)
                imported += 1
            start += ACTIVITIES_PAGE_SIZE
        return imported

    # Incremental: only fetch since the last known activity, with a small
    # overlap buffer to absorb activities uploaded late by a device that
    # was offline (e.g. a watch synced days after the activity happened).
    startdate = (last_activity.start_time_local.date() - timedelta(days=ACTIVITY_SYNC_OVERLAP_DAYS)).isoformat()
    enddate = date.today().isoformat()
    items = client.get_activities_by_date(startdate, enddate, sortorder="asc")
    for item in items:
        _upsert_activity(account, item)
        imported += 1
    return imported


def _import_daily_health(client: Garmin, account: GarminAccount) -> int:
    last = DailyStats.objects.filter(user_id=account.user_id).order_by("-date").first()
    start = last.date + timedelta(days=1) if last else date.today() - timedelta(days=HEALTH_BACKFILL_DAYS)
    today = date.today()

    imported = 0
    current = start
    while current <= today:
        cdate = current.isoformat()
        try:
            summary = client.get_user_summary(cdate)
        except Exception:  # noqa: BLE001 - no data for this day is common/expected
            summary = None
        if summary:
            _upsert_daily_stats(account, current, summary, client)
            imported += 1
        current += timedelta(days=1)
    return imported


def _upsert_daily_stats(account: GarminAccount, day: date, summary: dict, client: Garmin) -> None:
    cdate = day.isoformat()

    hrv_status = ""
    hrv_last_night_avg = None
    try:
        hrv = client.get_hrv_data(cdate)
        if hrv and hrv.get("hrvSummary"):
            hrv_status = hrv["hrvSummary"].get("status") or ""
            hrv_last_night_avg = hrv["hrvSummary"].get("lastNightAvg")
    except Exception:  # noqa: BLE001 - HRV isn't available for every day/device
        pass

    training_readiness_score = None
    try:
        readiness = client.get_training_readiness(cdate)
        if readiness:
            training_readiness_score = readiness[0].get("score")
    except Exception:  # noqa: BLE001
        pass

    DailyStats.objects.update_or_create(
        user_id=account.user_id,
        date=day,
        defaults={
            "total_steps": _none_if_negative(summary.get("totalSteps")),
            "resting_hr": _none_if_negative(summary.get("restingHeartRate")),
            "total_calories": _none_if_negative(summary.get("totalKilocalories")),
            "active_calories": _none_if_negative(summary.get("activeKilocalories")),
            "sleep_seconds": _none_if_negative(summary.get("sleepingSeconds")),
            "stress_avg": _none_if_negative(summary.get("averageStressLevel")),
            "body_battery_high": _none_if_negative(summary.get("bodyBatteryHighestValue")),
            "body_battery_low": _none_if_negative(summary.get("bodyBatteryLowestValue")),
            "hrv_status": hrv_status,
            "hrv_last_night_avg": hrv_last_night_avg,
            "training_readiness_score": _none_if_negative(training_readiness_score),
            "raw": summary,
        },
    )


def _import_body_composition(client: Garmin, account: GarminAccount) -> int:
    last = BodyComposition.objects.filter(user_id=account.user_id).order_by("-recorded_at").first()
    startdate = (
        (last.recorded_at.date() + timedelta(days=1))
        if last
        else date.today() - timedelta(days=HEALTH_BACKFILL_DAYS)
    )
    enddate = date.today()
    if startdate > enddate:
        return 0

    data = client.get_body_composition(startdate.isoformat(), enddate.isoformat())
    entries = (data or {}).get("dateWeightList") or []

    imported = 0
    for entry in entries:
        weight_g = entry.get("weight")
        if weight_g is None:
            continue
        timestamp_ms = entry.get("timestampGMT") or entry.get("date")
        recorded_at = _from_epoch_ms(timestamp_ms) if timestamp_ms else None
        if recorded_at is None:
            continue
        BodyComposition.objects.update_or_create(
            user_id=account.user_id,
            recorded_at=recorded_at,
            defaults={
                "weight_kg": weight_g / 1000,
                "body_fat_pct": entry.get("bodyFat"),
                "muscle_mass_kg": (entry.get("muscleMass") or 0) / 1000 or None,
                "bone_mass_kg": (entry.get("boneMass") or 0) / 1000 or None,
                "bmi": entry.get("bmi"),
                "raw": entry,
            },
        )
        imported += 1
    return imported


def _import_gear(client: Garmin, account: GarminAccount) -> int:
    device = client.get_device_last_used()
    profile_number = device.get("userProfileNumber") if device else None
    if not profile_number:
        return 0

    items = client.get_gear(profile_number) or []
    imported = 0
    for item in items:
        uuid = item.get("uuid")
        if not uuid:
            continue
        stats = {}
        try:
            stats = client.get_gear_stats(uuid) or {}
        except Exception:  # noqa: BLE001 - stats can 404 for retired/removed gear
            pass

        name = item.get("displayName") or item.get("customMakeModel") or item.get("gearModelName") or "Gear"
        Gear.objects.update_or_create(
            user_id=account.user_id,
            garmin_gear_uuid=uuid,
            defaults={
                "name": name,
                "gear_type": item.get("gearTypeName", ""),
                "is_retired": item.get("gearStatusName") == "retired",
                "total_distance_m": stats.get("totalDistance") or 0,
                "raw": item,
            },
        )
        imported += 1
    return imported


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


def _from_epoch_ms(ms: int):
    return datetime.fromtimestamp(ms / 1000, tz=dt_timezone.utc)


def _none_if_negative(value):
    """Garmin uses -1 (and similar negative sentinels) to mean "no data
    available yet" for several daily metrics, e.g. today's stress average
    before the day is over. Our fields are non-negative, so normalize those
    sentinels to None rather than let them hit a DB check constraint."""
    if value is None:
        return None
    return value if value >= 0 else None
