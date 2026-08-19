from datetime import datetime
from pydantic import BaseModel


class DocumentResponse(BaseModel):
    id: int
    filename: str
    document_type: str | None = None
    company: str | None = None
    page_count: int | None = None
    status: str
    created_at: datetime

    model_config = {"from_attributes": True}


class IngestResponse(BaseModel):
    document_id: int
    status: str
    chunks_created: int
