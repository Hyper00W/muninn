import type {
  ChatResponse,
  Document,
  IngestResponse,
  SearchResult,
} from "./types";

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      ...(options?.body instanceof FormData
        ? {}
        : { "Content-Type": "application/json" }),
      ...options?.headers,
    },
  });

  if (!res.ok) {
    let detail = res.statusText;
    try {
      const body = await res.json();
      detail = body.detail ?? detail;
    } catch {
      /* ignore */
    }
    throw new ApiError(
      typeof detail === "string" ? detail : JSON.stringify(detail),
      res.status,
    );
  }

  return res.json() as Promise<T>;
}

export async function getHealth(): Promise<{ status: string; service: string }> {
  return request("/health");
}

export async function getDocuments(): Promise<Document[]> {
  return request("/documents");
}

export async function getDocument(id: number): Promise<Document> {
  return request(`/documents/${id}`);
}

export async function uploadDocument(file: File): Promise<Document> {
  const form = new FormData();
  form.append("file", file);
  return request("/documents/upload", { method: "POST", body: form });
}

export async function ingestDocument(id: number): Promise<IngestResponse> {
  return request(`/documents/${id}/ingest`, { method: "POST" });
}

export async function searchDocuments(params: {
  query: string;
  document_id?: number;
  top_k?: number;
}): Promise<{ results: SearchResult[]; total: number }> {
  return request("/search", {
    method: "POST",
    body: JSON.stringify(params),
  });
}

export async function chat(params: {
  question: string;
  document_id?: number;
  top_k?: number;
}): Promise<ChatResponse> {
  return request("/chat", {
    method: "POST",
    body: JSON.stringify(params),
  });
}

export { ApiError };
