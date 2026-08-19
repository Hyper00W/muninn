"use client";

import { Paperclip, ArrowRight, SlidersHorizontal } from "lucide-react";
import { useRef, useState } from "react";
import { useMuninn } from "@/context/MuninnContext";

export function ChatInput() {
  const {
    sendMessage,
    isProcessing,
    selectedDocument,
    uploadAndIngest,
    isUploading,
  } = useMuninn();
  const [value, setValue] = useState("");
  const [topK, setTopK] = useState(5);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const documentReady =
    selectedDocument !== null && selectedDocument.status === "processed";
  const disabled =
    isProcessing || isUploading || !value.trim() || !documentReady;

  const submit = async () => {
    const q = value.trim();
    if (!q || disabled) return;
    setValue("");
    setFiltersOpen(false);
    await sendMessage(q, topK);
  };

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        void submit();
      }}
      className="border-t border-subtle px-4 py-3 lg:px-6"
    >
      <div className="flex items-end gap-2 rounded border border-subtle bg-muninn-surface px-3 py-2">
        <textarea
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              void submit();
            }
          }}
          rows={1}
          placeholder="Ask anything about this document..."
          className="max-h-32 min-h-[36px] flex-1 resize-none bg-transparent py-1.5 text-sm text-muninn-silver outline-none placeholder:text-muninn-muted"
        />
        <div className="relative flex items-center gap-1 pb-0.5">
          <button
            type="button"
            onClick={() => setFiltersOpen((o) => !o)}
            className="flex items-center gap-1.5 rounded px-2 py-1.5 text-[11px] text-muninn-muted hover:bg-muninn-elevated hover:text-muninn-silver"
          >
            <SlidersHorizontal size={13} strokeWidth={1.5} />
            Filters
          </button>
          {filtersOpen && (
            <div className="absolute bottom-full right-0 mb-2 w-40 rounded border border-subtle bg-muninn-elevated p-3 shadow-lg">
              <label className="text-[10px] tracking-wider text-muninn-muted">
                TOP K
              </label>
              <select
                value={topK}
                onChange={(e) => setTopK(Number(e.target.value))}
                className="mt-1 w-full bg-muninn-surface px-2 py-1 text-xs text-muninn-silver outline-none"
              >
                {[3, 5, 8, 10].map((n) => (
                  <option key={n} value={n}>
                    {n}
                  </option>
                ))}
              </select>
            </div>
          )}
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className="rounded p-1.5 text-muninn-muted hover:bg-muninn-elevated hover:text-muninn-silver"
            aria-label="Attach"
          >
            <Paperclip size={15} strokeWidth={1.5} />
          </button>
          <input
            ref={fileRef}
            type="file"
            accept=".pdf"
            className="hidden"
            onChange={async (e) => {
              const file = e.target.files?.[0];
              if (!file) return;
              try {
                await uploadAndIngest(file);
              } catch {
                /* handled in context */
              }
              e.target.value = "";
            }}
          />
          <button
            type="submit"
            disabled={disabled}
            className="rounded bg-muninn-elevated p-2 text-muninn-white transition-colors hover:bg-[#1f1f1f] disabled:opacity-30"
            aria-label="Send"
          >
            <ArrowRight size={14} strokeWidth={2} />
          </button>
        </div>
      </div>
    </form>
  );
}
