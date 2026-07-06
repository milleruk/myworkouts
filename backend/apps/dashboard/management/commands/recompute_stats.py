from django.contrib.auth import get_user_model
from django.core.management.base import BaseCommand

from apps.dashboard.tasks import build_stats_for_user


class Command(BaseCommand):
    help = "Recompute cached dashboard stats for one user (--user-id) or all connected users."

    def add_arguments(self, parser):
        parser.add_argument("--user-id", type=int, default=None)
        parser.add_argument(
            "--async", action="store_true", dest="run_async",
            help="Queue via Celery instead of running inline.",
        )

    def handle(self, *args, **options):
        User = get_user_model()
        qs = (
            User.objects.filter(id=options["user_id"])
            if options["user_id"]
            else User.objects.filter(garmin_account__isnull=False)
        )
        for user in qs:
            if options["run_async"]:
                build_stats_for_user.delay(user.id)
                self.stdout.write(f"Queued stats for user {user.id}")
            else:
                build_stats_for_user(user.id)
                self.stdout.write(f"Computed stats for user {user.id}")
