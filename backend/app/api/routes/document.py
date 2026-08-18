from pathlib import Path

from fastapi import APIRouter, Depends, File, UploadFile
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.models.document import Document
from app.services.pdf_parser import extract_text_from_pdf

router = APIRouter(
    prefix="/documents",
    tags=["Documents"]
)

STORAGE_DIR = Path("storage")
STORAGE_DIR.mkdir(exist_ok=True)


@router.post("/upload")
async def upload_document(
    file: UploadFile = File(...),
    db: Session = Depends(get_db)
):
    file_path = STORAGE_DIR / file.filename

    with file_path.open("wb") as buffer:
        while chunk := await file.read(1024 * 1024):
            buffer.write(chunk)

    pages = extract_text_from_pdf(str(file_path))

    document = Document(
        filename=file.filename,
        file_path=str(file_path),
        page_count=len(pages),
        status="processed"
    )

    db.add(document)
    db.commit()
    db.refresh(document)

    return {
        "id": document.id,
        "filename": document.filename,
        "page_count": document.page_count,
        "status": document.status
    }