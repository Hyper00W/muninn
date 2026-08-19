from pydantic import BaseModel


class SearchRequest(BaseModel):
    query: str
    top_k: int | None = None
    document_id: int | None = None


class SearchResult(BaseModel):
    chunk_id: int
    content: str
    document_id: int
    filename: str
    page_number: int
    score: float


class SearchResponse(BaseModel):
    results: list[SearchResult]
    total: int
