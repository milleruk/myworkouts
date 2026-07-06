"""In-memory registry of in-progress Garmin MFA logins.

garminconnect's MFA resume flow keeps the live login session (cookies, form
params) as instance attributes on the `Client` object itself rather than in
any serializable argument (see Client.resume_login, which literally ignores
its `client_state` parameter). That means the same `Garmin` client instance
must stay alive, in this process, between the "submit password" step and the
"submit MFA code" step -- so this dict only works because the garmin_auth
Celery worker runs with a single, unscaled process (see docker-compose.yml).
"""

import threading
import uuid
from dataclasses import dataclass
from datetime import datetime, timedelta, timezone

from garminconnect import Garmin

TTL = timedelta(minutes=10)

_lock = threading.Lock()
_pending: dict[str, "PendingLogin"] = {}


@dataclass
class PendingLogin:
    client: Garmin
    user_id: int
    created_at: datetime


def store(client: Garmin, user_id: int) -> str:
    pending_login_id = uuid.uuid4().hex
    with _lock:
        _pending[pending_login_id] = PendingLogin(
            client=client, user_id=user_id, created_at=datetime.now(timezone.utc)
        )
    return pending_login_id


def pop(pending_login_id: str) -> PendingLogin | None:
    with _lock:
        entry = _pending.pop(pending_login_id, None)
    if entry is None:
        return None
    if datetime.now(timezone.utc) - entry.created_at > TTL:
        return None
    return entry


def purge_stale() -> int:
    cutoff = datetime.now(timezone.utc) - TTL
    with _lock:
        stale = [k for k, v in _pending.items() if v.created_at < cutoff]
        for k in stale:
            del _pending[k]
    return len(stale)
