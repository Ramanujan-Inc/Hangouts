from datetime import datetime, timezone
from typing import Optional, List, Dict, Any
from supabase import Client
from app.schemas.expense import ExpenseCreate
from app.core.exceptions import NotFoundError, ForbiddenError, BadRequestError
from app.services.hangouts import get_hangout_participants


def create_expense(
    db: Client,
    hangout_id: str,
    user_id: str,
    expense_create: ExpenseCreate,
) -> Dict[str, Any]:
    """Log an expense for a hangout."""
    # 1. Check hangout existence
    hangout_res = db.table("hangouts").select("id").eq("id", hangout_id).execute()
    if not hangout_res.data:
        raise NotFoundError("Hangout not found.")

    if expense_create.total_amount <= 0:
        raise BadRequestError("Total amount must be greater than 0.")

    paid_by = str(expense_create.paid_by) if expense_create.paid_by else user_id

    # Personal expenses can only be logged for oneself
    if expense_create.split_type == "personal" and str(paid_by) != str(user_id):
        raise BadRequestError("Personal expenses can only be logged for yourself.")

    # Verify payer profile exists
    payer_res = db.table("profiles").select("*").eq("id", paid_by).execute()
    if not payer_res.data:
        raise NotFoundError("Payer profile not found.")

    now = datetime.now(timezone.utc).isoformat()
    expense_dict = {
        "hangout_id": hangout_id,
        "paid_by": paid_by,
        "description": expense_create.description,
        "total_amount": float(expense_create.total_amount),
        "split_type": expense_create.split_type,
        "created_at": now,
    }

    res = db.table("expenses").insert(expense_dict).execute()
    if not res.data:
        raise Exception("Failed to log expense.")

    expense_data = res.data[0]
    expense_data["total_amount"] = float(expense_data["total_amount"])
    expense_data["payer"] = payer_res.data[0]

    return expense_data


def get_hangout_expenses(
    db: Client,
    hangout_id: str,
    user_id: Optional[str] = None,
) -> List[Dict[str, Any]]:
    """Retrieve all logged expenses for a hangout, ordered chronologically. Personal expenses are visible only to the owner."""
    hangout_res = db.table("hangouts").select("id").eq("id", hangout_id).execute()
    if not hangout_res.data:
        raise NotFoundError("Hangout not found.")

    res = db.table("expenses").select("*").eq("hangout_id", hangout_id).order("created_at", desc=False).execute()
    items = res.data or []

    # Filter out personal expenses not owned by the current user
    visible_items = []
    for item in items:
        if item.get("split_type") == "personal" and str(item.get("paid_by")) != str(user_id):
            continue
        visible_items.append(item)

    payer_ids = list({item["paid_by"] for item in visible_items if "paid_by" in item})
    profiles_map = {}
    if payer_ids:
        profiles_res = db.table("profiles").select("*").in_("id", payer_ids).execute()
        if profiles_res.data:
            profiles_map = {p["id"]: p for p in profiles_res.data}

    for item in visible_items:
        item["payer"] = profiles_map.get(item.get("paid_by"))
        item["total_amount"] = float(item["total_amount"])

    return visible_items


def get_expense_summary(
    db: Client,
    hangout_id: str,
    user_id: Optional[str] = None,
) -> Dict[str, Any]:
    """Calculate total spent, equal split share, member net balances, and simplified debt transactions."""
    hangout_res = db.table("hangouts").select("id, created_by").eq("id", hangout_id).execute()
    if not hangout_res.data:
        raise NotFoundError("Hangout not found.")

    # 1. Fetch participants
    participants = get_hangout_participants(db=db, hangout_id=hangout_id)
    participant_user_ids = {str(p["user_id"]) for p in participants}

    # Ensure creator is included if participants list is otherwise empty
    if not participant_user_ids:
        creator_id = str(hangout_res.data[0]["created_by"])
        participant_user_ids.add(creator_id)

    # 2. Fetch expenses
    expenses_res = db.table("expenses").select("*").eq("hangout_id", hangout_id).execute()
    all_expenses = expenses_res.data or []
    for e in all_expenses:
        e["total_amount"] = float(e["total_amount"])

    # Equal split expenses (shared across all participants)
    equal_split_expenses = [e for e in all_expenses if e.get("split_type", "equal") == "equal"]
    for e in equal_split_expenses:
        participant_user_ids.add(str(e["paid_by"]))

    # Expenses visible to the requesting user (shared expenses + personal expenses owned by user)
    visible_expenses = [
        e for e in all_expenses
        if e.get("split_type", "equal") != "personal" or (user_id and str(e.get("paid_by")) == str(user_id))
    ]
    if user_id:
        participant_user_ids.add(str(user_id))

    # 3. Fetch profiles for all involved members
    profiles_map = {}
    if participant_user_ids:
        p_res = db.table("profiles").select("*").in_("id", list(participant_user_ids)).execute()
        if p_res.data:
            profiles_map = {str(p["id"]): p for p in p_res.data}

    # 4. Compute totals based on visible expenses
    total_expenses = round(sum(e["total_amount"] for e in visible_expenses), 2)
    equal_split_total = round(sum(e["total_amount"] for e in equal_split_expenses), 2)
    participant_count = len(participant_user_ids)
    per_person_share = round(equal_split_total / participant_count, 2) if participant_count > 0 else 0.0

    # 5. Calculate individual member balances
    member_balances = []
    balances_map: Dict[str, float] = {}

    for uid in participant_user_ids:
        # total_paid reflects visible spending (shared expenses + viewer's own personal expenses)
        total_paid = round(sum(e["total_amount"] for e in visible_expenses if str(e["paid_by"]) == uid), 2)
        total_paid_equal = round(sum(e["total_amount"] for e in equal_split_expenses if str(e["paid_by"]) == uid), 2)
        net_balance = round(total_paid_equal - per_person_share, 2)
        balances_map[uid] = net_balance

        owes = round(abs(net_balance), 2) if net_balance < 0 else 0.0
        is_owed = round(net_balance, 2) if net_balance > 0 else 0.0

        member_balances.append({
            "user_id": uid,
            "profile": profiles_map.get(uid),
            "total_paid": total_paid,
            "total_paid_equal": total_paid_equal,
            "net_balance": net_balance,
            "owes": owes,
            "is_owed": is_owed,
        })

    # Sort member balances by total_paid DESC for clean spending breakdown representation
    member_balances.sort(key=lambda m: m["total_paid"], reverse=True)

    # 6. Greedy debt simplification ("Who Owes Whom")
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
                "from_user": profiles_map.get(debtor["user_id"]),
                "to_user_id": creditor["user_id"],
                "to_user": profiles_map.get(creditor["user_id"]),
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


def delete_expense(
    db: Client,
    expense_id: str,
    user_id: str,
) -> None:
    """Delete an expense record (allowed by payer, or hangout creator for shared expenses)."""
    expense_res = db.table("expenses").select("*").eq("id", expense_id).execute()
    if not expense_res.data:
        raise NotFoundError("Expense not found.")

    expense = expense_res.data[0]
    is_payer = str(expense.get("paid_by")) == str(user_id)

    # Personal expenses are strictly visible and manageable only by the owner
    if expense.get("split_type") == "personal" and not is_payer:
        raise NotFoundError("Expense not found.")

    hangout_res = db.table("hangouts").select("created_by").eq("id", expense["hangout_id"]).execute()
    is_creator = False
    if hangout_res.data and str(hangout_res.data[0].get("created_by")) == str(user_id):
        is_creator = True

    if not is_payer and not is_creator:
        raise ForbiddenError("Only the payer or hangout creator can delete this expense.")

    db.table("expenses").delete().eq("id", expense_id).execute()
