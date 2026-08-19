"use client";

import { ChatThread } from "@/components/workspace/ChatThread";
import { ChatInput } from "@/components/workspace/ChatInput";
import { ProcessingBar } from "@/components/workspace/ProcessingBar";

export default function WorkspacePage() {
  return (
    <div className="flex h-full flex-col">
      <div className="min-h-0 flex-1">
        <ChatThread />
      </div>
      <ProcessingBar />
      <ChatInput />
    </div>
  );
}
