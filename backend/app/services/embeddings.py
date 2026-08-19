try:
    import truststore
    truststore.inject_into_ssl()
except Exception:
    pass

from sentence_transformers import SentenceTransformer

from app.core.config import settings

# Lazy-loaded singleton — model loads once on first call, cached for the process lifetime
_model: SentenceTransformer | None = None


def _get_model() -> SentenceTransformer:
    global _model
    if _model is None:
        _model = SentenceTransformer(settings.embedding_model)
    return _model


def embed_texts(texts: list[str]) -> list[list[float]]:
    """Embed a batch of texts. Returns a list of 384-dim float vectors."""
    if not texts:
        return []
    model = _get_model()
    embeddings = model.encode(
        texts,
        batch_size=64,
        show_progress_bar=False,
        convert_to_numpy=True,
    )
    return embeddings.tolist()


def embed_query(text: str) -> list[float]:
    """Embed a single query string."""
    return embed_texts([text])[0]
