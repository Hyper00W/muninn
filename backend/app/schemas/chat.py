from pydantic import BaseModel, Field


class ChatRequest(BaseModel):
    question: str = Field(..., min_length=1)
    top_k: int | None = Field(None, ge=1, le=50)
    document_id: int | None = None


class SourceCitation(BaseModel):
    document_id: int
    filename: str
    page_number: int
    chunk_id: int


class EvidenceItem(BaseModel):
    chunk_id: int
    content: str
    document_id: int
    filename: str
    page_number: int
    score: float


class ChatResponse(BaseModel):
    question: str
    answer: str
    sources: list[SourceCitation]
    retrieved_evidence: list[EvidenceItem]
