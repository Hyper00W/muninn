"use client";

import { useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { MuninnStatue } from "@/components/muninn/MuninnStatue";
import { useMuninn } from "@/context/MuninnContext";

export function ChatThread() {
  const {
    messages,
    isProcessing,
    processingStage,
    pendingQuestion,
    selectedDocument,
    isLoadingDocuments,
    highlightEvidence,
    setEvidencePanelOpen,
    ingest,
  } = useMuninn();

  const last = messages[messages.length - 1];
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isProcessing, pendingQuestion]);

  if (isLoadingDocuments) {
    return (
      <div className="flex h-full items-center justify-center text-xs text-muninn-muted">
        Loading documents...
      </div>
    );
  }

  if (!selectedDocument) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-6 px-8 text-center">
        <MuninnStatue size="lg" />
        <div>
          <p className="text-sm text-muninn-silver">No document selected</p>
          <p className="mt-1 text-xs text-muninn-muted">
            Upload a PDF or choose one from recent documents.
          </p>
        </div>
      </div>
    );
  }

  if (selectedDocument.status !== "processed") {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-6 px-8 text-center">
        <MuninnStatue
          size="lg"
          isProcessing={selectedDocument.status === "processing"}
          processingStage={processingStage}
        />
        <div>
          <p className="text-sm text-muninn-silver">
            {selectedDocument.filename}
          </p>
          <p className="mt-1 text-xs text-muninn-muted">
            Status: {selectedDocument.status}
          </p>
          {selectedDocument.status === "uploaded" ||
          selectedDocument.status === "failed" ? (
            <button
              type="button"
              onClick={() => ingest(selectedDocument.id)}
              className="mt-4 rounded border border-subtle px-3 py-1.5 text-[11px] tracking-wider text-muninn-silver hover:bg-muninn-surface"
            >
              {selectedDocument.status === "failed" ? "Retry ingest" : "Ingest document"}
            </button>
          ) : (
            <p className="mt-3 text-[11px] text-muninn-muted">
              Processing. This may take a moment.
            </p>
          )}
        </div>
      </div>
    );
  }

  if (!last && !isProcessing) {
    return (
      <div className="relative flex h-full items-center justify-center overflow-hidden px-8">
        <div className="pointer-events-none absolute right-[8%] top-1/2 -translate-y-1/2 opacity-90">
          <MuninnStatue size="lg" />
        </div>
        <div className="relative z-10 max-w-md">
          <p className="text-[10px] tracking-[0.2em] text-muninn-muted">
            MUNINN
          </p>
          <p className="mt-2 text-sm leading-relaxed text-muninn-silver">
            Ask a question about this filing. Answers are grounded in retrieved
            passages with page-level citations.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative h-full overflow-y-auto px-4 py-8 lg:px-10">
      <div className="pointer-events-none absolute right-6 top-16 hidden md:block lg:right-12 lg:top-20">
        <MuninnStatue
          size="lg"
          isProcessing={isProcessing}
          processingStage={processingStage}
        />
      </div>

      <div className="relative z-10 max-w-xl space-y-10 pb-8">
        {messages.map((msg) => (
          <article key={msg.id}>
            <div className="mb-6">
              <div className="mb-2 flex items-center gap-3 text-[10px] tracking-[0.14em] text-muninn-muted">
                YOU ASKED
                <span className="tracking-normal text-muninn-muted/70">
                  {msg.timestamp.toLocaleTimeString([], {
                    hour: "numeric",
                    minute: "2-digit",
                  })}
                </span>
              </div>
              <p className="text-sm text-muninn-white">{msg.question}</p>
            </div>

            <div>
              <div className="mb-3 text-[10px] tracking-[0.14em] text-muninn-muted">
                MUNINN ANSWER
              </div>
              <motion.div
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
                className="whitespace-pre-wrap text-[13px] leading-relaxed text-muninn-silver"
              >
                {msg.answer}
              </motion.div>

              {msg.sources.length > 0 && (
                <div className="mt-5">
                  <div className="mb-2 text-[10px] tracking-[0.14em] text-muninn-muted">
                    SOURCES
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    {msg.sources.map((src) => (
                      <button
                        key={`${src.chunk_id}-${src.page_number}`}
                        type="button"
                        onClick={() => {
                          highlightEvidence(src.chunk_id);
                          setEvidencePanelOpen(true);
                        }}
                        className="rounded border border-subtle bg-muninn-surface px-2.5 py-1 text-[10px] tracking-wide text-muninn-muted hover:border-white/15 hover:text-muninn-silver"
                      >
                        Page {src.page_number}
                      </button>
                    ))}
                    <button
                      type="button"
                      onClick={() => setEvidencePanelOpen(true)}
                      className="text-[11px] text-muninn-muted hover:text-muninn-silver"
                    >
                      View all citations →
                    </button>
                  </div>
                </div>
              )}
            </div>
          </article>
        ))}

        {isProcessing && pendingQuestion && (
          <article>
            <div className="mb-2 flex items-center gap-3 text-[10px] tracking-[0.14em] text-muninn-muted">
              YOU ASKED
            </div>
            <p className="text-sm text-muninn-white">{pendingQuestion}</p>
            <div className="mt-6 text-[10px] tracking-[0.14em] text-muninn-muted">
              MUNINN ANSWER
            </div>
            <p className="mt-2 text-[13px] text-muninn-muted">Analyzing...</p>
          </article>
        )}
        <div ref={endRef} />
      </div>
    </div>
  );
}
