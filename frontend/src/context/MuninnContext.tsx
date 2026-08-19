"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  chat as chatApi,
  getDocuments,
  ingestDocument,
  searchDocuments,
  uploadDocument,
  ApiError,
} from "@/lib/api";
import type {
  ChatMessage,
  Document,
  EvidenceItem,
  ProcessingStage,
  SearchResult,
} from "@/lib/types";

interface MuninnContextValue {
  documents: Document[];
  selectedDocument: Document | null;
  selectDocument: (doc: Document | null) => void;
  refreshDocuments: () => Promise<void>;
  uploadAndIngest: (file: File) => Promise<Document>;
  ingest: (id: number) => Promise<void>;
  isLoadingDocuments: boolean;
  isUploading: boolean;

  messages: ChatMessage[];
  sendMessage: (question: string, topK?: number) => Promise<void>;
  isProcessing: boolean;
  processingStage: ProcessingStage;
  pendingQuestion: string | null;
  focusMessage: (id: string) => void;

  evidence: EvidenceItem[];
  searchResults: SearchResult[];
  runSearch: (query: string, topK?: number) => Promise<void>;
  isSearching: boolean;
  highlightedChunkId: number | null;
  highlightEvidence: (chunkId: number | null) => void;

  error: string | null;
  clearError: () => void;

  evidencePanelOpen: boolean;
  setEvidencePanelOpen: (open: boolean) => void;
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
}

const MuninnContext = createContext<MuninnContextValue | null>(null);

const STAGE_DELAYS = [800, 1200, 1500];

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function MuninnProvider({ children }: { children: ReactNode }) {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(
    null,
  );
  const [isLoadingDocuments, setIsLoadingDocuments] = useState(true);
  const [isUploading, setIsUploading] = useState(false);

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStage, setProcessingStage] =
    useState<ProcessingStage>("idle");
  const [pendingQuestion, setPendingQuestion] = useState<string | null>(null);

  const [evidence, setEvidence] = useState<EvidenceItem[]>([]);
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [highlightedChunkId, setHighlightedChunkId] = useState<number | null>(
    null,
  );

  const [error, setError] = useState<string | null>(null);
  const [evidencePanelOpen, setEvidencePanelOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const refreshDocuments = useCallback(async () => {
    setIsLoadingDocuments(true);
    try {
      const docs = await getDocuments();
      setDocuments(docs);
      setSelectedDocument((prev) => {
        if (prev) {
          const updated = docs.find((d) => d.id === prev.id);
          return updated ?? prev;
        }
        const processed = docs.find((d) => d.status === "processed");
        return processed ?? docs[0] ?? null;
      });
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to load documents");
    } finally {
      setIsLoadingDocuments(false);
    }
  }, []);

  useEffect(() => {
    refreshDocuments();
  }, [refreshDocuments]);

  const selectDocument = useCallback((doc: Document | null) => {
    setSelectedDocument(doc);
    setMessages([]);
    setEvidence([]);
    setSearchResults([]);
    setHighlightedChunkId(null);
  }, []);

  const ingest = useCallback(
    async (id: number) => {
      try {
        await ingestDocument(id);
        await refreshDocuments();
      } catch (err) {
        setError(err instanceof ApiError ? err.message : "Ingestion failed");
        throw err;
      }
    },
    [refreshDocuments],
  );

  const uploadAndIngest = useCallback(
    async (file: File) => {
      setIsUploading(true);
      setError(null);
      try {
        const doc = await uploadDocument(file);
        await refreshDocuments();
        setSelectedDocument(doc);
        setMessages([]);
        setEvidence([]);
        setSearchResults([]);
        await ingestDocument(doc.id);
        await refreshDocuments();
        const updated = (await getDocuments()).find((d) => d.id === doc.id);
        if (updated) setSelectedDocument(updated);
        return updated ?? doc;
      } catch (err) {
        setError(err instanceof ApiError ? err.message : "Upload failed");
        throw err;
      } finally {
        setIsUploading(false);
      }
    },
    [refreshDocuments],
  );

  const runSearch = useCallback(
    async (query: string, topK = 5) => {
      setIsSearching(true);
      setError(null);
      try {
        const res = await searchDocuments({
          query,
          document_id: selectedDocument?.id,
          top_k: topK,
        });
        setSearchResults(res.results);
        setEvidence(
          res.results.map((r) => ({
            chunk_id: r.chunk_id,
            content: r.content,
            document_id: r.document_id,
            filename: r.filename,
            page_number: r.page_number,
            score: r.score,
          })),
        );
      } catch (err) {
        setError(err instanceof ApiError ? err.message : "Search failed");
      } finally {
        setIsSearching(false);
      }
    },
    [selectedDocument],
  );

  const focusMessage = useCallback(
    (id: string) => {
      const message = messages.find((m) => m.id === id);
      if (!message) return;
      setEvidence(message.evidence);
      setHighlightedChunkId(null);
    },
    [messages],
  );

  const sendMessage = useCallback(
    async (question: string, topK = 5) => {
      if (!question.trim() || isProcessing) return;

      if (selectedDocument && selectedDocument.status !== "processed") {
        setError("Document is not ready. Wait for processing to finish.");
        return;
      }

      const q = question.trim();
      setIsProcessing(true);
      setError(null);
      setPendingQuestion(q);
      setProcessingStage("understanding");
      setHighlightedChunkId(null);

      const payload = {
        question: q,
        document_id: selectedDocument?.id,
        top_k: topK,
      };

      const chatPromise = chatApi(payload);
      const searchPromise = searchDocuments({
        query: q,
        document_id: selectedDocument?.id,
        top_k: topK,
      }).catch(() => null);

      let cancelled = false;
      void (async () => {
        await delay(STAGE_DELAYS[0]);
        if (cancelled) return;
        setProcessingStage("searching");
        await delay(STAGE_DELAYS[1]);
        if (cancelled) return;
        setProcessingStage("analyzing");
        await delay(STAGE_DELAYS[2]);
        if (cancelled) return;
        setProcessingStage("preparing");
      })();

      try {
        const [response, searchRes] = await Promise.all([
          chatPromise,
          searchPromise,
        ]);
        cancelled = true;

        const evidenceFromSearch = searchRes?.results.map((r) => ({
          chunk_id: r.chunk_id,
          content: r.content,
          document_id: r.document_id,
          filename: r.filename,
          page_number: r.page_number,
          score: r.score,
        }));
        const evidenceItems =
          evidenceFromSearch && evidenceFromSearch.length > 0
            ? evidenceFromSearch
            : response.retrieved_evidence;

        if (searchRes) {
          setSearchResults(searchRes.results);
        }

        const message: ChatMessage = {
          id: crypto.randomUUID(),
          question: response.question,
          answer: response.answer,
          sources: response.sources,
          evidence: evidenceItems,
          timestamp: new Date(),
        };

        setMessages((prev) => [...prev, message]);
        setEvidence(evidenceItems);
        setEvidencePanelOpen(true);
      } catch (err) {
        cancelled = true;
        setError(err instanceof ApiError ? err.message : "Chat request failed");
      } finally {
        cancelled = true;
        setIsProcessing(false);
        setProcessingStage("idle");
        setPendingQuestion(null);
      }
    },
    [selectedDocument, isProcessing],
  );

  const value = useMemo(
    () => ({
      documents,
      selectedDocument,
      selectDocument,
      refreshDocuments,
      uploadAndIngest,
      ingest,
      isLoadingDocuments,
      isUploading,
      messages,
      sendMessage,
      isProcessing,
      processingStage,
      pendingQuestion,
      focusMessage,
      evidence,
      searchResults,
      runSearch,
      isSearching,
      highlightedChunkId,
      highlightEvidence: setHighlightedChunkId,
      error,
      clearError: () => setError(null),
      evidencePanelOpen,
      setEvidencePanelOpen,
      sidebarOpen,
      setSidebarOpen,
    }),
    [
      documents,
      selectedDocument,
      selectDocument,
      refreshDocuments,
      uploadAndIngest,
      ingest,
      isLoadingDocuments,
      isUploading,
      messages,
      sendMessage,
      isProcessing,
      processingStage,
      pendingQuestion,
      focusMessage,
      evidence,
      searchResults,
      runSearch,
      isSearching,
      highlightedChunkId,
      error,
      evidencePanelOpen,
      sidebarOpen,
    ],
  );

  return (
    <MuninnContext.Provider value={value}>{children}</MuninnContext.Provider>
  );
}

export function useMuninn() {
  const ctx = useContext(MuninnContext);
  if (!ctx) throw new Error("useMuninn must be used within MuninnProvider");
  return ctx;
}

function formatDocumentName(filename: string): string {
  return filename.replace(/\.pdf$/i, "").replace(/-/g, " ").toUpperCase();
}

export { formatDocumentName };
