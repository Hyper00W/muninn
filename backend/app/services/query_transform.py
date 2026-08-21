import google.generativeai as genai

from app.core.config import settings


_model = None


def _get_model():
    global _model

    if _model is None:
        genai.configure(
            api_key=settings.gemini_api_key,
            transport="rest",
        )
        _model = genai.GenerativeModel(settings.gemini_model)

    return _model


def generate_queries(query: str, num_queries: int = 3) -> list[str]:
    model = _get_model()

    prompt = f"""
Generate {num_queries} alternative search queries for the user's question.

The alternative queries should:
- preserve the original intent
- use different wording
- include important related terminology
- be useful for searching a corporate financial document

Return ONLY the queries, one per line.
Do not number them.
Do not explain anything.

User question:
{query}
"""

    response = model.generate_content(prompt)

    queries = [
        line.strip()
        for line in response.text.splitlines()
        if line.strip()
    ]

    return queries[:num_queries]