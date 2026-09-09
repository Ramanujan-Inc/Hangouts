from datetime import datetime, timezone
from typing import Optional, List
from uuid import UUID, uuid4
from sqlalchemy import (
    String,
    Text,
    DateTime,
    Boolean,
    BigInteger,
    Integer,
    ForeignKey,
    UniqueConstraint,
    CheckConstraint,
)
from sqlalchemy.dialects.postgresql import UUID as PG_UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.core.database import Base


class Media(Base):
    __tablename__ = "media"
    __table_args__ = (
        CheckConstraint("media_type IN ('photo', 'video')", name="check_media_type"),
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
    uploaded_by: Mapped[UUID] = mapped_column(
        PG_UUID(as_uuid=True),
        ForeignKey("profiles.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    url: Mapped[str] = mapped_column(Text, nullable=False)
    thumbnail_url: Mapped[str] = mapped_column(Text, nullable=False)
    caption: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    media_type: Mapped[str] = mapped_column(String(20), default="photo", nullable=False)
    favorites_count: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    file_size_bytes: Mapped[int] = mapped_column(BigInteger, default=0, nullable=False)
    is_shared: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    is_cover: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )

    # Relationships
    hangout: Mapped["Hangout"] = relationship("Hangout", back_populates="media_items")
    uploader: Mapped["Profile"] = relationship("Profile", foreign_keys=[uploaded_by])
    favorites: Mapped[List["MediaFavorite"]] = relationship(
        "MediaFavorite",
        back_populates="media",
        cascade="all, delete-orphan",
    )


class MediaFavorite(Base):
    __tablename__ = "media_favorites"
    __table_args__ = (
        UniqueConstraint("media_id", "user_id", name="unique_media_user_favorite"),
    )

    id: Mapped[UUID] = mapped_column(
        PG_UUID(as_uuid=True),
        primary_key=True,
        default=uuid4,
    )
    media_id: Mapped[UUID] = mapped_column(
        PG_UUID(as_uuid=True),
        ForeignKey("media.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    user_id: Mapped[UUID] = mapped_column(
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

    # Relationships
    media: Mapped["Media"] = relationship("Media", back_populates="favorites")
    user: Mapped["Profile"] = relationship("Profile", foreign_keys=[user_id])
