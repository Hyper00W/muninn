import numpy as np
from sqlalchemy.orm import Session

from app.core.config import settings
from app.models.document import Document
from app.models.document_chunk import DocumentChunk
from app.services.embeddings import embed_query


def _cosine_similarity(a: list[float], b: list[float]) -> float:
    va = np.array(a, dtype=np.float32)
    vb = np.array(b, dtype=np.float32)
    norm_a = np.linalg.norm(va)
    norm_b = np.linalg.norm(vb)
    if norm_a == 0.0 or norm_b == 0.0:
        return 0.0
    return float(np.dot(va, vb) / (norm_a * norm_b))


def search(
    query: str,
    db: Session,
    top_k: int | None = None,
    document_id: int | None = None,
) -> list[dict]:
    """
    Semantic search over embedded DocumentChunk records.

    Steps:
      1. Embed the query with the same model used during ingestion.
      2. Fetch all chunks that have embeddings (optionally filtered by document).
      3. Compute cosine similarity in NumPy.
      4. Return top_k results sorted by score descending.

    Returns:
        List of dicts with keys:
            chunk_id, content, document_id, filename, page_number, score
    """
    top_k = top_k or settings.retrieval_top_k

    query_vec = embed_query(query)

    q = (
        db.query(DocumentChunk, Document.filename)
        .join(Document, DocumentChunk.document_id == Document.id)
        .filter(DocumentChunk.embedding.isnot(None))
    )
    if document_id is not None:
        q = q.filter(DocumentChunk.document_id == document_id)

    rows = q.all()

    if not rows:
        return []

    results = []
    for chunk, filename in rows:
        score = _cosine_similarity(query_vec, chunk.embedding)
        results.append(
            {
                "chunk_id": chunk.id,
                "content": chunk.content,
                "document_id": chunk.document_id,
                "filename": filename,
                "page_number": chunk.page_number,
                "score": round(score, 4),
            }
        )

    results.sort(key=lambda x: x["score"], reverse=True)
    return results[:top_k]
