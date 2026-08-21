from typing import List
from fastapi import APIRouter, Depends, status
from supabase import Client
from app.api.deps import get_current_user, get_db
from app.schemas.expense import ExpenseCreate, ExpenseResponse, ExpenseSummaryResponse
from app.services import expenses as expense_service

router = APIRouter()


@router.post(
    "/hangouts/{id}/expenses",
    response_model=ExpenseResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Log an expense for a hangout",
)
def create_expense(
    id: str,
    expense_create: ExpenseCreate,
    current_user: dict = Depends(get_current_user),
    db: Client = Depends(get_db),
):
    """Log an expense for a hangout with split type (equal or personal)."""
    return expense_service.create_expense(
        db=db,
        hangout_id=id,
        user_id=current_user["id"],
        expense_create=expense_create,
    )


@router.get(
    "/hangouts/{id}/expenses",
    response_model=List[ExpenseResponse],
    summary="List logged expenses for a hangout",
)
def list_hangout_expenses(
    id: str,
    current_user: dict = Depends(get_current_user),
    db: Client = Depends(get_db),
):
    """Retrieve all logged expenses for a hangout in chronological order."""
    return expense_service.get_hangout_expenses(
        db=db,
        hangout_id=id,
    )


@router.get(
    "/hangouts/{id}/expenses/summary",
    response_model=ExpenseSummaryResponse,
    summary="Get equal split settlement and simplified balances summary",
)
def get_expense_summary(
    id: str,
    current_user: dict = Depends(get_current_user),
    db: Client = Depends(get_db),
):
    """Calculate total spent, equal split share, member net balances, and simplified debt transactions (who owes whom)."""
    return expense_service.get_expense_summary(
        db=db,
        hangout_id=id,
    )


@router.delete(
    "/expenses/{expense_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Delete an expense",
)
def delete_expense(
    expense_id: str,
    current_user: dict = Depends(get_current_user),
    db: Client = Depends(get_db),
):
    """Delete an expense record (payer or hangout creator only)."""
    expense_service.delete_expense(
        db=db,
        expense_id=expense_id,
        user_id=current_user["id"],
    )
