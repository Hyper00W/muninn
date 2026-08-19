# 🐦 MUNINN

### AI Due Diligence Copilot

> Turn large corporate documents into grounded, traceable intelligence.

MUNINN is an AI-powered due diligence workspace built around retrieval-augmented generation. It ingests corporate PDFs, retrieves the passages that matter, and returns answers that can be traced back to page-level evidence.

**Status: Initial Working Prototype / RAG MVP** — not production infrastructure.

[Overview](#overview) · [Why](#why-muninn) · [Prototype](#current-prototype) · [Demo](#demo) · [Features](#key-features) · [Architecture](#architecture) · [Tech Stack](#tech-stack) · [Pipeline](#rag-pipeline) · [Frontend](#frontend) · [Backend](#backend--api) · [Getting Started](#getting-started) · [Roadmap](#roadmap)

[![Python](https://img.shields.io/badge/Python-3.12-111111?style=flat-square&logo=python&logoColor=white)](https://www.python.org)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.115+-111111?style=flat-square&logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-ARRAY(Float)-111111?style=flat-square&logo=postgresql&logoColor=white)](https://www.postgresql.org)
[![Next.js](https://img.shields.io/badge/Next.js-15-111111?style=flat-square&logo=nextdotjs&logoColor=white)](https://nextjs.org)
[![Gemini](https://img.shields.io/badge/Gemini-2.5%20Flash-111111?style=flat-square&logo=googlegemini&logoColor=white)](https://ai.google.dev)
[![Embeddings](https://img.shields.io/badge/Embeddings-all--MiniLM--L6--v2-111111?style=flat-square)](https://huggingface.co/sentence-transformers/all-MiniLM-L6-v2)

---

## Overview

Corporate filings are long, dense, and easy to misread. Keyword search dumps the work on the analyst. Generic chat can answer without showing its sources.

MUNINN is built around one rule:

**Answer + Evidence.**

Ask a question about a filing. Retrieve the most similar passages. Generate with Gemini under grounding constraints. Attach page citations from chunk metadata — not from the model’s prose.

This repository is the first public checkpoint of that loop: ingestion, retrieval, grounded generation, and a workspace UI.

---

## Why MUNINN

Large annual reports hide risk language, financial detail, and caveats across hundreds of pages. Finding the right paragraph is slow. Trusting an uncited summary is worse.

MUNINN is being built so an answer is inspectable: the passage, the page, the score, the document.

That is the current prototype’s job. Broader due-diligence intelligence — risk scoring, contradiction detection, multi-document comparison — is planned, not implemented.

---

## Current Prototype

Validated against the **NVIDIA 2025 Annual Report** as the primary development document.

| | |
| :--- | :--- |
| Pages extracted | 181 |
| Chunks created | 1,007 |
| Embeddings | 1,007 × 384-d (`all-MiniLM-L6-v2`) |
| Storage | PostgreSQL `ARRAY(Float)` |
| Retrieval | Cosine similarity (NumPy) |
| Generation | Gemini (`gemini-2.5-flash`) |
| Citations | Page number, document, chunk id |
| Filter | Optional `document_id` on `/search` and `/chat` |

The PDF is **not** in this repository (size and licensing). Provide your own filing. Place it via the upload API or UI; the backend writes files under `backend/storage/` (gitignored).

---

## Demo

[▶ Watch the MUNINN demo](#)

Demonstrated path:

1. Select a processed document in the workspace.
2. Ask a question.
3. Embed the query and retrieve top-K chunks.
4. Generate a grounded answer from those chunks.
5. Show source pages and evidence excerpts.

---

## Key Features

### Document intelligence

- PDF upload and local storage
- Page-level text extraction (PyMuPDF)
- Document metadata and status (`uploaded` → `processing` → `processed` | `failed`)
- Re-ingest (existing chunks deleted first)

### Retrieval

- Recursive chunking (size 800, overlap 100; paragraph/sentence splits)
- Dense embeddings (`sentence-transformers` / `all-MiniLM-L6-v2`)
- Cosine similarity over stored vectors
- Optional document-level filter

### Grounded generation

- Gemini responses from retrieved excerpts only
- Prompt constraints: no invented figures; admit insufficient evidence
- Citations assembled from retrieval metadata, not LLM output

### Evidence

- Page numbers on every chunk
- Filename and document id
- Relevance scores
- Excerpt text in `/search` and `/chat`

### Workspace

- Raven / MUNINN identity, black–graphite–white UI
- Document sidebar and recent documents
- Chat thread with source chips
- Evidence panel and chat history
- Processing bar and statue/halo animation during `/chat`

---

## Architecture

Retrieval is **not** pgvector. Vectors live as PostgreSQL float arrays; ranking is in-process NumPy cosine similarity.

```mermaid
flowchart LR
    PDF[PDF] --> PARSE[PyMuPDF]
    PARSE --> PAGES[Document pages]
    PAGES --> CHUNK[Recursive chunking]
    CHUNK --> EMB[all-MiniLM-L6-v2]
    EMB --> DB[(PostgreSQL ARRAY Float)]

    Q[Question] --> QE[Query embedding]
    QE --> SIM[Cosine similarity]
    DB --> SIM
    SIM --> EV[Top-K evidence]
    EV --> GEM[Gemini]
    GEM --> ANS[Grounded answer]
    EV --> CITE[Page citations]
    ANS --> UI[MUNINN workspace]
    CITE --> UI
```

---

## Tech Stack

| Layer | Technology | Purpose |
| :--- | :--- | :--- |
| Frontend | Next.js 15, React 19, TypeScript | Workspace UI |
| Styling | Tailwind CSS | Graphite / black / white system |
| Motion | Framer Motion | Statue / processing motion |
| API | FastAPI, Uvicorn | REST surface |
| Config | Pydantic Settings | Environment loading |
| Database | PostgreSQL, SQLAlchemy 2, Alembic | Documents, pages, chunks, vectors |
| Parsing | PyMuPDF | Page text extraction |
| Embeddings | Sentence Transformers, `all-MiniLM-L6-v2` | 384-d dense vectors |
| Retrieval | NumPy | Cosine similarity ranking |
| LLM | `google-generativeai`, Gemini 2.5 Flash | Grounded generation |

---

## RAG Pipeline

### Ingestion

PDF → extract pages → `documents` + `document_pages` → recursive chunks (page number preserved) → batch embed → `document_chunks.embedding`.

Page metadata is denormalized onto each chunk so citations do not depend on the model inventing a page number.

### Query

Question → query embedding → cosine similarity (optionally one `document_id`) → top-K chunks → Gemini with excerpt context → answer + structured sources from those chunks.

If retrieval returns nothing, the API does not call Gemini; it returns an insufficient-evidence message.

---

## Frontend

The UI is a three-column workspace: document nav, chat, evidence.

- Identity: raven mark, restrained typography, graphite surfaces
- Workspace: current question, MUNINN answer, page source chips
- Evidence: page, relevance score, excerpt, filename; chat history tab
- Presence: Greek statue with a light halo pulse while `/chat` is in flight
- Also: Documents, Search, Settings (API health)

Default API base: `http://localhost:8000` (`NEXT_PUBLIC_API_URL`).

---

## Backend & API

FastAPI app: `backend/app/main.py`. Interactive docs: `http://localhost:8000/docs`.

| Method | Path | Role |
| :--- | :--- | :--- |
| `GET` | `/health` | `{ "status": "healthy", "service": "muninn" }` |
| `GET` | `/documents` | List documents (newest first) |
| `GET` | `/documents/{id}` | Single document metadata |
| `POST` | `/documents/upload` | Upload PDF, extract pages, status `uploaded` |
| `POST` | `/documents/{id}/ingest` | Chunk + embed → `processed` |
| `POST` | `/search` | Semantic retrieval only |
| `POST` | `/chat` | Retrieve + Gemini + citations |

### `POST /search`

```json
{
  "query": "What were NVIDIA's major risks in fiscal 2025?",
  "document_id": 1,
  "top_k": 5
}
```

`document_id` and `top_k` are optional. `top_k` defaults from `RETRIEVAL_TOP_K` (max 50).

Response: `{ "results": [ { "chunk_id", "content", "document_id", "filename", "page_number", "score" } ], "total": n }`.

### `POST /chat`

```json
{
  "question": "What were NVIDIA's major risks in fiscal 2025?",
  "document_id": 1,
  "top_k": 5
}
```

Response: `{ "question", "answer", "sources": [ { "document_id", "filename", "page_number", "chunk_id" } ], "retrieved_evidence": [ ...same fields as search hits... ] }`.

Sources are unique by `(document_id, page_number)` from retrieved chunks.

---

## Project Structure

```
muninn/
├── backend/
│   ├── app/
│   │   ├── api/routes/      # health, documents, search, chat
│   │   ├── core/            # settings
│   │   ├── db/              # engine, session
│   │   ├── models/          # documents, pages, chunks
│   │   ├── schemas/         # Pydantic request/response
│   │   └── services/        # parse, chunk, embed, retrieve, LLM
│   ├── alembic/versions/
│   ├── storage/             # local PDFs (gitignored)
│   ├── .env.example
│   └── requirements.txt
├── frontend/
│   ├── src/app/             # workspace, documents, search, settings
│   ├── src/components/      # shell, chat, evidence, statue
│   ├── src/context/         # MuninnContext
│   ├── src/lib/             # API client + types
│   └── public/images/
└── README.md
```

---

## Getting Started

### Prerequisites

- Python 3.12+
- PostgreSQL
- Node.js 18+ (frontend)
- A Gemini API key

Create the database (example):

```sql
CREATE DATABASE muninn;
```

### Backend

```bash
cd backend
cp .env.example .env
```

Edit `.env` (see below). Then:

```bash
python -m venv .venv
# Windows:
.venv\Scripts\activate
# macOS / Linux:
source .venv/bin/activate

pip install -r requirements.txt
alembic upgrade head
uvicorn app.main:app --reload --port 8000
```

Upload a PDF (`POST /documents/upload` or the workspace **Upload** control), then ingest (`POST /documents/{id}/ingest` or the UI ingest action). Files land in `backend/storage/`.

### Frontend

```bash
cd frontend
cp .env.local.example .env.local
npm install
npm run dev
```

Workspace: `http://localhost:3000`. Point `NEXT_PUBLIC_API_URL` at the API if it is not `http://localhost:8000`. `CORS_ORIGINS` on the backend must include the frontend origin (`http://localhost:3000` is in the example).

---

## Environment Variables

From `backend/.env.example` — never commit real values.

```env
DATABASE_URL=postgresql://postgres:password@localhost:5432/muninn
GEMINI_API_KEY=your_gemini_api_key_here
GEMINI_MODEL=gemini-2.5-flash
EMBEDDING_MODEL=all-MiniLM-L6-v2
CHUNK_SIZE=800
CHUNK_OVERLAP=100
RETRIEVAL_TOP_K=5
CORS_ORIGINS=http://localhost:5173,http://localhost:3000
```

Frontend (`frontend/.env.local.example`):

```env
NEXT_PUBLIC_API_URL=http://localhost:8000
```

---

## Roadmap

Future work. Unchecked items are **not** in this prototype.

### Phase 1 — RAG foundation

- [x] PDF ingestion and page extraction
- [x] Recursive chunking
- [x] Dense embeddings
- [x] Semantic cosine retrieval
- [x] Gemini grounding
- [x] Page-level citations
- [x] Workspace UI wired to `/chat` and `/search`

### Phase 2 — Retrieval intelligence

- [ ] Retrieval evaluation
- [ ] Improved query handling
- [ ] Hybrid retrieval
- [ ] Reranking
- [ ] Better evidence selection

### Phase 3 — Due diligence intelligence

- [ ] Risk extraction
- [ ] Financial analysis
- [ ] Contradiction detection
- [ ] Key finding extraction
- [ ] Structured company insights

### Phase 4 — Multi-document intelligence

- [ ] Compare documents
- [ ] Cross-document reasoning
- [ ] Company / document relationships
- [ ] Historical comparison

### Phase 5 — Intelligence workspace

- [ ] Automated due-diligence reports
- [ ] Investigation workflows
- [ ] Deeper evidence exploration
- [ ] Advanced analysis tools

---

## Engineering Notes

- Retrieval is dense cosine similarity only; all matching chunks are loaded into memory for scoring.
- There is no ANN index, no BM25, no reranker.
- Quality is still being improved; NVIDIA’s 2025 annual report is the main validation set.
- Grounding is prompt-level plus citation-from-metadata. It reduces fabrication of sources; it does not make the model infallible.
- `debug` defaults to `true` in settings. This is a local prototype, not a hardened service.

---

## Security

- `.env` and `.env.*` are gitignored (`.env.example` files are tracked).
- `backend/storage/`, `*.pdf`, `.venv/`, `node_modules/`, and `.next/` are ignored.
- Do not commit API keys, database passwords, or filings.
- Bring your own `GEMINI_API_KEY` and PostgreSQL credentials.

---

## Contributing

The project is moving quickly through prototype phases. Small, focused changes against the current RAG + workspace loop are easier to review than large speculative features. Open an issue or pull request on [Hyper00W/muninn](https://github.com/Hyper00W/muninn).

---

## License

No license file is included in this repository yet. Treat the code as source-available until a license is added.

---

> MUNINN is still at the beginning.
>
> The RAG foundation works.
> The intelligence layer comes next.

Built with Python, FastAPI, PostgreSQL, Next.js, and Gemini.
