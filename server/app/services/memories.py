from datetime import date, datetime, timezone
from typing import Optional, List, Dict, Any
from supabase import Client
from app.services.hangouts import get_hangout_participants, get_user_hangout_ids


def get_memories_on_this_day(
    db: Client,
    user_id: Optional[str] = None,
    target_date: Optional[date] = None,
    group_id: Optional[str] = None,
    window_days: int = 3,
) -> List[Dict[str, Any]]:
    """Retrieve historical hangouts that took place within a window (default ±3 days) of target_date in prior years."""
    if target_date is None:
        target_date = datetime.now(timezone.utc).date()

    target_year = target_date.year

    query = db.table("hangouts").select("*").lt("hangout_date", target_date.isoformat())

    if user_id:
        user_hangout_ids = get_user_hangout_ids(db, user_id)
        if not user_hangout_ids:
            return []
        query = query.in_("id", user_hangout_ids)

    if group_id:
        query = query.eq("group_id", str(group_id))

    response = query.order("hangout_date", desc=True).execute()
    hangouts = response.data if response.data else []

    memories = []
    for hangout in hangouts:
        h_date_str = hangout.get("hangout_date")
        if not h_date_str:
            continue

        h_date = date.fromisoformat(h_date_str)
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

            # Populate creator profile
            creator_res = db.table("profiles").select("*").eq("id", hangout["created_by"]).execute()
            hangout["creator"] = creator_res.data[0] if creator_res.data else None

            # Populate participants with profile details
            hangout["participants"] = get_hangout_participants(db=db, hangout_id=hangout["id"])
            hangout["years_ago"] = years_ago
            hangout["days_diff"] = diff

            memories.append(hangout)

    # Sort memories: exact matches (abs(days_diff) == 0) first, then closest days_diff, then most recent years
    memories.sort(key=lambda m: (abs(m.get("days_diff", 0)), -m.get("years_ago", 0)))

    return memories
