import {
  AgentLog,
  HistoryItem,
  ResearchRequest,
  ResearchState,
  ResultEvent,
} from "@/lib/types";

export const createMockResearchRequest = (
  overrides: Partial<ResearchRequest> = {}
): ResearchRequest => ({
  question: "What are the main impacts of AI on healthcare?",
  depth: "detailed",
  report_format: "essay",
  max_iterations: 5,
  ...overrides,
});

export const createMockAgentLog = (
  overrides: Partial<AgentLog> = {}
): AgentLog => ({
  agent: "Researcher",
  role: "assistant",
  content: "Collecting sources and summarizing findings.",
  ...overrides,
});

export const createMockResultEvent = (
  overrides: Partial<ResultEvent["data"]> = {}
): ResultEvent => ({
  type: "result",
  data: {
    final_report: "# Final Report\n\nKey findings go here.",
    status: "complete",
    conversation_history: [createMockAgentLog()],
    ...overrides,
  },
});

export const createMockHistoryItem = (
  overrides: Partial<HistoryItem> = {}
): HistoryItem => ({
  id: "history-item-1",
  timestamp: 1700000000000,
  question: "How does AI affect software engineering?",
  finalReport: "# Stored report",
  status: "complete",
  conversationHistory: [createMockAgentLog()],
  ...overrides,
});

export const createMockResearchState = (
  overrides: Partial<ResearchState> = {}
): ResearchState => {
  const { traceId, ...rest } = overrides;

  return {
    id: null,
    status: "idle",
    currentAgent: null,
    currentPreview: "",
    traceId: traceId ?? null,
    finalReport: null,
    reportStatus: null,
    conversationHistory: [],
    error: null,
    ...rest,
  };
};
