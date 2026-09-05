import uuid
from typing import Dict, Any, Callable
import pytest
from fastapi.testclient import TestClient


def _create_test_hangout(client: TestClient) -> str:
    """Helper function to create a test hangout and return its ID."""
    payload = {
        "title": "Expense Test Hangout",
        "description": "Hangout for testing expense tracking and settlement calculations",
        "hangout_date": "2026-08-28",
        "location_name": "Tokyo Diner",
    }
    res = client.post("/api/v1/hangouts", json=payload)
    assert res.status_code == 201
    return res.json()["id"]


def test_create_and_list_expenses(
    authenticated_client: TestClient,
    primary_user: Dict[str, Any],
):
    """Test logging an expense and listing expenses for a hangout."""
    hangout_id = _create_test_hangout(authenticated_client)

    expense_payload = {
        "description": "Ramen Bowls & Gyoza",
        "total_amount": 1800.0,
        "split_type": "equal",
    }
    create_res = authenticated_client.post(
        f"/api/v1/hangouts/{hangout_id}/expenses",
        json=expense_payload,
    )
    assert create_res.status_code == 201
    exp_data = create_res.json()
    assert exp_data["hangout_id"] == hangout_id
    assert exp_data["paid_by"] == primary_user["id"]
    assert exp_data["description"] == "Ramen Bowls & Gyoza"
    assert exp_data["total_amount"] == 1800.0
    assert exp_data["split_type"] == "equal"
    assert exp_data["payer"]["id"] == primary_user["id"]
    assert "created_at" in exp_data

    # List expenses
    list_res = authenticated_client.get(f"/api/v1/hangouts/{hangout_id}/expenses")
    assert list_res.status_code == 200
    expenses = list_res.json()
    assert len(expenses) >= 1
    assert any(e["id"] == exp_data["id"] for e in expenses)


def test_expense_equal_split_and_simplified_debts(
    authenticated_client: TestClient,
    create_test_user: Callable[..., Dict[str, Any]],
    primary_user: Dict[str, Any],
):
    """Replicate UI scenario: 3 members (Mika, Jam, Dave), Total ₱2,250, equal split ₱750/person.
    Jam owes Mika ₱300, Dave owes Mika ₱750.
    """
    # 1. Setup users: Mika (primary), Jam (user_2), Dave (user_3)
    user_mika = primary_user
    user_jam = create_test_user(username="Expense_Jam_1")
    user_dave = create_test_user(username="Expense_Dave_1")

    hangout_id = _create_test_hangout(authenticated_client)

    # 2. Add Jam and Dave as participants to the hangout
    add_jam_res = authenticated_client.post(
        f"/api/v1/hangouts/{hangout_id}/participants",
        json={"user_id": user_jam["id"]},
    )
    assert add_jam_res.status_code == 201

    add_dave_res = authenticated_client.post(
        f"/api/v1/hangouts/{hangout_id}/participants",
        json={"user_id": user_dave["id"]},
    )
    assert add_dave_res.status_code == 201

    # 3. Mika pays ₱1,800 for Ramen
    res1 = authenticated_client.post(
        f"/api/v1/hangouts/{hangout_id}/expenses",
        json={"description": "Ramen Bowls & Gyoza", "total_amount": 1800.0, "split_type": "equal"},
    )
    assert res1.status_code == 201

    # 4. Jam pays ₱450 for Dessert
    res2 = authenticated_client.post(
        f"/api/v1/hangouts/{hangout_id}/expenses",
        json={"description": "Dessert & Milk tea", "total_amount": 450.0, "split_type": "equal"},
        headers=user_jam["headers"],
    )
    assert res2.status_code == 201

    # 5. Fetch Settlement Summary
    summary_res = authenticated_client.get(f"/api/v1/hangouts/{hangout_id}/expenses/summary")
    assert summary_res.status_code == 200
    summary = summary_res.json()

    assert summary["hangout_id"] == hangout_id
    assert summary["total_expenses"] == 2250.0
    assert summary["expense_count"] == 2
    assert summary["equal_split_total"] == 2250.0
    assert summary["participant_count"] == 3
    assert summary["per_person_share"] == 750.0

    # 6. Verify Member Balances
    balances_by_user = {b["user_id"]: b for b in summary["member_balances"]}

    # Mika: paid 1800, net +1050, owes 0, is_owed 1050
    mika_bal = balances_by_user[user_mika["id"]]
    assert mika_bal["total_paid"] == 1800.0
    assert mika_bal["net_balance"] == 1050.0
    assert mika_bal["owes"] == 0.0
    assert mika_bal["is_owed"] == 1050.0

    # Jam: paid 450, net -300, owes 300, is_owed 0
    jam_bal = balances_by_user[user_jam["id"]]
    assert jam_bal["total_paid"] == 450.0
    assert jam_bal["net_balance"] == -300.0
    assert jam_bal["owes"] == 300.0
    assert jam_bal["is_owed"] == 0.0

    # Dave: paid 0, net -750, owes 750, is_owed 0
    dave_bal = balances_by_user[user_dave["id"]]
    assert dave_bal["total_paid"] == 0.0
    assert dave_bal["net_balance"] == -750.0
    assert dave_bal["owes"] == 750.0
    assert dave_bal["is_owed"] == 0.0

    # 7. Verify Simplified Debts ("Who Owes Whom")
    debts = summary["simplified_debts"]
    assert len(debts) == 2

    # Expect: Jam owes Mika 300, Dave owes Mika 750
    debt_pairs = {(d["from_user_id"], d["to_user_id"]): d["amount"] for d in debts}
    assert debt_pairs.get((user_jam["id"], user_mika["id"])) == 300.0
    assert debt_pairs.get((user_dave["id"], user_mika["id"])) == 750.0


def test_personal_expense_isolation(
    authenticated_client: TestClient,
    create_test_user: Callable[..., Dict[str, Any]],
    primary_user: Dict[str, Any],
):
    """Personal expenses should not inflate equal-split share for other participants."""
    user_mika = primary_user
    user_jam = create_test_user(username="Expense_Jam_2")

    hangout_id = _create_test_hangout(authenticated_client)

    authenticated_client.post(
        f"/api/v1/hangouts/{hangout_id}/participants",
        json={"user_id": user_jam["id"]},
    )

    # 1. Mika logs equal split expense: ₱600
    authenticated_client.post(
        f"/api/v1/hangouts/{hangout_id}/expenses",
        json={"description": "Shared Lunch", "total_amount": 600.0, "split_type": "equal"},
    )

    # 2. Mika logs personal expense: ₱200
    authenticated_client.post(
        f"/api/v1/hangouts/{hangout_id}/expenses",
        json={"description": "Personal Coffee & Snack", "total_amount": 200.0, "split_type": "personal"},
    )

    summary_res = authenticated_client.get(f"/api/v1/hangouts/{hangout_id}/expenses/summary")
    assert summary_res.status_code == 200
    summary = summary_res.json()

    assert summary["total_expenses"] == 800.0
    assert summary["equal_split_total"] == 600.0
    assert summary["per_person_share"] == 300.0  # 600 / 2 = 300 (not 400!)

    balances = {b["user_id"]: b for b in summary["member_balances"]}
    assert balances[user_jam["id"]]["owes"] == 300.0
    assert balances[user_mika["id"]]["total_paid"] == 800.0
    assert balances[user_mika["id"]]["is_owed"] == 300.0


def test_personal_expenses_visibility_restricted_to_owner(
    authenticated_client: TestClient,
    create_test_user: Callable[..., Dict[str, Any]],
    primary_user: Dict[str, Any],
):
    """Personal expenses must be visible only to the user who owns that expense.
    
    Checks:
    1. primary_user cannot see secondary_user's personal expense in expenses list.
    2. secondary_user cannot see primary_user's personal expense in expenses list.
    3. Summary for each user does not leak other users' personal expenses in totals or member balances.
    4. Non-owners (even hangout creators) cannot delete another user's personal expense.
    5. Users cannot log a personal expense under someone else's paid_by ID.
    """
    user_mika = primary_user
    user_jam = create_test_user(username="Expense_Jam_Visibility")

    hangout_id = _create_test_hangout(authenticated_client)

    # Add Jam as participant
    authenticated_client.post(
        f"/api/v1/hangouts/{hangout_id}/participants",
        json={"user_id": user_jam["id"]},
    )

    # 1. Mika logs shared lunch: ₱600
    shared_res = authenticated_client.post(
        f"/api/v1/hangouts/{hangout_id}/expenses",
        json={"description": "Shared Lunch", "total_amount": 600.0, "split_type": "equal"},
    )
    assert shared_res.status_code == 201
    shared_id = shared_res.json()["id"]

    # 2. Mika logs personal coffee: ₱150
    mika_pers_res = authenticated_client.post(
        f"/api/v1/hangouts/{hangout_id}/expenses",
        json={"description": "Mika Coffee", "total_amount": 150.0, "split_type": "personal"},
    )
    assert mika_pers_res.status_code == 201
    mika_pers_id = mika_pers_res.json()["id"]

    # 3. Jam logs personal souvenir: ₱250
    jam_pers_res = authenticated_client.post(
        f"/api/v1/hangouts/{hangout_id}/expenses",
        json={"description": "Jam Souvenir", "total_amount": 250.0, "split_type": "personal"},
        headers=user_jam["headers"],
    )
    assert jam_pers_res.status_code == 201
    jam_pers_id = jam_pers_res.json()["id"]

    # 4. Jam lists expenses -> should see Shared Lunch and Jam Souvenir, but NOT Mika Coffee
    jam_list_res = authenticated_client.get(
        f"/api/v1/hangouts/{hangout_id}/expenses",
        headers=user_jam["headers"],
    )
    assert jam_list_res.status_code == 200
    jam_expenses = jam_list_res.json()
    jam_exp_ids = [e["id"] for e in jam_expenses]

    assert shared_id in jam_exp_ids
    assert jam_pers_id in jam_exp_ids
    assert mika_pers_id not in jam_exp_ids
    assert len(jam_expenses) == 2

    # 5. Mika lists expenses -> should see Shared Lunch and Mika Coffee, but NOT Jam Souvenir
    mika_list_res = authenticated_client.get(f"/api/v1/hangouts/{hangout_id}/expenses")
    assert mika_list_res.status_code == 200
    mika_expenses = mika_list_res.json()
    mika_exp_ids = [e["id"] for e in mika_expenses]

    assert shared_id in mika_exp_ids
    assert mika_pers_id in mika_exp_ids
    assert jam_pers_id not in mika_exp_ids
    assert len(mika_expenses) == 2

    # 6. Jam checks summary:
    # Visible total spent for Jam should be 600 (shared) + 250 (Jam's personal) = 850
    # Mika's total_paid seen by Jam should only be 600 (Mika's personal 150 is hidden)
    # Jam's total_paid should be 250
    jam_sum_res = authenticated_client.get(
        f"/api/v1/hangouts/{hangout_id}/expenses/summary",
        headers=user_jam["headers"],
    )
    assert jam_sum_res.status_code == 200
    jam_sum = jam_sum_res.json()
    assert jam_sum["total_expenses"] == 850.0
    assert jam_sum["expense_count"] == 2
    assert jam_sum["equal_split_total"] == 600.0
    assert jam_sum["per_person_share"] == 300.0
    jam_sum_balances = {b["user_id"]: b for b in jam_sum["member_balances"]}
    assert jam_sum_balances[user_mika["id"]]["total_paid"] == 600.0
    assert jam_sum_balances[user_jam["id"]]["total_paid"] == 250.0

    # 7. Mika checks summary:
    # Visible total spent for Mika should be 600 (shared) + 150 (Mika's personal) = 750
    # Mika's total_paid should be 750 (600 + 150)
    # Jam's total_paid seen by Mika should be 0 (Jam's personal 250 is hidden)
    mika_sum_res = authenticated_client.get(f"/api/v1/hangouts/{hangout_id}/expenses/summary")
    assert mika_sum_res.status_code == 200
    mika_sum = mika_sum_res.json()
    assert mika_sum["total_expenses"] == 750.0
    assert mika_sum["expense_count"] == 2
    assert mika_sum["equal_split_total"] == 600.0
    assert mika_sum["per_person_share"] == 300.0
    mika_sum_balances = {b["user_id"]: b for b in mika_sum["member_balances"]}
    assert mika_sum_balances[user_mika["id"]]["total_paid"] == 750.0
    assert mika_sum_balances[user_jam["id"]]["total_paid"] == 0.0

    # 8. Deletion privacy:
    # Mika (even as hangout creator) cannot delete Jam's personal expense
    mika_del_res = authenticated_client.delete(f"/api/v1/expenses/{jam_pers_id}")
    assert mika_del_res.status_code == 404

    # Jam cannot delete Mika's personal expense
    jam_del_res = authenticated_client.delete(
        f"/api/v1/expenses/{mika_pers_id}",
        headers=user_jam["headers"],
    )
    assert jam_del_res.status_code == 404

    # Owner can delete their own personal expense
    jam_own_del = authenticated_client.delete(
        f"/api/v1/expenses/{jam_pers_id}",
        headers=user_jam["headers"],
    )
    assert jam_own_del.status_code == 204

    # 9. Cannot log a personal expense on behalf of someone else
    bad_log_res = authenticated_client.post(
        f"/api/v1/hangouts/{hangout_id}/expenses",
        json={
            "description": "Fraudulent Personal Expense",
            "total_amount": 50.0,
            "split_type": "personal",
            "paid_by": user_jam["id"],
        },
    )
    assert bad_log_res.status_code == 400


def test_delete_expense_permissions(
    authenticated_client: TestClient,
    create_test_user: Callable[..., Dict[str, Any]],
    primary_user: Dict[str, Any],
):
    """Payer or hangout creator can delete expense; unrelated user gets 403 Forbidden."""
    user_creator = primary_user
    user_payer = create_test_user(username="Payer")
    user_unrelated = create_test_user(username="Unrelated")

    hangout_id = _create_test_hangout(authenticated_client)

    # Payer logs an expense
    create_res = authenticated_client.post(
        f"/api/v1/hangouts/{hangout_id}/expenses",
        json={"description": "Snacks", "total_amount": 150.0, "split_type": "equal"},
        headers=user_payer["headers"],
    )
    assert create_res.status_code == 201
    expense_id = create_res.json()["id"]

    # Unrelated user attempts delete -> 403
    unauth_res = authenticated_client.delete(
        f"/api/v1/expenses/{expense_id}",
        headers=user_unrelated["headers"],
    )
    assert unauth_res.status_code == 403

    # Creator of the hangout can delete -> 204
    delete_res = authenticated_client.delete(f"/api/v1/expenses/{expense_id}")
    assert delete_res.status_code == 204

    # Payer logs another expense to test payer deletion
    create_res_2 = authenticated_client.post(
        f"/api/v1/hangouts/{hangout_id}/expenses",
        json={"description": "Drinks", "total_amount": 100.0, "split_type": "equal"},
        headers=user_payer["headers"],
    )
    expense_id_2 = create_res_2.json()["id"]

    payer_del_res = authenticated_client.delete(
        f"/api/v1/expenses/{expense_id_2}",
        headers=user_payer["headers"],
    )
    assert payer_del_res.status_code == 204


def test_expense_validation_and_not_found(authenticated_client: TestClient):
    """Test 404 for nonexistent entities and 400 for negative/zero amounts."""
    fake_uuid = str(uuid.uuid4())

    # Invalid amount <= 0
    res_bad_amount = authenticated_client.post(
        f"/api/v1/hangouts/{fake_uuid}/expenses",
        json={"description": "Free item", "total_amount": 0.0, "split_type": "equal"},
    )
    assert res_bad_amount.status_code in (400, 404)

    # Nonexistent hangout
    res_no_hangout = authenticated_client.post(
        f"/api/v1/hangouts/{fake_uuid}/expenses",
        json={"description": "Valid item", "total_amount": 100.0, "split_type": "equal"},
    )
    assert res_no_hangout.status_code == 404

    # Nonexistent summary
    res_no_summary = authenticated_client.get(f"/api/v1/hangouts/{fake_uuid}/expenses/summary")
    assert res_no_summary.status_code == 404

    # Nonexistent delete
    res_no_delete = authenticated_client.delete(f"/api/v1/expenses/{fake_uuid}")
    assert res_no_delete.status_code == 404
