from pydantic import BaseModel


class ChatRequest(BaseModel):
    question: str
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
    answer: str
    sources: list[SourceCitation]
    retrieved_evidence: list[EvidenceItem]
