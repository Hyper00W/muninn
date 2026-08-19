"use client";

import { Bell, Menu, PanelRight, Sun } from "lucide-react";
import { formatDocumentName, useMuninn } from "@/context/MuninnContext";

export function TopBar() {
  const {
    selectedDocument,
    setSidebarOpen,
    sidebarOpen,
    evidencePanelOpen,
    setEvidencePanelOpen,
  } = useMuninn();

  const docLabel = selectedDocument
    ? formatDocumentName(selectedDocument.filename)
    : "NO DOCUMENT SELECTED";

  return (
    <header className="flex h-12 shrink-0 items-center justify-between border-b border-subtle px-4 lg:px-6">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="rounded p-1.5 text-muninn-muted transition-colors hover:bg-muninn-surface hover:text-muninn-white lg:hidden"
          aria-label="Toggle sidebar"
        >
          <Menu size={18} />
        </button>
        <div className="text-[11px] tracking-[0.12em] text-muninn-muted">
          WORKSPACE{" "}
          <span className="text-muninn-muted/50">/</span>{" "}
          <span className="text-muninn-silver">{docLabel}</span>
        </div>
      </div>

      <div className="flex items-center gap-1">
        <button
          type="button"
          className="rounded p-2 text-muninn-muted transition-colors hover:bg-muninn-surface hover:text-muninn-white"
          aria-label="Theme"
        >
          <Sun size={16} strokeWidth={1.5} />
        </button>
        <button
          type="button"
          className="rounded p-2 text-muninn-muted transition-colors hover:bg-muninn-surface hover:text-muninn-white"
          aria-label="Notifications"
        >
          <Bell size={16} strokeWidth={1.5} />
        </button>
        <button
          type="button"
          onClick={() => setEvidencePanelOpen(!evidencePanelOpen)}
          className="rounded p-2 text-muninn-muted transition-colors hover:bg-muninn-surface hover:text-muninn-white xl:hidden"
          aria-label="Toggle evidence panel"
        >
          <PanelRight size={16} strokeWidth={1.5} />
        </button>
        <div className="ml-1 flex h-7 w-7 items-center justify-center rounded-full border border-subtle text-[10px] text-muninn-muted">
          U
        </div>
      </div>
    </header>
  );
}
