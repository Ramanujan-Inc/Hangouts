from datetime import datetime, timezone
from typing import Optional
from uuid import UUID, uuid4
from decimal import Decimal
from sqlalchemy import (
    String,
    DateTime,
    Numeric,
    ForeignKey,
    CheckConstraint,
)
from sqlalchemy.dialects.postgresql import UUID as PG_UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.core.database import Base


class Expense(Base):
    __tablename__ = "expenses"
    __table_args__ = (
        CheckConstraint("split_type IN ('equal', 'personal')", name="check_split_type"),
    )

    id: Mapped[UUID] = mapped_column(
        PG_UUID(as_uuid=True),
        primary_key=True,
        default=uuid4,
    )
    hangout_id: Mapped[UUID] = mapped_column(
        PG_UUID(as_uuid=True),
        ForeignKey("hangouts.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    paid_by: Mapped[Optional[UUID]] = mapped_column(
        PG_UUID(as_uuid=True),
        ForeignKey("profiles.id", ondelete="CASCADE"),
        nullable=True,
        index=True,
    )
    description: Mapped[str] = mapped_column(String(255), nullable=False)
    total_amount: Mapped[Decimal] = mapped_column(Numeric(10, 2), nullable=False)
    split_type: Mapped[str] = mapped_column(String(50), default="equal", nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )

    # Relationships
    hangout: Mapped["Hangout"] = relationship("Hangout", back_populates="expenses")
    payer: Mapped[Optional["Profile"]] = relationship("Profile", foreign_keys=[paid_by])
