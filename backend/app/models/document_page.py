from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, Integer, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base


class DocumentPage(Base):
    __tablename__ = "document_pages"

    id: Mapped[int] = mapped_column(
        primary_key=True,
        autoincrement=True
    )

    document_id: Mapped[int] = mapped_column(
        ForeignKey("documents.id", ondelete="CASCADE"),
        nullable=False
    )

    page_number: Mapped[int] = mapped_column(
        Integer,
        nullable=False
    )

    text: Mapped[str] = mapped_column(
        Text,
        nullable=False
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=datetime.utcnow,
        nullable=False
    )