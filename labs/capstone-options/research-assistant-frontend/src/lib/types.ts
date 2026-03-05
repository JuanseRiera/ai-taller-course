import { ErrorCode } from "./errors";

export interface ResearchRequest {
  question: string;
  depth: "brief" | "detailed" | "technical";
  report_format: "essay" | "bullet_points" | "table";
  max_iterations: number;
}

export interface ProgressEvent {
  type: "progress";
  message: string;
  preview?: string;
}

export interface AgentLog {
  agent: string;
  role: string;
  content: string;
}

export interface ResultEvent {
  type: "result";
  data: {
    final_report: string;
    status: "complete" | "draft";
    conversation_history: AgentLog[];
    metadata?: Record<string, any>;
  };
}

export interface HistoryItem {
  id: string;
  timestamp: number;
  question: string;
  finalReport: string;
  status: "complete" | "draft";
  conversationHistory: AgentLog[];
}

export type ResearchStatus = "idle" | "streaming" | "completed" | "error";

export interface ResearchError {
  code: ErrorCode;
  message: string;
  userMessage: string;
  retryable: boolean;
  status?: number;
  details?: string;
  traceId: string;
  timestamp: number;
}

export interface ResearchState {
  id: string | null;
  status: ResearchStatus;
  currentAgent: string | null;
  currentPreview: string;
  traceId: string | null;
  finalReport: string | null;
  reportStatus: "complete" | "draft" | null;
  conversationHistory: AgentLog[];
  error: ResearchError | null;
}
