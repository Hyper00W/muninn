"use client";

import { useEffect, useState } from "react";
import { getHealth } from "@/lib/api";

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

export default function SettingsPage() {
  const [health, setHealth] = useState<string>("checking");

  useEffect(() => {
    getHealth()
      .then((h) => setHealth(h.status))
      .catch(() => setHealth("unreachable"));
  }, []);

  return (
    <div className="h-full overflow-y-auto px-6 py-8">
      <h1 className="text-[11px] tracking-[0.18em] text-muninn-muted">
        SETTINGS
      </h1>
      <dl className="mt-8 max-w-md space-y-4 text-xs">
        <div className="flex justify-between border-b border-subtle py-2">
          <dt className="text-muninn-muted">API</dt>
          <dd className="text-muninn-silver">{API_BASE}</dd>
        </div>
        <div className="flex justify-between border-b border-subtle py-2">
          <dt className="text-muninn-muted">Health</dt>
          <dd className="text-muninn-silver">{health}</dd>
        </div>
        <div className="flex justify-between border-b border-subtle py-2">
          <dt className="text-muninn-muted">Version</dt>
          <dd className="text-muninn-silver">v0.3.0</dd>
        </div>
      </dl>
    </div>
  );
}
