import uuid
from datetime import datetime, timezone
from typing import Optional, List, Dict, Any
from sqlalchemy import select
from sqlalchemy.orm import Session, joinedload
from app.models.expense import Expense
from app.models.hangout import Hangout
from app.models.profile import Profile
from app.schemas.expense import ExpenseCreate
from app.core.exceptions import NotFoundError, ForbiddenError, BadRequestError
from app.services.hangouts import get_hangout_participants


def _expense_to_dict(expense: Expense) -> Dict[str, Any]:
    payer_dict = None
    if expense.payer:
        payer_dict = {
            "id": str(expense.payer.id),
            "username": expense.payer.username,
            "email": expense.payer.email,
            "avatar_url": expense.payer.avatar_url,
            "created_at": expense.payer.created_at.isoformat(),
            "updated_at": expense.payer.updated_at.isoformat(),
        }
    return {
        "id": str(expense.id),
        "hangout_id": str(expense.hangout_id),
        "paid_by": str(expense.paid_by) if expense.paid_by else None,
        "description": expense.description,
        "total_amount": float(expense.total_amount),
        "split_type": expense.split_type,
        "created_at": expense.created_at.isoformat(),
        "payer": payer_dict,
    }


def create_expense(
    db: Session,
    hangout_id: str,
    user_id: str,
    expense_create: ExpenseCreate,
) -> Dict[str, Any]:
    """Log an expense for a hangout."""
    try:
        h_uuid = uuid.UUID(str(hangout_id))
    except (ValueError, AttributeError):
        raise NotFoundError("Hangout not found.")

    hangout = db.get(Hangout, h_uuid)
    if not hangout:
        raise NotFoundError("Hangout not found.")

    if expense_create.total_amount <= 0:
        raise BadRequestError("Total amount must be greater than 0.")

    paid_by_str = str(expense_create.paid_by) if expense_create.paid_by else user_id

    # Personal expenses can only be logged for oneself
    if expense_create.split_type == "personal" and str(paid_by_str) != str(user_id):
        raise BadRequestError("Personal expenses can only be logged for yourself.")

    try:
        paid_by_uuid = uuid.UUID(paid_by_str)
    except (ValueError, AttributeError):
        raise NotFoundError("Payer profile not found.")

    payer = db.get(Profile, paid_by_uuid)
    if not payer:
        raise NotFoundError("Payer profile not found.")

    expense = Expense(
        hangout_id=h_uuid,
        paid_by=paid_by_uuid,
        description=expense_create.description,
        total_amount=expense_create.total_amount,
        split_type=expense_create.split_type,
    )
    db.add(expense)
    db.flush()
    db.refresh(expense, attribute_names=["payer"])

    return _expense_to_dict(expense)


def get_hangout_expenses(
    db: Session,
    hangout_id: str,
    user_id: Optional[str] = None,
) -> List[Dict[str, Any]]:
    """Retrieve all logged expenses for a hangout, ordered chronologically. Personal expenses are visible only to the owner."""
    try:
        h_uuid = uuid.UUID(str(hangout_id))
    except (ValueError, AttributeError):
        raise NotFoundError("Hangout not found.")

    hangout = db.get(Hangout, h_uuid)
    if not hangout:
        raise NotFoundError("Hangout not found.")

    expenses = db.scalars(
        select(Expense)
        .options(joinedload(Expense.payer))
        .where(Expense.hangout_id == h_uuid)
        .order_by(Expense.created_at.asc())
    ).all()

    visible_items = []
    for e in expenses:
        if e.split_type == "personal" and (not user_id or str(e.paid_by) != str(user_id)):
            continue
        visible_items.append(_expense_to_dict(e))

    return visible_items


def compute_expense_summary_from_data(
    hangout_id: str,
    all_expenses: List[Dict[str, Any]],
    participants: List[Dict[str, Any]],
    creator_id: Optional[str] = None,
    user_id: Optional[str] = None,
    profiles_map: Optional[Dict[str, Any]] = None,
) -> Dict[str, Any]:
    """Pure in-memory calculation of total spent, equal split share, balances, and debts."""
    participant_user_ids = {str(p["user_id"]) for p in participants if "user_id" in p}

    if not participant_user_ids and creator_id:
        participant_user_ids.add(str(creator_id))

    for e in all_expenses:
        e["total_amount"] = float(e.get("total_amount") or 0)

    equal_split_expenses = [e for e in all_expenses if e.get("split_type", "equal") == "equal"]
    for e in equal_split_expenses:
        if "paid_by" in e and e["paid_by"]:
            participant_user_ids.add(str(e["paid_by"]))

    visible_expenses = [
        e for e in all_expenses
        if e.get("split_type", "equal") != "personal" or (user_id and str(e.get("paid_by")) == str(user_id))
    ]
    if user_id:
        participant_user_ids.add(str(user_id))

    resolved_profiles: Dict[str, Any] = dict(profiles_map or {})
    for p in participants:
        uid = str(p.get("user_id"))
        if uid and p.get("profile") and uid not in resolved_profiles:
            resolved_profiles[uid] = p["profile"]
    for e in all_expenses:
        uid = str(e.get("paid_by"))
        if uid and e.get("payer") and uid not in resolved_profiles:
            resolved_profiles[uid] = e["payer"]

    total_expenses = round(sum(e["total_amount"] for e in visible_expenses), 2)
    equal_split_total = round(sum(e["total_amount"] for e in equal_split_expenses), 2)
    participant_count = len(participant_user_ids)
    per_person_share = round(equal_split_total / participant_count, 2) if participant_count > 0 else 0.0

    member_balances = []
    balances_map: Dict[str, float] = {}

    for uid in participant_user_ids:
        total_paid = round(sum(e["total_amount"] for e in visible_expenses if str(e.get("paid_by")) == uid), 2)
        total_paid_equal = round(sum(e["total_amount"] for e in equal_split_expenses if str(e.get("paid_by")) == uid), 2)
        net_balance = round(total_paid_equal - per_person_share, 2)
        balances_map[uid] = net_balance

        owes = round(abs(net_balance), 2) if net_balance < 0 else 0.0
        is_owed = round(net_balance, 2) if net_balance > 0 else 0.0

        member_balances.append({
            "user_id": uid,
            "profile": resolved_profiles.get(uid),
            "total_paid": total_paid,
            "total_paid_equal": total_paid_equal,
            "net_balance": net_balance,
            "owes": owes,
            "is_owed": is_owed,
        })

    member_balances.sort(key=lambda m: m["total_paid"], reverse=True)

    debtors = [{"user_id": uid, "bal": abs(bal)} for uid, bal in balances_map.items() if bal < -0.001]
    creditors = [{"user_id": uid, "bal": bal} for uid, bal in balances_map.items() if bal > 0.001]

    debtors.sort(key=lambda x: x["bal"], reverse=True)
    creditors.sort(key=lambda x: x["bal"], reverse=True)

    simplified_debts = []
    d_idx = 0
    c_idx = 0

    while d_idx < len(debtors) and c_idx < len(creditors):
        debtor = debtors[d_idx]
        creditor = creditors[c_idx]
        amount = round(min(debtor["bal"], creditor["bal"]), 2)

        if amount > 0.009:
            simplified_debts.append({
                "from_user_id": debtor["user_id"],
                "from_user": resolved_profiles.get(debtor["user_id"]),
                "to_user_id": creditor["user_id"],
                "to_user": resolved_profiles.get(creditor["user_id"]),
                "amount": amount,
            })

        debtor["bal"] = round(debtor["bal"] - amount, 2)
        creditor["bal"] = round(creditor["bal"] - amount, 2)

        if debtor["bal"] <= 0.001:
            d_idx += 1
        if creditor["bal"] <= 0.001:
            c_idx += 1

    return {
        "hangout_id": hangout_id,
        "total_expenses": total_expenses,
        "expense_count": len(visible_expenses),
        "equal_split_total": equal_split_total,
        "per_person_share": per_person_share,
        "participant_count": participant_count,
        "member_balances": member_balances,
        "simplified_debts": simplified_debts,
    }


def get_expense_summary(
    db: Session,
    hangout_id: str,
    user_id: Optional[str] = None,
) -> Dict[str, Any]:
    """Calculate total spent, equal split share, member net balances, and simplified debt transactions."""
    try:
        h_uuid = uuid.UUID(str(hangout_id))
    except (ValueError, AttributeError):
        raise NotFoundError("Hangout not found.")

    hangout = db.get(Hangout, h_uuid)
    if not hangout:
        raise NotFoundError("Hangout not found.")

    creator_id = str(hangout.created_by) if hangout.created_by else None
    participants = get_hangout_participants(db=db, hangout_id=hangout_id)

    expenses = db.scalars(
        select(Expense)
        .options(joinedload(Expense.payer))
        .where(Expense.hangout_id == h_uuid)
    ).all()
    all_expenses = [_expense_to_dict(e) for e in expenses]

    participant_user_ids = {str(p["user_id"]) for p in participants if "user_id" in p}
    for e in all_expenses:
        if "paid_by" in e and e["paid_by"]:
            participant_user_ids.add(str(e["paid_by"]))

    profiles_map = {}
    if participant_user_ids:
        p_uuids = [uuid.UUID(uid) for uid in participant_user_ids]
        p_list = db.scalars(select(Profile).where(Profile.id.in_(p_uuids))).all()
        profiles_map = {
            str(p.id): {
                "id": str(p.id),
                "username": p.username,
                "email": p.email,
                "avatar_url": p.avatar_url,
                "created_at": p.created_at.isoformat(),
                "updated_at": p.updated_at.isoformat(),
            }
            for p in p_list
        }

    return compute_expense_summary_from_data(
        hangout_id=hangout_id,
        all_expenses=all_expenses,
        participants=participants,
        creator_id=creator_id,
        user_id=user_id,
        profiles_map=profiles_map,
    )


def delete_expense(
    db: Session,
    expense_id: str,
    user_id: str,
) -> None:
    """Delete an expense record (allowed by payer, or hangout creator for shared expenses)."""
    try:
        e_uuid = uuid.UUID(str(expense_id))
        u_uuid = uuid.UUID(str(user_id))
    except (ValueError, AttributeError):
        raise NotFoundError("Expense not found.")

    expense = db.get(Expense, e_uuid)
    if not expense:
        raise NotFoundError("Expense not found.")

    is_payer = expense.paid_by == u_uuid

    if expense.split_type == "personal" and not is_payer:
        raise NotFoundError("Expense not found.")

    hangout = db.get(Hangout, expense.hangout_id)
    is_creator = False
    if hangout and hangout.created_by == u_uuid:
        is_creator = True

    if not is_payer and not is_creator:
        raise ForbiddenError("Only the payer or hangout creator can delete this expense.")

    db.delete(expense)
    db.flush()
