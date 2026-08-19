from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.schemas.chat import ChatRequest, ChatResponse, EvidenceItem, SourceCitation
from app.services.llm import generate_answer
from app.services.retrieval import search

router = APIRouter(prefix="/chat", tags=["Chat"])


@router.post("", response_model=ChatResponse)
def chat(request: ChatRequest, db: Session = Depends(get_db)):
    """
    Full RAG pipeline:
      1. Embed the question.
      2. Retrieve top-K evidence chunks via cosine similarity.
      3. Send question + evidence to Gemini.
      4. Return grounded answer + structured citations built from chunk metadata.

    Citations are derived from the retrieved chunk metadata, NOT from the LLM output,
    so they are always accurate regardless of what the LLM generates.
    """
    # --- Retrieve evidence ---
    evidence = search(
        query=request.question,
        db=db,
        document_id=request.document_id,
    )

    # --- Generate answer ---
    answer = generate_answer(request.question, evidence)

    # --- Build citations from retrieval metadata (not from LLM) ---
    # Deduplicate by (document_id, page_number) to avoid redundant citations
    seen: set[tuple[int, int]] = set()
    unique_sources: list[SourceCitation] = []
    for e in evidence:
        key = (e["document_id"], e["page_number"])
        if key not in seen:
            seen.add(key)
            unique_sources.append(
                SourceCitation(
                    document_id=e["document_id"],
                    filename=e["filename"],
                    page_number=e["page_number"],
                    chunk_id=e["chunk_id"],
                )
            )

    evidence_items = [
        EvidenceItem(
            chunk_id=e["chunk_id"],
            content=e["content"],
            document_id=e["document_id"],
            filename=e["filename"],
            page_number=e["page_number"],
            score=e["score"],
        )
        for e in evidence
    ]

    return ChatResponse(
        answer=answer,
        sources=unique_sources,
        retrieved_evidence=evidence_items,
    )
