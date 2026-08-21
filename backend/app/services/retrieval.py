import torch

from rank_bm25 import BM25Okapi
from sentence_transformers import util
from sqlalchemy.orm import Session
from app.services.reranker import rerank

from app.core.config import settings
from app.models.document import Document
from app.models.document_chunk import DocumentChunk
from app.services.embeddings import embed_query


def _tokenize(text: str) -> list[str]:
    return text.lower().split()


def search(
    query: str,
    db: Session,
    top_k: int | None = None,
    document_id: int | None = None,
) -> list[dict]:
    """
    Hybrid retrieval:
    - Dense retrieval using sentence-transformers
    - Lexical retrieval using BM25
    - Reciprocal Rank Fusion (RRF)
    """

    top_k = top_k or settings.retrieval_top_k
    candidate_k = max(top_k * 4, 20)

    # ---------------------------------------------------------
    # 1. Fetch candidate chunks
    # ---------------------------------------------------------

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

    chunks = [chunk for chunk, _ in rows]
    filenames = [filename for _, filename in rows]

    # ---------------------------------------------------------
    # 2. Dense semantic retrieval
    # ---------------------------------------------------------

    query_embedding = torch.tensor(
    embed_query(query),
    dtype=torch.float32
    )

    candidate_embeddings = torch.tensor(
    [chunk.embedding for chunk in chunks],
    dtype=torch.float32
    )

    dense_hits = util.semantic_search(
        query_embedding,
        candidate_embeddings,
        top_k=len(candidate_embeddings),
    )[0]

    dense_rank = {
        hit["corpus_id"]: rank
        for rank, hit in enumerate(dense_hits, start=1)
    }

    dense_scores = {
        hit["corpus_id"]: float(hit["score"])
        for hit in dense_hits
    }

    # ---------------------------------------------------------
    # 3. BM25 lexical retrieval
    # ---------------------------------------------------------

    corpus = [
        _tokenize(chunk.content)
        for chunk in chunks
    ]

    bm25 = BM25Okapi(corpus)

    query_tokens = _tokenize(query)

    bm25_scores_raw = bm25.get_scores(query_tokens)

    bm25_ranked = sorted(
        range(len(bm25_scores_raw)),
        key=lambda i: bm25_scores_raw[i],
        reverse=True,
    )

    bm25_rank = {
        corpus_index: rank
        for rank, corpus_index in enumerate(bm25_ranked, start=1)
    }

    # ---------------------------------------------------------
    # 4. Reciprocal Rank Fusion
    # ---------------------------------------------------------

    rrf_k = 60

    fused_scores = {}

    for corpus_index in range(len(chunks)):
        score = 0.0

        if corpus_index in dense_rank:
            score += 1 / (
                rrf_k + dense_rank[corpus_index]
            )

        if corpus_index in bm25_rank:
            score += 1 / (
                rrf_k + bm25_rank[corpus_index]
            )

        fused_scores[corpus_index] = score

    # ---------------------------------------------------------
    # 5. Rank final results
    # ---------------------------------------------------------

    ranked_indices = sorted(
        fused_scores,
        key=fused_scores.get,
        reverse=True,
    )

    ranked_indices = ranked_indices[:candidate_k]

    # ---------------------------------------------------------
    # 6. Build API response
    # ---------------------------------------------------------

    results = []

    for corpus_index in ranked_indices:
        chunk = chunks[corpus_index]
        filename = filenames[corpus_index]

        results.append(
            {
                "chunk_id": chunk.id,
                "content": chunk.content,
                "document_id": chunk.document_id,
                "filename": filename,
                "page_number": chunk.page_number,
                "score": round(
                    dense_scores.get(corpus_index, 0.0),
                    4,
                ),
                "hybrid_score": round(
                    fused_scores[corpus_index],
                    6,
                ),
            }
        )

# Rerank    the hybrid candidate pool
    reranked_results = rerank(
        query=query,
        documents=results,
    )

    # Return only the final requested number of chunks
    return reranked_results[:top_k]