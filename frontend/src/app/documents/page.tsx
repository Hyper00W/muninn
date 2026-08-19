"use client";

import { FileText } from "lucide-react";
import { useRouter } from "next/navigation";
import { formatDocumentName, useMuninn } from "@/context/MuninnContext";

export default function DocumentsPage() {
  const {
    documents,
    selectedDocument,
    selectDocument,
    ingest,
    isLoadingDocuments,
    isUploading,
  } = useMuninn();
  const router = useRouter();

  return (
    <div className="h-full overflow-y-auto px-6 py-8">
      <h1 className="text-[11px] tracking-[0.18em] text-muninn-muted">
        DOCUMENTS
      </h1>
      <p className="mt-2 max-w-lg text-xs text-muninn-muted">
        Filings loaded from the MUNINN backend. Select a document to analyze it
        in Workspace.
      </p>

      {isLoadingDocuments || isUploading ? (
        <p className="mt-8 text-xs text-muninn-muted">Loading...</p>
      ) : documents.length === 0 ? (
        <p className="mt-8 text-xs text-muninn-muted">No documents yet.</p>
      ) : (
        <ul className="mt-8 max-w-2xl space-y-1">
          {documents.map((doc) => {
            const active = selectedDocument?.id === doc.id;
            return (
              <li key={doc.id}>
                <div
                  className={`flex items-center gap-3 rounded border px-3 py-3 ${
                    active
                      ? "border-white/15 bg-muninn-elevated"
                      : "border-subtle bg-muninn-surface"
                  }`}
                >
                  <FileText
                    size={14}
                    className="shrink-0 text-muninn-muted"
                    strokeWidth={1.5}
                  />
                  <button
                    type="button"
                    onClick={() => {
                      selectDocument(doc);
                      router.push("/");
                    }}
                    className="min-w-0 flex-1 text-left"
                  >
                    <div className="truncate text-xs text-muninn-silver">
                      {formatDocumentName(doc.filename)}
                    </div>
                    <div className="mt-0.5 text-[10px] text-muninn-muted">
                      PDF
                      {doc.page_count ? ` · ${doc.page_count} pg` : ""} ·{" "}
                      {doc.status}
                    </div>
                  </button>
                  {(doc.status === "uploaded" || doc.status === "failed") && (
                    <button
                      type="button"
                      onClick={() => ingest(doc.id)}
                      className="text-[10px] tracking-wider text-muninn-muted hover:text-muninn-white"
                    >
                      Ingest
                    </button>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
