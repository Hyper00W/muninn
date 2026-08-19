"use client";

import { ExternalLink } from "lucide-react";
import { useState } from "react";
import { useMuninn } from "@/context/MuninnContext";

export function EvidencePanel() {
  const {
    evidence,
    messages,
    isProcessing,
    isSearching,
    highlightedChunkId,
    highlightEvidence,
    focusMessage,
    setEvidencePanelOpen,
  } = useMuninn();
  const [tab, setTab] = useState<"evidence" | "history">("evidence");
  const [expanded, setExpanded] = useState(false);

  return (
    <aside className="flex h-full w-80 shrink-0 flex-col border-l border-subtle bg-muninn-graphite">
      <div className="flex items-center border-b border-subtle px-3">
        {(["evidence", "history"] as const).map((id) => (
          <button
            key={id}
            type="button"
            onClick={() => setTab(id)}
            className={`relative px-3 py-3 text-[11px] tracking-[0.12em] transition-colors ${
              tab === id
                ? "text-muninn-white"
                : "text-muninn-muted hover:text-muninn-silver"
            }`}
          >
            {id === "evidence" ? "EVIDENCE" : "CHAT HISTORY"}
            {tab === id && (
              <span className="absolute inset-x-3 bottom-0 h-px bg-muninn-white/70" />
            )}
          </button>
        ))}
        <button
          type="button"
          onClick={() => setEvidencePanelOpen(false)}
          className="ml-auto px-2 py-3 text-[11px] text-muninn-muted hover:text-muninn-white xl:hidden"
        >
          Close
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-3 py-4">
        {tab === "evidence" ? (
          <>
            <div className="mb-3 px-1 text-[10px] font-medium tracking-[0.15em] text-muninn-muted">
              Top Relevant Chunks
            </div>
            {isProcessing || isSearching ? (
              <div className="px-1 py-6 text-xs text-muninn-muted">
                Retrieving evidence...
              </div>
            ) : evidence.length === 0 ? (
              <div className="px-1 py-6 text-xs text-muninn-muted">
                No evidence yet. Ask a question or run a search.
              </div>
            ) : (
              <ul className="space-y-2">
                {evidence.map((item) => {
                  const active = highlightedChunkId === item.chunk_id;
                  return (
                    <li key={item.chunk_id}>
                      <button
                        type="button"
                        onClick={() =>
                          highlightEvidence(active ? null : item.chunk_id)
                        }
                        className={`w-full rounded border px-3 py-3 text-left transition-colors ${
                          active
                            ? "border-white/20 bg-muninn-elevated"
                            : "border-subtle bg-muninn-surface hover:border-white/10"
                        }`}
                      >
                        <div className="mb-2 flex items-center justify-between gap-2">
                          <span className="text-[10px] tracking-wider text-muninn-muted">
                            Page {item.page_number}
                          </span>
                          <span className="text-[10px] text-muninn-muted">
                            Relevance {item.score.toFixed(2)}
                          </span>
                        </div>
                        <p
                          className={`text-[11px] leading-relaxed text-muninn-silver ${
                            expanded ? "" : "line-clamp-4"
                          }`}
                        >
                          {item.content}
                        </p>
                        <div className="mt-2 flex items-center justify-between gap-2">
                          <span className="truncate text-[10px] text-muninn-muted">
                            {item.filename}
                          </span>
                          <ExternalLink
                            size={11}
                            className="shrink-0 text-muninn-muted"
                            strokeWidth={1.5}
                          />
                        </div>
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </>
        ) : messages.length === 0 ? (
          <div className="px-1 py-6 text-xs text-muninn-muted">
            No conversation yet.
          </div>
        ) : (
          <ul className="space-y-1">
            {messages.map((msg) => (
              <li key={msg.id}>
                <button
                  type="button"
                  onClick={() => {
                    focusMessage(msg.id);
                    setTab("evidence");
                  }}
                  className="w-full rounded px-2 py-2.5 text-left hover:bg-muninn-surface"
                >
                  <div className="truncate text-xs text-muninn-silver">
                    {msg.question}
                  </div>
                  <div className="mt-0.5 text-[10px] text-muninn-muted">
                    {msg.timestamp.toLocaleTimeString([], {
                      hour: "numeric",
                      minute: "2-digit",
                    })}
                  </div>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {tab === "evidence" && evidence.length > 0 && (
        <div className="border-t border-subtle px-4 py-3">
          <button
            type="button"
            onClick={() => setExpanded((v) => !v)}
            className="text-[11px] tracking-wide text-muninn-muted hover:text-muninn-silver"
          >
            {expanded ? "Collapse evidence" : "View full evidence →"}
          </button>
        </div>
      )}
    </aside>
  );
}
