# MUNINN — AI Due Diligence Copilot

MUNINN is an AI Due Diligence Copilot designed to ingest complex corporate documents (such as Form 10-K filings, annual reports, and earnings reviews) and provide factually grounded answers with strict page-level source citations.

---

## RAG Architecture Pipeline

`
PDF Document
    │
    ▼
Document Entity (Status: uploaded)
    │
    ▼
Page Extraction (PyMuPDF / DocumentPage records)
    │
    ▼
Recursive Chunking (DocumentChunk records preserving page_number & chunk_index)
    │
    ▼
Dense Embeddings (Sentence Transformers: all-MiniLM-L6-v2)
    │
    ▼
Vector Retrieval (Cosine similarity over vector embeddings)
    │
    ▼
Context Construction (Ranked evidence blocks + page metadata)
    │
    ▼
LLM Inference (Google Gemini 1.5 Flash with strict grounding prompt)
    │
    ▼
Grounded Answer + Page Citations (Directly traceable to chunk & page metadata)
`

---

## Tech Stack

- **Framework**: FastAPI (Python 3.12)
- **Database**: PostgreSQL with SQLAlchemy 2.0 ORM
- **Migrations**: Alembic
- **PDF Extraction**: PyMuPDF (itz)
- **Embeddings**: sentence-transformers (ll-MiniLM-L6-v2, 384-dimensional dense vectors)
- **Vector Search**: In-memory cosine similarity via NumPy over PostgreSQL array vectors
- **LLM**: Google Gemini (gemini-1.5-flash via google-generativeai)
- **Configuration**: Pydantic Settings (pydantic-settings) + .env

---

## Project Structure

`
muninn/
├── backend/
│   ├── alembic/
│   │   ├── versions/
│   │   │   ├── e65c259b6812_create_documents_table.py
│   │   │   ├── 0bd3f967a037_create_document_pages_table.py
│   │   │   └── 3f8a92c1b4d6_create_document_chunks_table.py
│   │   └── env.py
│   ├── app/
│   │   ├── api/
│   │   │   └── routes/
│   │   │       ├── health.py        # GET /health
│   │   │       ├── document.py      # POST /documents/upload, GET /documents, POST /documents/{id}/ingest
│   │   │       ├── search.py        # POST /search
│   │   │       └── chat.py          # POST /chat
│   │   ├── core/
│   │   │   └── config.py            # Environment-driven settings
│   │   ├── db/
│   │   │   ├── base.py              # DeclarativeBase
│   │   │   └── database.py          # SQLAlchemy SessionLocal & engine
│   │   ├── models/
│   │   │   ├── document.py          # Document model
│   │   │   ├── document_page.py     # DocumentPage model
│   │   │   └── document_chunk.py    # DocumentChunk model (with embedding array)
│   │   ├── schemas/
│   │   │   ├── document.py          # Document request/response schemas
│   │   │   ├── search.py            # Semantic search schemas
│   │   │   └── chat.py              # RAG chat & citation schemas
│   │   ├── services/
│   │   │   ├── pdf_parser.py        # Page-by-page text extraction
│   │   │   ├── chunking.py          # Recursive text splitter preserving page boundaries
│   │   │   ├── embeddings.py        # Sentence-transformers singleton
│   │   │   ├── retrieval.py         # Vector similarity search over chunks
│   │   │   └── llm.py               # Gemini prompt orchestration & grounding
│   │   └── main.py                  # FastAPI application entrypoint
│   ├── storage/                     # Local document storage (gitignored)
│   ├── .env.example                 # Example environment variables
│   ├── alembic.ini                  # Alembic configuration
│   └── requirements.txt             # Python dependencies
├── .gitignore
└── README.md
`

---

## Database Architecture

The relational schema ensures strict traceability from generated answer back to the exact PDF page:

1. **documents**: Tracks document metadata, local file path, page count, and status (uploaded, processing, processed, ailed).
2. **document_pages**: Foreign key to documents.id. Stores raw text extracted per page with exact page_number.
3. **document_chunks**: Foreign key to documents.id and document_pages.id. Stores chunked text, chunk_index, denormalized page_number, and vector embedding (ARRAY(Float)).

---

## API Endpoints

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| GET | /health | Service health status check. |
| POST | /documents/upload | Uploads PDF, saves file to storage, extracts pages, persists Document and DocumentPage records (status: uploaded). |
| GET | /documents | Lists all documents and their processing status. |
| GET | /documents/{id} | Retrieves a single document by ID. |
| POST | /documents/{id}/ingest | Triggers chunking, generates embeddings, and persists DocumentChunk records (status: processed). |
| POST | /search | Performs semantic search across embedded chunks; returns ranked passages with page citations (no LLM call). |
| POST | /chat | Executes the full RAG pipeline: retrieves top-K chunks, queries Gemini with strict grounding, and returns grounded answer with structured page citations. |

---

## Local Development Setup

### 1. Prerequisites
- Python 3.12+
- PostgreSQL instance running locally

### 2. Configure Environment
Create ackend/.env based on ackend/.env.example:

`ash
DATABASE_URL=postgresql://postgres:password@localhost:5432/muninn
GEMINI_API_KEY=your_gemini_api_key_here
GEMINI_MODEL=gemini-1.5-flash
EMBEDDING_MODEL=all-MiniLM-L6-v2
CHUNK_SIZE=800
CHUNK_OVERLAP=100
RETRIEVAL_TOP_K=5
`

### 3. Install Dependencies
`ash
cd backend
python -m venv .venv
# On Windows:
.venv\Scripts\activate
# On Linux/macOS:
source .venv/bin/activate

pip install -r requirements.txt
`

### 4. Apply Database Migrations
`ash
alembic upgrade head
`

### 5. Start the API Server
`ash
uvicorn app.main:app --reload --port 8000
`

Interactive API docs will be available at http://localhost:8000/docs.

---

## Primary Development Document

The primary development test document is the **NVIDIA 2025 Annual Report / Form 10-K** (181 pages), placed in ackend/storage/NVIDIA-2025-Annual-Report.pdf. The document is kept locally and excluded from Git.

---

## Current Status (Checkpoint v0.1.0)

- [x] FastAPI skeleton, route definitions, and configuration
- [x] Database models (Document, DocumentPage, DocumentChunk) and Alembic migrations
- [x] Page-level text extraction with PyMuPDF
- [x] Page-aware recursive chunking service
- [x] Dense embedding service (sentence-transformers)
- [x] Vector retrieval service with NumPy cosine similarity
- [x] Gemini LLM integration with strict grounded prompt template
- [x] Citation generation mapped to document page metadata
- [ ] Next step: Apply pending migration in target environment, ingest NVIDIA report, and complete end-to-end integration validation.