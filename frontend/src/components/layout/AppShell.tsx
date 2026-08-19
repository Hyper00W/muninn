"use client";

import type { ReactNode } from "react";
import { Sidebar } from "./Sidebar";
import { TopBar } from "./TopBar";
import { EvidencePanel } from "./EvidencePanel";
import { ErrorBanner } from "@/components/workspace/ErrorBanner";
import { useMuninn } from "@/context/MuninnContext";

export function AppShell({ children }: { children: ReactNode }) {
  const { sidebarOpen, setSidebarOpen, evidencePanelOpen, setEvidencePanelOpen } =
    useMuninn();

  return (
    <div className="flex h-screen overflow-hidden bg-muninn-black">
      <Sidebar />

      {sidebarOpen && (
        <button
          type="button"
          className="fixed inset-0 z-20 bg-black/50 lg:hidden"
          aria-label="Close sidebar"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <div className="flex min-w-0 flex-1 flex-col">
        <TopBar />
        <ErrorBanner />
        <div className="flex min-h-0 flex-1">
          <main className="min-w-0 flex-1 overflow-hidden">{children}</main>
          <div className="hidden h-full xl:flex">
            <EvidencePanel />
          </div>
        </div>
      </div>

      {evidencePanelOpen && (
        <div className="fixed inset-0 z-30 flex justify-end xl:hidden">
          <button
            type="button"
            className="absolute inset-0 bg-black/50"
            aria-label="Close evidence panel"
            onClick={() => setEvidencePanelOpen(false)}
          />
          <div className="relative z-10 h-full">
            <EvidencePanel />
          </div>
        </div>
      )}
    </div>
  );
}
