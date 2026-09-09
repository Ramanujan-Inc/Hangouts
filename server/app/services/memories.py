import uuid
from datetime import date, datetime, timezone
from typing import Optional, List, Dict, Any
from sqlalchemy import select
from sqlalchemy.orm import Session, joinedload, selectinload
from app.models.hangout import Hangout, HangoutParticipant
from app.services.hangouts import get_user_hangout_ids, _hangout_to_dict


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
    db: Session,
    user_id: Optional[str] = None,
    target_date: Optional[date] = None,
    group_id: Optional[str] = None,
    window_days: int = 3,
) -> List[Dict[str, Any]]:
    """Retrieve historical hangouts with creator and participants joined in a single query."""
    if target_date is None:
        target_date = datetime.now(timezone.utc).date()

    query = (
        select(Hangout)
        .options(
            joinedload(Hangout.creator),
            selectinload(Hangout.participants).joinedload(HangoutParticipant.user),
        )
        .where(Hangout.hangout_date < target_date)
    )

    if user_id:
        user_hangout_ids = get_user_hangout_ids(db, user_id)
        if not user_hangout_ids:
            return []
        h_uuids = [uuid.UUID(hid) for hid in user_hangout_ids]
        query = query.where(Hangout.id.in_(h_uuids))

    if group_id:
        try:
            g_uuid = uuid.UUID(str(group_id))
            query = query.where(Hangout.group_id == g_uuid)
        except (ValueError, AttributeError):
            return []

    query = query.order_by(Hangout.hangout_date.desc())
    hangouts = db.scalars(query).all()
    hangouts_dict = [_hangout_to_dict(h) for h in hangouts]

    return find_anniversary_memories(hangouts_dict, target_date=target_date, window_days=window_days)
