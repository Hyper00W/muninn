export interface Document {
  id: number;
  filename: string;
  document_type: string | null;
  company: string | null;
  page_count: number | null;
  status: string;
  created_at: string;
}

export interface SourceCitation {
  document_id: number;
  filename: string;
  page_number: number;
  chunk_id: number;
}

export interface EvidenceItem {
  chunk_id: number;
  content: string;
  document_id: number;
  filename: string;
  page_number: number;
  score: number;
}

export interface ChatResponse {
  question: string;
  answer: string;
  sources: SourceCitation[];
  retrieved_evidence: EvidenceItem[];
}

export interface SearchResult {
  chunk_id: number;
  content: string;
  document_id: number;
  filename: string;
  page_number: number;
  score: number;
}

export interface ChatMessage {
  id: string;
  question: string;
  answer: string;
  sources: SourceCitation[];
  evidence: EvidenceItem[];
  timestamp: Date;
}

export type ProcessingStage =
  | "understanding"
  | "searching"
  | "analyzing"
  | "preparing"
  | "idle";

export interface IngestResponse {
  document_id: number;
  status: string;
  chunks_created: number;
}
