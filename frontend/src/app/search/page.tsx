"use client";

import { useState } from "react";
import { useMuninn } from "@/context/MuninnContext";

export default function SearchPage() {
  const {
    runSearch,
    searchResults,
    isSearching,
    selectedDocument,
    highlightEvidence,
    setEvidencePanelOpen,
  } = useMuninn();
  const [query, setQuery] = useState("");

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    await runSearch(query.trim());
    setEvidencePanelOpen(true);
  };

  return (
    <div className="h-full overflow-y-auto px-6 py-8">
      <h1 className="text-[11px] tracking-[0.18em] text-muninn-muted">SEARCH</h1>
      <p className="mt-2 max-w-lg text-xs text-muninn-muted">
        Retrieve passages{selectedDocument ? ` from ${selectedDocument.filename}` : ""}.
        Results use backend scores and page metadata.
      </p>

      <form onSubmit={onSubmit} className="mt-8 flex max-w-xl gap-2">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search document passages..."
          className="flex-1 rounded border border-subtle bg-muninn-surface px-3 py-2 text-sm text-muninn-silver outline-none placeholder:text-muninn-muted"
        />
        <button
          type="submit"
          disabled={isSearching || !query.trim()}
          className="rounded bg-muninn-elevated px-3 py-2 text-[11px] tracking-wider text-muninn-white disabled:opacity-40"
        >
          {isSearching ? "Searching" : "Search"}
        </button>
      </form>

      <ul className="mt-6 max-w-2xl space-y-2">
        {searchResults.map((item) => (
          <li key={item.chunk_id}>
            <button
              type="button"
              onClick={() => {
                highlightEvidence(item.chunk_id);
                setEvidencePanelOpen(true);
              }}
              className="w-full rounded border border-subtle bg-muninn-surface px-3 py-3 text-left hover:border-white/10"
            >
              <div className="mb-2 flex gap-3 text-[10px] text-muninn-muted">
                <span>Page {item.page_number}</span>
                <span>Relevance {item.score.toFixed(2)}</span>
                <span className="truncate">{item.filename}</span>
              </div>
              <p className="line-clamp-4 text-[11px] leading-relaxed text-muninn-silver">
                {item.content}
              </p>
            </button>
          </li>
        ))}
      </ul>

      {!isSearching && searchResults.length === 0 && (
        <p className="mt-8 text-xs text-muninn-muted">No search results yet.</p>
      )}
    </div>
  );
}
