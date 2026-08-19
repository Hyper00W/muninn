from app.core.config import settings


def _merge_into_chunks(
    splits: list[str],
    sep: str,
    chunk_size: int,
    chunk_overlap: int,
) -> list[str]:
    """Merge a list of splits into chunks respecting chunk_size with overlap."""
    chunks: list[str] = []
    current: list[str] = []
    current_len = 0

    for piece in splits:
        piece_len = len(piece)
        sep_cost = len(sep) if current else 0

        if current_len + sep_cost + piece_len <= chunk_size:
            current.append(piece)
            current_len += sep_cost + piece_len
        else:
            if current:
                chunks.append(sep.join(current))

                # Build overlap from the tail of the current window
                overlap: list[str] = []
                overlap_len = 0
                for part in reversed(current):
                    part_cost = len(part) + (len(sep) if overlap else 0)
                    if overlap_len + part_cost <= chunk_overlap:
                        overlap.insert(0, part)
                        overlap_len += part_cost
                    else:
                        break
                current = overlap
                current_len = overlap_len

            current.append(piece)
            current_len += (len(sep) if len(current) > 1 else 0) + piece_len

    if current:
        chunks.append(sep.join(current))

    return chunks


def split_text(text: str, chunk_size: int, chunk_overlap: int) -> list[str]:
    """
    Recursively split text into chunks of at most chunk_size characters.
    Tries separators in order: paragraphs, lines, sentences, words, characters.
    """
    text = text.strip()
    if not text:
        return []
    if len(text) <= chunk_size:
        return [text]

    for sep in ["\n\n", "\n", ". ", " ", ""]:
        if sep == "":
            # Character-level hard split as last resort
            chunks = []
            start = 0
            while start < len(text):
                end = min(start + chunk_size, len(text))
                chunk = text[start:end].strip()
                if chunk:
                    chunks.append(chunk)
                start = end - chunk_overlap
                if start <= 0 or start >= len(text):
                    break
            return chunks

        if sep not in text:
            continue

        splits = [s for s in text.split(sep) if s.strip()]
        if not splits:
            continue

        merged = _merge_into_chunks(splits, sep, chunk_size, chunk_overlap)

        # Accept this separator if all chunks are within size
        if merged and all(len(c) <= chunk_size for c in merged):
            return [c for c in merged if c.strip()]

    return [text]


def chunk_page(
    text: str,
    document_id: int,
    page_id: int,
    page_number: int,
    chunk_size: int | None = None,
    chunk_overlap: int | None = None,
) -> list[dict]:
    """
    Chunk a single page's extracted text.
    Returns list of dicts with all metadata needed to create DocumentChunk records.
    Every chunk is traceable: chunk → page → document.
    """
    chunk_size = chunk_size or settings.chunk_size
    chunk_overlap = chunk_overlap or settings.chunk_overlap

    raw_chunks = split_text(text, chunk_size, chunk_overlap)

    return [
        {
            "document_id": document_id,
            "page_id": page_id,
            "page_number": page_number,
            "content": chunk,
            "chunk_index": idx,
        }
        for idx, chunk in enumerate(raw_chunks)
    ]
