from datetime import datetime
from typing import Optional, List, Literal
from uuid import UUID
from pydantic import BaseModel, ConfigDict
from app.schemas.profile import ProfileResponse


class ExpenseBase(BaseModel):
    description: str
    total_amount: float
    split_type: Literal["equal", "personal"] = "equal"


class ExpenseCreate(ExpenseBase):
    paid_by: Optional[UUID] = None


class ExpenseResponse(ExpenseBase):
    id: UUID
    hangout_id: UUID
    paid_by: UUID
    created_at: datetime
    payer: Optional[ProfileResponse] = None

    model_config = ConfigDict(from_attributes=True)


class MemberBalanceResponse(BaseModel):
    user_id: UUID
    profile: Optional[ProfileResponse] = None
    total_paid: float
    total_paid_equal: float = 0.0
    net_balance: float
    owes: float
    is_owed: float

    model_config = ConfigDict(from_attributes=True)


class SettlementDebtResponse(BaseModel):
    from_user_id: UUID
    from_user: Optional[ProfileResponse] = None
    to_user_id: UUID
    to_user: Optional[ProfileResponse] = None
    amount: float

    model_config = ConfigDict(from_attributes=True)


class ExpenseSummaryResponse(BaseModel):
    hangout_id: UUID
    total_expenses: float
    expense_count: int
    equal_split_total: float
    per_person_share: float
    participant_count: int
    member_balances: List[MemberBalanceResponse]
    simplified_debts: List[SettlementDebtResponse]

    model_config = ConfigDict(from_attributes=True)
