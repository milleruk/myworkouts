WIDTH_CHOICES = (33, 50, 66, 100)

WIDGET_KEYS = [
    "eddington_number",
    "streaks",
    "weekly_stats",
    "monthly_stats",
    "yearly_stats",
    "activity_heatmap",
    "training_load",
    "gear_totals",
]

DEFAULT_LAYOUT = [
    {"id": key, "widget": key, "width": 50, "enabled": True, "config": {}}
    for key in WIDGET_KEYS
]


def backfill_layout(widgets: list[dict]) -> list[dict]:
    """Ensure every known widget key is present at least once, appending any
    missing ones (disabled) rather than requiring a migration when a new
    widget is added to WIDGET_KEYS."""
    present = {entry.get("widget") for entry in widgets}
    missing = [key for key in WIDGET_KEYS if key not in present]
    if not missing:
        return widgets
    return widgets + [
        {"id": key, "widget": key, "width": 50, "enabled": False, "config": {}}
        for key in missing
    ]
