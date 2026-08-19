from pathlib import Path

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.models.document import Document
from app.models.document_chunk import DocumentChunk
from app.models.document_page import DocumentPage
from app.schemas.document import DocumentResponse, IngestResponse
from app.services.chunking import chunk_page
from app.services.embeddings import embed_texts
from app.services.pdf_parser import extract_text_from_pdf

router = APIRouter(prefix="/documents", tags=["Documents"])

STORAGE_DIR = Path("storage")
STORAGE_DIR.mkdir(exist_ok=True)


# ---------------------------------------------------------------------------
# Upload
# ---------------------------------------------------------------------------

@router.post("/upload", response_model=DocumentResponse)
async def upload_document(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
):
    """
    Upload a PDF, persist it to storage, extract pages, and store DocumentPage rows.
    Status is set to 'uploaded'. Call POST /documents/{id}/ingest to chunk and embed.
    """
    file_path = STORAGE_DIR / file.filename

    # --- Save file ---
    with file_path.open("wb") as buf:
        while chunk := await file.read(1024 * 1024):
            buf.write(chunk)

    # --- Parse PDF ---
    try:
        pages = extract_text_from_pdf(str(file_path))
    except Exception as exc:
        raise HTTPException(status_code=422, detail=f"Failed to parse PDF: {exc}")

    # --- Create Document record ---
    document = Document(
        filename=file.filename,
        file_path=str(file_path),
        page_count=len(pages),
        status="uploaded",
    )
    db.add(document)
    db.flush()  # get document.id before creating pages

    # --- Persist one DocumentPage per page ---
    for page_data in pages:
        page = DocumentPage(
            document_id=document.id,
            page_number=page_data["page_number"],
            text=page_data["text"] or "",  # store empty string for image-only pages
        )
        db.add(page)

    db.commit()
    db.refresh(document)

    return document


# ---------------------------------------------------------------------------
# List / Get
# ---------------------------------------------------------------------------

@router.get("", response_model=list[DocumentResponse])
def list_documents(db: Session = Depends(get_db)):
    """List all documents ordered by most recent first."""
    return db.query(Document).order_by(Document.created_at.desc()).all()


@router.get("/{document_id}", response_model=DocumentResponse)
def get_document(document_id: int, db: Session = Depends(get_db)):
    """Get a single document by ID."""
    doc = db.query(Document).filter(Document.id == document_id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")
    return doc


# ---------------------------------------------------------------------------
# Ingest  (chunking + embedding)
# ---------------------------------------------------------------------------

@router.post("/{document_id}/ingest", response_model=IngestResponse)
def ingest_document(document_id: int, db: Session = Depends(get_db)):
    """
    Chunk and embed all pages of a document.

    Pipeline:
        DocumentPage rows
            → recursive text chunker
            → sentence-transformers embeddings (batch)
            → DocumentChunk rows (content + embedding stored)

    Status transitions: uploaded → processing → processed | failed
    Re-ingestion is supported: existing chunks are deleted first.
    """
    document = db.query(Document).filter(Document.id == document_id).first()
    if not document:
        raise HTTPException(status_code=404, detail="Document not found")

    if document.status == "processing":
        raise HTTPException(status_code=409, detail="Document is already being processed")

    # Delete any previously created chunks to allow clean re-ingestion
    db.query(DocumentChunk).filter(DocumentChunk.document_id == document_id).delete()

    document.status = "processing"
    db.commit()

    try:
        pages = (
            db.query(DocumentPage)
            .filter(DocumentPage.document_id == document_id)
            .order_by(DocumentPage.page_number)
            .all()
        )

        if not pages:
            document.status = "failed"
            db.commit()
            raise HTTPException(
                status_code=400,
                detail="No pages found. Ensure the document was uploaded successfully.",
            )

        # --- Chunk all pages ---
        all_chunk_data: list[dict] = []
        for page in pages:
            if not page.text.strip():
                continue  # skip blank/image-only pages gracefully
            chunks = chunk_page(
                text=page.text,
                document_id=document_id,
                page_id=page.id,
                page_number=page.page_number,
            )
            all_chunk_data.extend(chunks)

        if not all_chunk_data:
            document.status = "failed"
            db.commit()
            raise HTTPException(
                status_code=400,
                detail="No text content extracted from document pages.",
            )

        # --- Batch embed all chunk contents in one call ---
        contents = [c["content"] for c in all_chunk_data]
        embeddings = embed_texts(contents)

        # --- Bulk insert DocumentChunk records with embeddings ---
        chunk_records = [
            DocumentChunk(
                document_id=c["document_id"],
                page_id=c["page_id"],
                page_number=c["page_number"],
                content=c["content"],
                chunk_index=c["chunk_index"],
                embedding=emb,
            )
            for c, emb in zip(all_chunk_data, embeddings)
        ]
        db.add_all(chunk_records)

        document.status = "processed"
        db.commit()

        return IngestResponse(
            document_id=document_id,
            status="processed",
            chunks_created=len(chunk_records),
        )

    except HTTPException:
        raise
    except Exception as exc:
        db.rollback()
        document.status = "failed"
        db.commit()
        raise HTTPException(status_code=500, detail=f"Ingestion failed: {exc}")
