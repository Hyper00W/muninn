from datetime import datetime

from sqlalchemy import DateTime, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base


class Document(Base):
    __tablename__ = "documents"

    id: Mapped[int] = mapped_column(
        primary_key=True,
        autoincrement=True
    )

    filename: Mapped[str] = mapped_column(
        String(255),
        nullable=False
    )

    document_type: Mapped[str | None] = mapped_column(
        String(50),
        nullable=True
    )

    company: Mapped[str | None] = mapped_column(
        String(255),
        nullable=True
    )

    file_path: Mapped[str] = mapped_column(
        Text,
        nullable=False
    )

    page_count: Mapped[int | None] = mapped_column(
        Integer,
        nullable=True
    )

    status: Mapped[str] = mapped_column(
        String(50),
        nullable=False,
        default="uploaded"
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=datetime.utcnow,
        nullable=False
    )   