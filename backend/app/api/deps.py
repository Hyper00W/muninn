from fastapi import HTTPException
from sqlalchemy.orm import Session

from app.models.document import Document


def ensure_document_exists(document_id: int, db: Session) -> None:
    exists = db.query(Document.id).filter(Document.id == document_id).first()
    if not exists:
        raise HTTPException(status_code=404, detail="Document not found")
