# MUNINN

**AI Due Diligence Copilot**

> An evidence-grounded document analysis engine for financial filings, annual reports, and legal disclosures with strict page-level source citations.

[![Python](https://img.shields.io/badge/Python-3.12-3776AB?style=flat-square&logo=python&logoColor=white)](https://python.org)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.115+-009688?style=flat-square&logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15+-4169E1?style=flat-square&logo=postgresql&logoColor=white)](https://postgresql.org)
[![SQLAlchemy](https://img.shields.io/badge/SQLAlchemy-2.0+-D71F00?style=flat-square&logo=sqlalchemy&logoColor=white)](https://www.sqlalchemy.org)
[![Google Gemini](https://img.shields.io/badge/Google%20Gemini-2.5%20Flash-4285F4?style=flat-square&logo=google&logoColor=white)](https://ai.google.dev)
[![Sentence Transformers](https://img.shields.io/badge/Embeddings-all--MiniLM--L6--v2-FFAA00?style=flat-square)](https://huggingface.co/sentence-transformers/all-MiniLM-L6-v2)

---

## Overview

Due diligence on corporate disclosures (Form 10-K filings, annual reviews, and proxy statements) requires absolute factual precision. Standard LLMs hallucinate numbers, misquote risk factors, and lack auditability.

**MUNINN** solves this by enforcing strict page-level source traceability across an end-to-end Retrieval-Augmented Generation (RAG) architecture:
- **Zero-hallucination guardrails**: Gemini is constrained to answer solely from retrieved document passages and explicitly admits when evidence is absent.
- **Traceable citations**: Every answer links back to exact page numbers and chunk IDs extracted directly from the underlying filing.
- **Modular pipeline**: Clean separation between document storage, page extraction, recursive chunking, dense vector embeddings, vector retrieval, and LLM orchestration.

---

## Architecture

`mermaid
flowchart TD
    subgraph Ingestion["1. Document Ingestion & Extraction"]
        PDF["PDF Filing\n(e.g., NVIDIA 10-K)"] --> DOC["Document Record\n(status: uploaded)"]
        DOC --> PARSE["PyMuPDF Parser"]
        PARSE --> PAGES["DocumentPage Records\n(1 record per PDF page)"]
    end

    subgraph Indexing["2. Chunking & Dense Embeddings"]
        PAGES --> CHUNK["Recursive Text Splitter\n(chunk_size: 800, overlap: 100)"]
        CHUNK --> CHUNKS["DocumentChunk Records\n(preserves page_number & index)"]
        CHUNKS --> EMBED["Sentence Transformers\n(all-MiniLM-L6-v2)"]
        EMBED --> VECS["Dense Vector Storage\n(PostgreSQL ARRAY Float, 384-dim)"]
    end

    subgraph Retrieval["3. Semantic Search & Grounding"]
        QUERY["User Query / Question"] --> QEMBED["Query Embedding"]
        QEMBED --> RETRIEVE["Cosine Similarity Retrieval"]
        VECS --> RETRIEVE
        RETRIEVE --> EVIDENCE["Top-K Evidence Passages\n(+ Page Metadata)"]
    end

    subgraph Generation["4. LLM Response & Citations"]
        EVIDENCE --> PROMPT["Context Construction\n+ Grounding System Prompt"]
        QUERY --> PROMPT
        PROMPT --> GEMINI["Google Gemini 2.5 Flash"]
        GEMINI --> ANSWER["Factual Answer"]
        EVIDENCE --> CITE["Structured Page Citations\n(Document ID, Page #, Chunk ID)"]
    end
`

---

## Pipeline Stages

| Stage | Component | Technology | Description |
| :--- | :--- | :--- | :--- |
| **Ingestion** | outes/document.py | FastAPI, PyMuPDF | Persists PDF to local storage and creates document records. |
| **Extraction** | services/pdf_parser.py | PyMuPDF (itz) | Extracts clean raw text page-by-page, preserving physical page numbers. |
| **Chunking** | services/chunking.py | Custom Splitter | Recursively splits text along paragraph/sentence boundaries while maintaining page linkages. |
| **Embeddings** | services/embeddings.py | sentence-transformers | Generates 384-dimensional dense vectors using ll-MiniLM-L6-v2. |
| **Storage** | models/document_chunk.py | PostgreSQL, SQLAlchemy | Stores chunk text, denormalized page metadata, and vector arrays. |
| **Retrieval** | services/retrieval.py | NumPy | Computes vector cosine similarity to surface top-K relevant passages. |
| **Generation** | services/llm.py | Google Gemini 2.5 Flash | Generates strictly grounded answers from retrieved context. |
| **Citations** | outes/chat.py | Pydantic Schemas | Assembles structured source citations directly from chunk metadata. |

---

## Verified RAG MVP Benchmark

The pipeline has been verified against the **NVIDIA Corporation 2025 Annual Report / Form 10-K** (49.97 MB):

| Metric | Verified Value |
| :--- | :--- |
| **Document Size** | 181 Pages (~50 MB) |
| **Pages Extracted & Stored** | 181 DocumentPage records |
| **Chunks Generated** | 1,007 DocumentChunk records |
| **Embeddings Computed** | 1,007 dense vectors (384 dimensions) |
| **Semantic Search (/search)** | Verified (sub-second ranked retrieval) |
| **RAG Generation (/chat)** | Verified (Gemini 2.5 Flash grounded synthesis) |
| **Page Citation Accuracy** | Verified (page numbers mapped to PDF pages) |

---

## Project Structure

`
muninn/
├── backend/
│   ├── alembic/                         # Database migrations
│   │   ├── versions/
│   │   │   ├── e65c259b6812_create_documents_table.py
│   │   │   ├── 0bd3f967a037_create_document_pages_table.py
│   │   │   └── 3f8a92c1b4d6_create_document_chunks_table.py
│   │   └── env.py
│   ├── app/
│   │   ├── api/
│   │   │   └── routes/
│   │   │       ├── health.py            # GET  /health
│   │   │       ├── document.py          # POST /documents/upload, GET /documents, POST /documents/{id}/ingest
│   │   │       ├── search.py            # POST /search
│   │   │       └── chat.py              # POST /chat
│   │   ├── core/
│   │   │   └── config.py                # Pydantic Settings & environment loader
│   │   ├── db/
│   │   │   ├── base.py                  # SQLAlchemy DeclarativeBase
│   │   │   └── database.py              # Engine & SessionLocal provider
│   │   ├── models/
│   │   │   ├── document.py              # Document SQL model
│   │   │   ├── document_page.py         # DocumentPage SQL model
│   │   │   └── document_chunk.py        # DocumentChunk SQL model (with vector array)
│   │   ├── schemas/
│   │   │   ├── document.py              # Ingest & document schemas
│   │   │   ├── search.py                # Semantic search request/response schemas
│   │   │   └── chat.py                  # RAG chat request/response & citation schemas
│   │   ├── services/
│   │   │   ├── pdf_parser.py            # Page-by-page text extraction
│   │   │   ├── chunking.py              # Page-preserving recursive chunker
│   │   │   ├── embeddings.py            # Sentence Transformers singleton
│   │   │   ├── retrieval.py             # Cosine similarity vector retrieval
│   │   │   └── llm.py                   # Gemini prompt construction & generation
│   │   └── main.py                      # FastAPI application entrypoint
│   ├── storage/                         # Local document store (gitignored)
│   ├── .env.example                     # Environment template
│   ├── alembic.ini                      # Alembic configuration
│   └── requirements.txt                 # Backend dependencies
├── .gitignore
└── README.md
`

---

## Database Schema

`
┌─────────────────┐       ┌──────────────────────┐       ┌────────────────────────┐
│    documents    │       │    document_pages    │       │     document_chunks    │
├─────────────────┤       ├──────────────────────┤       ├────────────────────────┤
│ id (PK)         │───┐   │ id (PK)              │───┐   │ id (PK)                │
│ filename        │   └──>│ document_id (FK)     │   └──>│ document_id (FK)       │
│ file_path       │       │ page_number          │       │ page_id (FK)           │
│ page_count      │       │ text                 │       │ page_number            │
│ status          │       │ created_at           │       │ content                │
│ created_at      │       └──────────────────────┘       │ chunk_index            │
└─────────────────┘                                      │ embedding (Float[])    │
                                                         │ created_at             │
                                                         └────────────────────────┘
`

---

## REST API Reference

### 1. Document Management

- **POST /documents/upload**  
  Uploads a PDF filing, saves it to storage/, extracts all pages with PyMuPDF, and creates Document and DocumentPage records.
  `json
  // Response
  {
    "id": 1,
    "filename": "NVIDIA-2025-Annual-Report.pdf",
    "page_count": 181,
    "status": "uploaded",
    "created_at": "2026-08-19T04:46:28.855518"
  }
  `

- **POST /documents/{id}/ingest**  
  Splits extracted pages into chunks, generates dense embeddings, and stores vector embeddings in PostgreSQL.
  `json
  // Response
  {
    "document_id": 1,
    "status": "processed",
    "chunks_created": 1007
  }
  `

- **GET /documents** — List all uploaded documents and processing statuses.
- **GET /documents/{id}** — Retrieve a single document's metadata.

---

### 2. Semantic Search (No LLM)

- **POST /search**  
  Retrieves top-K most relevant chunks using cosine similarity.
  `json
  // Request
  {
    "query": "What were NVIDIA's major risk factors?",
    "top_k": 3
  }
  `
  `json
  // Response
  {
    "results": [
      {
        "chunk_id": 51,
        "content": "development of new products and technologies or enhancements to our existing...",
        "document_id": 1,
        "filename": "NVIDIA-2025-Annual-Report.pdf",
        "page_number": 14,
        "score": 0.6385
      }
    ],
    "total": 1
  }
  `

---

### 3. Grounded RAG Chat

- **POST /chat**  
  Executes the full RAG pipeline: retrieves evidence, constructs grounded prompt, queries Gemini 2.5 Flash, and returns answer + page citations.
  `json
  // Request
  {
    "question": "How dependent is NVIDIA on data center revenue?"
  }
  `
  `json
  // Response
  {
    "answer": "NVIDIA's revenue growth in fiscal year 2025 was led by exceptional Data Center demand for its Hopper architecture, driven by compute and networking platforms for accelerated applications such as LLMs and generative AI. Ethernet for AI (Spectrum-X) was also a key contributor...",
    "sources": [
      {
        "document_id": 1,
        "filename": "NVIDIA-2025-Annual-Report.pdf",
        "page_number": 18,
        "chunk_id": 68
      },
      {
        "document_id": 1,
        "filename": "NVIDIA-2025-Annual-Report.pdf",
        "page_number": 128,
        "chunk_id": 754
      },
      {
        "document_id": 1,
        "filename": "NVIDIA-2025-Annual-Report.pdf",
        "page_number": 171,
        "chunk_id": 978
      }
    ],
    "retrieved_evidence": [ ... ]
  }
  `

---

## Quickstart Setup

### 1. Prerequisites
- Python 3.12+
- PostgreSQL 15+

### 2. Environment Configuration
Create ackend/.env from the example template:
`ash
cp backend/.env.example backend/.env
`

Configure the following variables in ackend/.env:
`env
DATABASE_URL=postgresql://postgres:password@localhost:5432/muninn
GEMINI_API_KEY=your_gemini_api_key_here
GEMINI_MODEL=gemini-2.5-flash
EMBEDDING_MODEL=all-MiniLM-L6-v2
CHUNK_SIZE=800
CHUNK_OVERLAP=100
RETRIEVAL_TOP_K=5
`

### 3. Installation & Migrations
`ash
cd backend

# Create and activate virtual environment
python -m venv .venv
# On Windows:
.venv\Scripts\activate
# On Linux/macOS:
source .venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Run database migrations
alembic upgrade head
`

### 4. Run the API Server
`ash
uvicorn app.main:app --reload --port 8000
`

- API Docs: http://localhost:8000/docs
- Health check: http://localhost:8000/health

---

## Primary Development Document

The system is developed and benchmarked against the **NVIDIA 2025 Annual Review / Form 10-K** (181 pages), located locally at ackend/storage/NVIDIA-2025-Annual-Report.pdf (gitignored).

---

## Roadmap

- [x] Page-level text extraction with PyMuPDF
- [x] Page-aware recursive chunking
- [x] Dense vector embeddings (ll-MiniLM-L6-v2)
- [x] Cosine similarity retrieval over PostgreSQL vector arrays
- [x] Gemini 2.5 Flash grounded answer generation
- [x] Structured page citation generation
- [ ] Hybrid search (BM25 keyword search + dense vector retrieval)
- [ ] Cross-encoder re-ranking
- [ ] Multi-document workspace filtering
- [ ] Modern Next.js due diligence user interface