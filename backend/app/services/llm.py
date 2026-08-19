import os
import certifi

os.environ.setdefault("REQUESTS_CA_BUNDLE", certifi.where())
os.environ.setdefault("SSL_CERT_FILE", certifi.where())
os.environ.setdefault("GRPC_DEFAULT_SSL_ROOTS_FILE_PATH", certifi.where())

try:
    import truststore
    truststore.inject_into_ssl()
except Exception:
    pass

import google.generativeai as genai

from app.core.config import settings

# Lazy singleton
_model = None


def _get_model():
    global _model
    if _model is None:
        genai.configure(api_key=settings.gemini_api_key, transport="rest")
        _model = genai.GenerativeModel(settings.gemini_model)
    return _model


def _build_context(evidence: list[dict]) -> str:
    """Format retrieved evidence blocks for injection into the prompt."""
    blocks = []
    for i, e in enumerate(evidence, 1):
        blocks.append(
            f"[Source {i} | {e['filename']} | Page {e['page_number']}]\n{e['content']}"
        )
    return "\n\n".join(blocks)


def generate_answer(question: str, evidence: list[dict]) -> str:
    """
    Generate a grounded answer using only the supplied evidence.

    The prompt explicitly instructs Gemini to:
      - Use only the provided evidence for factual claims.
      - Not invent numbers, dates, or figures.
      - Not fabricate citations.
      - Admit when evidence is insufficient.
    """
    if not evidence:
        return (
            "No relevant content was found in the knowledge base to answer this question. "
            "Ensure the document has been ingested before asking questions."
        )

    context = _build_context(evidence)

    prompt = f"""You are a financial due diligence analyst reviewing corporate filings.

Your task: answer the question below using ONLY the document excerpts provided.

Strict rules:
- Base every factual claim on the provided excerpts.
- Do not invent numbers, percentages, dates, or names not present in the evidence.
- Do not fabricate source references or page numbers.
- If the evidence is insufficient to fully answer, say so clearly and explain what is missing.
- Be precise and concise. Quote exact figures from the text when available.
- Distinguish between what the document explicitly states vs. reasonable inference.

---
DOCUMENT EXCERPTS:
{context}

---
QUESTION: {question}

ANSWER:"""

    model = _get_model()
    response = model.generate_content(prompt)
    return response.text.strip()
