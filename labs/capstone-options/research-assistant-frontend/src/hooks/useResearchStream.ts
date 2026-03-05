import { useState, useCallback, useEffect } from "react";
import { fetchEventSource } from "@microsoft/fetch-event-source";
import {
  ResearchRequest,
  ResearchState,
  ResultEvent,
  HistoryItem,
  AgentLog,
} from "../lib/types";
import { generateId } from "../lib/utils";

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/research";

export function useResearchStream() {
  const [state, setState] = useState<ResearchState>({
    id: null,
    status: "idle",
    currentAgent: null,
    currentPreview: "",
    finalReport: null,
    reportStatus: null,
    conversationHistory: [],
    error: null,
  });

  const [history, setHistory] = useState<HistoryItem[]>([]);

  // Load history from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem("research_history");
    if (saved) {
      try {
        setHistory(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to parse history", e);
      }
    }
  }, []);

  const saveToHistory = useCallback((item: HistoryItem) => {
    setHistory((prev) => {
      const updated = [item, ...prev];
      localStorage.setItem("research_history", JSON.stringify(updated));
      return updated;
    });
  }, []);

  const deleteHistoryItem = useCallback((id: string) => {
    setHistory((prev) => {
      const updated = prev.filter((item) => item.id !== id);
      localStorage.setItem("research_history", JSON.stringify(updated));
      return updated;
    });

    setState((prev) => {
      if (prev.id === id) {
        return {
          id: null,
          status: "idle",
          currentAgent: null,
          currentPreview: "",
          finalReport: null,
          reportStatus: null,
          conversationHistory: [],
          error: null,
        };
      }
      return prev;
    });
  }, []);

  const clearState = useCallback(() => {
    setState({
      id: null,
      status: "idle",
      currentAgent: null,
      currentPreview: "",
      finalReport: null,
      reportStatus: null,
      conversationHistory: [],
      error: null,
    });
  }, []);

  const loadHistoryItem = useCallback((item: HistoryItem) => {
    setState({
      id: item.id,
      status: "completed",
      currentAgent: null,
      currentPreview: "",
      finalReport: item.finalReport,
      reportStatus: item.status,
      conversationHistory: item.conversationHistory,
      error: null,
    });
  }, []);

  const startResearch = useCallback(async (request: ResearchRequest) => {
    setState({
      id: null,
      status: "streaming",
      currentAgent: "Orchestrator",
      currentPreview: "Initializing agents...",
      finalReport: null,
      reportStatus: null,
      conversationHistory: [],
      error: null,
    });

    const controller = new AbortController();

    try {
      await fetchEventSource(BACKEND_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(request),
        signal: controller.signal,
        onopen: async (response) => {
          if (!response.ok) {
            throw new Error(`Failed to connect: ${response.statusText}`);
          }
        },
        onmessage: (msg) => {
          if (msg.event === "close") {
            controller.abort();
            return;
          }

          try {
            const data = JSON.parse(msg.data);

            if (data.type === "progress") {
              setState((prev) => ({
                ...prev,
                currentAgent: data.message.split(" ")[0], // Simple extraction
                currentPreview: data.preview || data.message,
              }));
            } else if (data.type === "result") {
              const result = data as ResultEvent;
              const historyItem: HistoryItem = {
                id: generateId(),
                timestamp: Date.now(),
                question: request.question,
                finalReport: result.data.final_report,
                status: result.data.status,
                conversationHistory: result.data.conversation_history,
              };

              saveToHistory(historyItem);

              setState((prev) => ({
                ...prev,
                id: historyItem.id,
                status: "completed",
                finalReport: result.data.final_report,
                reportStatus: result.data.status,
                conversationHistory: result.data.conversation_history,
              }));
              controller.abort();
            } else if (data.type === "error") {
              throw new Error(data.message);
            }
          } catch (err) {
            console.error("Error parsing stream message", err);
          }
        },
        onerror: (err) => {
          console.error("Stream error:", err);
          setState((prev) => ({
            ...prev,
            status: "error",
            error: err.message || "An error occurred during research",
          }));
          throw err; // Rethrow to stop retry logic if needed
        },
      });
    } catch (err: any) {
      setState((prev) => ({
        ...prev,
        status: "error",
        error: err.message || "Failed to start research",
      }));
    }
  }, [saveToHistory]);

  return {
    state,
    history,
    startResearch,
    clearState,
    loadHistoryItem,
    deleteHistoryItem,
  };
}
