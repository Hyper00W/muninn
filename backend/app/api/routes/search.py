from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.api.deps import ensure_document_exists
from app.db.database import get_db
from app.schemas.search import SearchRequest, SearchResponse, SearchResult
from app.services.retrieval import search

router = APIRouter(prefix="/search", tags=["Search"])


@router.post("", response_model=SearchResponse)
def semantic_search(request: SearchRequest, db: Session = Depends(get_db)):
    """
    Semantic search over ingested document chunks.
    Returns the top-K most relevant evidence passages without calling the LLM.
    """
    if request.document_id is not None:
        ensure_document_exists(request.document_id, db)

    results = search(
        query=request.query,
        db=db,
        top_k=request.top_k,
        document_id=request.document_id,
    )

    return SearchResponse(
        results=[SearchResult(**r) for r in results],
        total=len(results),
    )
