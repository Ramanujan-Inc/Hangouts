from datetime import date, datetime, timezone
from typing import Optional, List, Dict, Any
from supabase import Client
from app.services.hangouts import get_hangout_participants


def get_memories_on_this_day(
    db: Client,
    target_date: Optional[date] = None,
    group_id: Optional[str] = None,
) -> List[Dict[str, Any]]:
    """Retrieve historical hangouts that took place on the same month and day in prior years."""
    if target_date is None:
        target_date = datetime.now(timezone.utc).date()

    target_month = target_date.month
    target_day = target_date.day
    target_year = target_date.year

    query = db.table("hangouts").select("*").lt("hangout_date", target_date.isoformat())

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
        if h_date.month == target_month and h_date.day == target_day and h_date.year < target_year:
            years_ago = target_year - h_date.year

            # Populate creator profile
            creator_res = db.table("profiles").select("*").eq("id", hangout["created_by"]).execute()
            hangout["creator"] = creator_res.data[0] if creator_res.data else None

            # Populate participants with profile details
            hangout["participants"] = get_hangout_participants(db=db, hangout_id=hangout["id"])
            hangout["years_ago"] = years_ago

            memories.append(hangout)

    return memories
