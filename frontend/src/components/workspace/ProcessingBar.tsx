"use client";

import { Check } from "lucide-react";
import { MuninnStatue } from "@/components/muninn/MuninnStatue";
import { useMuninn } from "@/context/MuninnContext";
import type { ProcessingStage } from "@/lib/types";

const STAGES: { id: ProcessingStage; label: string }[] = [
  { id: "understanding", label: "Understanding your question" },
  { id: "searching", label: "Searching relevant chunks" },
  { id: "analyzing", label: "Analyzing evidence" },
  { id: "preparing", label: "Preparing answer" },
];

const order: ProcessingStage[] = [
  "understanding",
  "searching",
  "analyzing",
  "preparing",
];

export function ProcessingBar() {
  const { isProcessing, processingStage, isUploading, selectedDocument } =
    useMuninn();

  if (!isProcessing && !isUploading) return null;

  const currentIndex = order.indexOf(processingStage);

  return (
    <div className="border-t border-subtle px-4 py-3 lg:px-6">
      <div className="mb-3 flex items-center gap-3">
        <MuninnStatue
          size="sm"
          isProcessing={isProcessing || isUploading}
          processingStage={processingStage}
          className="!h-9 !w-9 shrink-0"
        />
        <span className="text-[11px] tracking-wide text-muninn-muted">
          {isUploading
            ? "MUNINN is ingesting the document..."
            : "MUNINN is analyzing the document..."}
        </span>
        {selectedDocument && (
          <span className="ml-auto truncate text-[10px] text-muninn-muted">
            {selectedDocument.filename}
          </span>
        )}
      </div>
      <div className="flex items-end justify-between gap-6">
        <ul className="space-y-1">
          {STAGES.map((stage, i) => {
            const done = isProcessing && i < currentIndex;
            const active = isProcessing && stage.id === processingStage;
            return (
              <li
                key={stage.id}
                className={`flex items-center gap-2 text-[11px] ${
                  active
                    ? "text-muninn-white"
                    : done
                      ? "text-muninn-silver"
                      : "text-muninn-muted/60"
                }`}
              >
                {done ? (
                  <Check size={11} strokeWidth={2} className="text-muninn-muted" />
                ) : (
                  <span
                    className={`h-1 w-1 rounded-full ${
                      active ? "bg-muninn-white" : "bg-muninn-border"
                    }`}
                  />
                )}
                {stage.label}
              </li>
            );
          })}
        </ul>
        <Waveform active />
      </div>
    </div>
  );
}

function Waveform({ active }: { active: boolean }) {
  return (
    <div className="flex h-8 items-end gap-[3px]" aria-hidden>
      {Array.from({ length: 28 }).map((_, i) => (
        <span
          key={i}
          className="w-[2px] origin-bottom rounded-full bg-muninn-muted/50"
          style={{
            height: `${6 + ((i * 17) % 18)}px`,
            animation: active
              ? `waveform 1.6s ease-in-out ${i * 0.04}s infinite`
              : undefined,
          }}
        />
      ))}
    </div>
  );
}
