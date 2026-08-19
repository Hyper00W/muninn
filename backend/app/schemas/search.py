from pydantic import BaseModel, Field


class SearchRequest(BaseModel):
    query: str = Field(..., min_length=1)
    top_k: int | None = Field(None, ge=1, le=50)
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
