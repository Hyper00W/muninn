"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  FileText,
  LayoutGrid,
  MoreHorizontal,
  Plus,
  Search,
  Settings,
} from "lucide-react";
import { MuninnLogo } from "@/components/muninn/MuninnLogo";
import { AgentStatus } from "@/components/muninn/AgentStatus";
import { useMuninn } from "@/context/MuninnContext";
import { useRouter } from "next/navigation";
import { useRef } from "react";

const navItems = [
  { href: "/", label: "Workspace", icon: LayoutGrid },
  { href: "/documents", label: "Documents", icon: FileText },
  { href: "/search", label: "Search", icon: Search },
  { href: "/settings", label: "Settings", icon: Settings },
];

function statusLabel(status: string): string {
  switch (status) {
    case "processed":
      return "Ready";
    case "processing":
      return "Processing";
    case "uploaded":
      return "Uploaded";
    case "failed":
      return "Failed";
    default:
      return status;
  }
}

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const {
    documents,
    selectedDocument,
    selectDocument,
    uploadAndIngest,
    sidebarOpen,
    isLoadingDocuments,
    isUploading,
  } = useMuninn();

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      await uploadAndIngest(file);
    } catch {
      /* error handled in context */
    }
    e.target.value = "";
  };

  return (
    <aside
      className={`fixed inset-y-0 left-0 z-30 h-full w-64 shrink-0 flex-col border-r border-subtle bg-muninn-graphite ${
        sidebarOpen ? "flex" : "hidden"
      } lg:static lg:flex`}
    >
      <div className="border-b border-subtle px-5 py-5">
        <MuninnLogo />
      </div>

      <nav className="px-3 py-4">
        {navItems.map(({ href, label, icon: Icon }) => {
          const active = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              className={`mb-0.5 flex items-center gap-3 rounded px-3 py-2 text-sm transition-colors ${
                active
                  ? "bg-muninn-elevated text-muninn-white"
                  : "text-muninn-muted hover:bg-muninn-surface hover:text-muninn-silver"
              }`}
            >
              <Icon size={16} strokeWidth={1.5} />
              {label}
            </Link>
          );
        })}
      </nav>

      <div className="flex-1 overflow-y-auto px-3">
        <div className="mb-3 flex items-center justify-between px-2">
          <span className="text-[10px] font-medium tracking-[0.15em] text-muninn-muted">
            RECENT DOCUMENTS
          </span>
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
            className="flex items-center gap-1 text-[10px] tracking-wider text-muninn-muted transition-colors hover:text-muninn-white disabled:opacity-40"
          >
            <Plus size={12} />
            {isUploading ? "Uploading" : "Upload"}
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf"
            className="hidden"
            onChange={handleUpload}
          />
        </div>

        {isLoadingDocuments ? (
          <div className="px-2 py-4 text-xs text-muninn-muted">Loading...</div>
        ) : documents.length === 0 ? (
          <div className="px-2 py-4 text-xs text-muninn-muted">
            No documents yet
          </div>
        ) : (
          <ul className="space-y-0.5">
            {documents.map((doc) => {
              const isActive = selectedDocument?.id === doc.id;
              return (
                <li key={doc.id}>
                  <button
                    type="button"
                    onClick={() => {
                      selectDocument(doc);
                      if (pathname !== "/") router.push("/");
                    }}
                    className={`group flex w-full items-start gap-2.5 rounded px-2 py-2.5 text-left transition-colors ${
                      isActive
                        ? "bg-muninn-elevated ring-1 ring-white/[0.06]"
                        : "hover:bg-muninn-surface"
                    }`}
                  >
                    <FileText
                      size={14}
                      className={`mt-0.5 shrink-0 ${isActive ? "text-muninn-white" : "text-muninn-muted"}`}
                      strokeWidth={1.5}
                    />
                    <div className="min-w-0 flex-1">
                      <div
                        className={`truncate text-xs ${isActive ? "text-muninn-white" : "text-muninn-silver"}`}
                      >
                        {doc.filename.replace(/\.pdf$/i, "")}
                      </div>
                      <div className="mt-0.5 flex items-center gap-2 text-[10px] text-muninn-muted">
                        <span>PDF</span>
                        {doc.page_count && <span>{doc.page_count} pg</span>}
                        <span>{statusLabel(doc.status)}</span>
                      </div>
                    </div>
                    <MoreHorizontal
                      size={14}
                      className="shrink-0 text-muninn-muted opacity-0 transition-opacity group-hover:opacity-100"
                    />
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      <AgentStatus />
    </aside>
  );
}
