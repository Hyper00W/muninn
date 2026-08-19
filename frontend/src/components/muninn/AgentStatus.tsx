"use client";

import { useEffect, useState } from "react";
import { MuninnStatue } from "./MuninnStatue";
import { getHealth } from "@/lib/api";

export function AgentStatus() {
  const [online, setOnline] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const check = async () => {
      try {
        const h = await getHealth();
        if (!cancelled) setOnline(h.status === "healthy");
      } catch {
        if (!cancelled) setOnline(false);
      }
    };
    check();
    const id = setInterval(check, 30000);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, []);

  return (
    <div className="border-t border-subtle px-4 py-4">
      <div className="flex items-center gap-3">
        <MuninnStatue size="sm" />
        <div>
          <div className="text-[10px] font-medium tracking-[0.15em] text-muninn-white">
            MUNINN
          </div>
          <div className="text-[10px] tracking-wider text-muninn-muted">
            AI AGENT
          </div>
          <div className="mt-1 flex items-center gap-1.5">
            <span
              className={`h-1.5 w-1.5 rounded-full ${
                online ? "bg-emerald-500/80" : "bg-muninn-muted"
              }`}
            />
            <span className="text-[10px] text-muninn-muted">
              {online ? "Online" : "Offline"}
            </span>
          </div>
        </div>
      </div>
      <div className="mt-3 text-[10px] tracking-wide text-muninn-muted/70">
        v0.3.0
      </div>
    </div>
  );
}
