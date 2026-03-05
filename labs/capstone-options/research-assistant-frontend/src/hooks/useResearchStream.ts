import { useState, useCallback, useEffect, useRef } from "react";
import { fetchEventSource } from "@microsoft/fetch-event-source";
import {
  ResearchRequest,
  ResearchState,
  ResultEvent,
  HistoryItem,
  ResearchError,
} from "../lib/types";
import { generateId, generateTraceId } from "../lib/utils";
import {
  ApiError,
  StreamError,
  TimeoutError,
  toAppError,
  getUserMessage,
} from "../lib/errors";
import { logger } from "../lib/logger";

const BACKEND_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000";
const STREAM_TIMEOUT_MS = 60_000;

function createInitialState(): ResearchState {
  return {
    id: null,
    status: "idle",
    currentAgent: null,
    currentPreview: "",
    traceId: null,
    finalReport: null,
    reportStatus: null,
    conversationHistory: [],
    error: null,
  };
}

function toResearchError(error: unknown, traceId: string): ResearchError {
  const appError = toAppError(error);

  return {
    code: appError.code,
    message: appError.message,
    userMessage: getUserMessage(appError),
    retryable: appError.retryable,
    status: appError.status,
    details: appError.details,
    traceId,
    timestamp: Date.now(),
  };
}

export function useResearchStream() {
  const [state, setState] = useState<ResearchState>(createInitialState());
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const lastRequestRef = useRef<ResearchRequest | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem("research_history");
    if (!saved) {
      return;
    }

    try {
      setHistory(JSON.parse(saved));
    } catch (error) {
      logger.warn("Failed to parse research history", {
        context: { error: error instanceof Error ? error.message : "unknown" },
      });
      localStorage.removeItem("research_history");
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
      if (prev.id !== id) {
        return prev;
      }

      return createInitialState();
    });
  }, []);

  const clearState = useCallback(() => {
    setState(createInitialState());
  }, []);

  const loadHistoryItem = useCallback((item: HistoryItem) => {
    setState({
      id: item.id,
      status: "completed",
      currentAgent: null,
      currentPreview: "",
      traceId: null,
      finalReport: item.finalReport,
      reportStatus: item.status,
      conversationHistory: item.conversationHistory,
      error: null,
    });
  }, []);

  const startResearch = useCallback(
    async (request: ResearchRequest) => {
      const traceId = generateTraceId();
      const controller = new AbortController();
      let timeoutId: ReturnType<typeof setTimeout> | undefined;
      let isCompleted = false;

      const resetTimeout = () => {
        if (timeoutId) {
          clearTimeout(timeoutId);
        }

        timeoutId = setTimeout(() => {
          if (!isCompleted) {
            logger.error("Research stream timed out", { traceId });
            controller.abort("stream-timeout");
          }
        }, STREAM_TIMEOUT_MS);
      };

      lastRequestRef.current = request;

      setState({
        id: null,
        status: "streaming",
        currentAgent: "Orchestrator",
        currentPreview: "Initializing agents...",
        traceId,
        finalReport: null,
        reportStatus: null,
        conversationHistory: [],
        error: null,
      });

      logger.info("Starting research request", {
        traceId,
        context: {
          depth: request.depth,
          reportFormat: request.report_format,
          maxIterations: request.max_iterations,
        },
      });

      try {
        resetTimeout();

        await fetchEventSource(`${BACKEND_BASE_URL}/research`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-Trace-Id": traceId,
          },
          body: JSON.stringify(request),
          signal: controller.signal,
          onopen: async (response) => {
            if (response.ok) {
              return;
            }

            const responseBody = await response.text();
            logger.error("Research stream connection failed", {
              traceId,
              context: {
                status: response.status,
                statusText: response.statusText,
                responseBody,
              },
            });

            throw new ApiError(
              response.status,
              `Failed to connect to research service (${response.status})`,
              responseBody || response.statusText
            );
          },
          onmessage: (msg) => {
            resetTimeout();

            if (msg.event === "close") {
              isCompleted = true;
              if (timeoutId) {
                clearTimeout(timeoutId);
              }
              controller.abort();
              return;
            }

            try {
              const data = JSON.parse(msg.data);

              if (data.type === "progress") {
                setState((prev) => ({
                  ...prev,
                  currentAgent: data.message?.split(" ")[0] ?? "Agent",
                  currentPreview: data.preview || data.message || "Working...",
                }));
                return;
              }

              if (data.type === "result") {
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
                isCompleted = true;
                if (timeoutId) {
                  clearTimeout(timeoutId);
                }

                setState((prev) => ({
                  ...prev,
                  id: historyItem.id,
                  status: "completed",
                  finalReport: result.data.final_report,
                  reportStatus: result.data.status,
                  conversationHistory: result.data.conversation_history,
                }));

                logger.info("Research stream completed", {
                  traceId,
                  context: { historyId: historyItem.id, reportStatus: result.data.status },
                });

                controller.abort();
                return;
              }

              if (data.type === "error") {
                throw new StreamError("Research service reported an error", data.message);
              }

              logger.warn("Received unknown stream event", {
                traceId,
                context: { eventType: data.type },
              });
            } catch (error) {
              logger.warn("Failed to parse stream message", {
                traceId,
                context: {
                  rawData: msg.data,
                  error: error instanceof Error ? error.message : "unknown",
                },
              });
            }
          },
          onerror: (error) => {
            const appError = toAppError(error);
            logger.error("Research stream error", {
              traceId,
              context: {
                code: appError.code,
                message: appError.message,
                details: appError.details,
              },
            });
            throw appError;
          },
        });
      } catch (error) {
        const appError = toAppError(error);
        const normalizedError =
          controller.signal.aborted && controller.signal.reason === "stream-timeout"
            ? new TimeoutError("The research stream stopped responding")
            : appError;

        const researchError = toResearchError(normalizedError, traceId);
        logger.error("Research request failed", {
          traceId,
          context: {
            code: researchError.code,
            message: researchError.message,
            status: researchError.status,
          },
        });

        setState((prev) => ({
          ...prev,
          status: "error",
          error: researchError,
        }));
      } finally {
        if (timeoutId) {
          clearTimeout(timeoutId);
        }
      }
    },
    [saveToHistory]
  );

  const retryLastResearch = useCallback(async () => {
    if (!lastRequestRef.current) {
      return;
    }

    await startResearch(lastRequestRef.current);
  }, [startResearch]);

  return {
    state,
    history,
    startResearch,
    retryLastResearch,
    clearState,
    loadHistoryItem,
    deleteHistoryItem,
  };
}
