from datetime import datetime, date, time, timezone
from typing import Optional, List
from uuid import UUID, uuid4
from sqlalchemy import (
    String,
    Text,
    Date,
    Time,
    DateTime,
    Numeric,
    SmallInteger,
    ForeignKey,
    UniqueConstraint,
    CheckConstraint,
)
from sqlalchemy.dialects.postgresql import UUID as PG_UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.core.database import Base


class Hangout(Base):
    __tablename__ = "hangouts"

    id: Mapped[UUID] = mapped_column(
        PG_UUID(as_uuid=True),
        primary_key=True,
        default=uuid4,
    )
    group_id: Mapped[Optional[UUID]] = mapped_column(
        PG_UUID(as_uuid=True),
        ForeignKey("groups.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    hangout_date: Mapped[date] = mapped_column(Date, nullable=False, index=True)
    hangout_time: Mapped[Optional[time]] = mapped_column(Time, nullable=True)
    location_name: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    formatted_address: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    place_id: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    latitude: Mapped[Optional[float]] = mapped_column(Numeric(9, 6), nullable=True)
    longitude: Mapped[Optional[float]] = mapped_column(Numeric(9, 6), nullable=True)
    cover_photo_url: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    external_album_url: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    invite_code: Mapped[Optional[str]] = mapped_column(
        String(64),
        unique=True,
        nullable=True,
        index=True,
    )
    short_id: Mapped[Optional[str]] = mapped_column(
        String(16),
        unique=True,
        nullable=True,
        index=True,
    )
    created_by: Mapped[UUID] = mapped_column(
        PG_UUID(as_uuid=True),
        ForeignKey("profiles.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
        nullable=False,
    )

    # Relationships
    group: Mapped[Optional["Group"]] = relationship("Group", back_populates="hangouts")
    creator: Mapped["Profile"] = relationship("Profile", foreign_keys=[created_by])
    participants: Mapped[List["HangoutParticipant"]] = relationship(
        "HangoutParticipant",
        back_populates="hangout",
        cascade="all, delete-orphan",
    )
    media_items: Mapped[List["Media"]] = relationship(
        "Media",
        back_populates="hangout",
        cascade="all, delete-orphan",
    )
    notes: Mapped[List["Note"]] = relationship(
        "Note",
        back_populates="hangout",
        cascade="all, delete-orphan",
    )
    expenses: Mapped[List["Expense"]] = relationship(
        "Expense",
        back_populates="hangout",
        cascade="all, delete-orphan",
    )
    ratings: Mapped[List["HangoutRating"]] = relationship(
        "HangoutRating",
        back_populates="hangout",
        cascade="all, delete-orphan",
    )


class HangoutParticipant(Base):
    __tablename__ = "hangout_participants"
    __table_args__ = (
        UniqueConstraint("hangout_id", "user_id", name="unique_hangout_participant"),
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
    user_id: Mapped[UUID] = mapped_column(
        PG_UUID(as_uuid=True),
        ForeignKey("profiles.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    # Relationships
    hangout: Mapped["Hangout"] = relationship("Hangout", back_populates="participants")
    user: Mapped["Profile"] = relationship("Profile", back_populates="hangout_participations")


class HangoutRating(Base):
    __tablename__ = "hangout_ratings"
    __table_args__ = (
        UniqueConstraint("hangout_id", "user_id", name="unique_hangout_user_rating"),
        CheckConstraint("rating >= 1 AND rating <= 5", name="check_rating_range"),
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
    user_id: Mapped[UUID] = mapped_column(
        PG_UUID(as_uuid=True),
        ForeignKey("profiles.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    rating: Mapped[int] = mapped_column(SmallInteger, nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
        nullable=False,
    )

    # Relationships
    hangout: Mapped["Hangout"] = relationship("Hangout", back_populates="ratings")
    user: Mapped["Profile"] = relationship("Profile")
