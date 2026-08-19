"use client";

import { useMuninn } from "@/context/MuninnContext";

export function ErrorBanner() {
  const { error, clearError } = useMuninn();
  if (!error) return null;

  return (
    <div className="flex items-center justify-between gap-4 border-b border-subtle bg-muninn-surface px-4 py-2 text-xs text-muninn-silver">
      <span>{error}</span>
      <button
        type="button"
        onClick={clearError}
        className="text-[10px] tracking-wider text-muninn-muted hover:text-muninn-white"
      >
        DISMISS
      </button>
    </div>
  );
}
