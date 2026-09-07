from datetime import date, datetime, timezone
from typing import Optional, List, Dict, Any
from supabase import Client
from app.services.hangouts import get_user_hangout_ids


def find_anniversary_memories(
    hangouts: List[Dict[str, Any]],
    target_date: Optional[date] = None,
    window_days: int = 3,
) -> List[Dict[str, Any]]:
    """Compute and rank 'On This Day' anniversary memories from a list of hangouts in-memory."""
    if target_date is None:
        target_date = datetime.now(timezone.utc).date()

    target_year = target_date.year
    memories = []

    for hangout in hangouts:
        h_date_str = hangout.get("hangout_date")
        if not h_date_str:
            continue

        try:
            h_date = date.fromisoformat(str(h_date_str)[:10])
        except (ValueError, TypeError):
            continue

        if h_date.year >= target_year:
            continue

        # Compute anniversary date in the hangout's year
        try:
            anniversary = target_date.replace(year=h_date.year)
        except ValueError:
            # Leap year handling (e.g. Feb 29 on non-leap year -> Feb 28)
            anniversary = date(h_date.year, target_date.month, 28)

        diff = (h_date - anniversary).days
        if abs(diff) <= window_days:
            years_ago = target_year - h_date.year
            mem_item = dict(hangout)
            mem_item["years_ago"] = years_ago
            mem_item["days_diff"] = diff
            memories.append(mem_item)

    # Sort memories: exact matches (abs(days_diff) == 0) first, then closest days_diff, then most recent years
    memories.sort(key=lambda m: (abs(m.get("days_diff", 0)), -m.get("years_ago", 0)))
    return memories


def get_memories_on_this_day(
    db: Client,
    user_id: Optional[str] = None,
    target_date: Optional[date] = None,
    group_id: Optional[str] = None,
    window_days: int = 3,
) -> List[Dict[str, Any]]:
    """Retrieve historical hangouts with creator and participants joined in a single query."""
    if target_date is None:
        target_date = datetime.now(timezone.utc).date()

    query = (
        db.table("hangouts")
        .select(
            "*, creator:profiles!hangouts_created_by_fkey(*), "
            "participants:hangout_participants(id, hangout_id, user_id, profile:profiles!hangout_participants_user_id_fkey(*))"
        )
        .lt("hangout_date", target_date.isoformat())
    )

    if user_id:
        user_hangout_ids = get_user_hangout_ids(db, user_id)
        if not user_hangout_ids:
            return []
        query = query.in_("id", user_hangout_ids)

    if group_id:
        query = query.eq("group_id", str(group_id))

    response = query.order("hangout_date", desc=True).execute()
    hangouts = response.data if response.data else []

    return find_anniversary_memories(hangouts, target_date=target_date, window_days=window_days)

