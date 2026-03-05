import { renderHook, act, waitFor } from "@testing-library/react";
import { fetchEventSource } from "@microsoft/fetch-event-source";
import { useResearchStream } from "./useResearchStream";
import {
  createMockHistoryItem,
  createMockResearchRequest,
  createMockResultEvent,
} from "@/test/factories";

jest.mock("@microsoft/fetch-event-source", () => ({
  fetchEventSource: jest.fn(),
}));

jest.mock("../lib/utils", () => ({
  generateId: jest.fn(() => "mock-generated-id"),
  generateTraceId: jest.fn(() => "trace-test-123"),
}));

const mockedFetchEventSource = jest.mocked(fetchEventSource);

describe("useResearchStream", () => {
  beforeEach(() => {
    localStorage.clear();
    jest.clearAllMocks();
  });

  it("loads history from localStorage on mount", async () => {
    const history = [createMockHistoryItem({ id: "stored-1" })];
    localStorage.setItem("research_history", JSON.stringify(history));

    const { result } = renderHook(() => useResearchStream());

    await waitFor(() => {
      expect(result.current.history).toEqual(history);
    });
  });

  it("streams progress updates and completes with result event", async () => {
    const request = createMockResearchRequest();
    const resultEvent = createMockResultEvent({
      final_report: "# Completed report",
      status: "complete",
    });

    mockedFetchEventSource.mockImplementation(async (_url, options) => {
      options.onmessage?.({
        id: "1",
        event: "message",
        data: JSON.stringify({
          type: "progress",
          message: "Researcher searching sources",
          preview: "Looking for recent studies",
        }),
      });

      options.onmessage?.({
        id: "2",
        event: "message",
        data: JSON.stringify(resultEvent),
      });
    });

    const { result } = renderHook(() => useResearchStream());

    await act(async () => {
      await result.current.startResearch(request);
    });

    await waitFor(() => {
      expect(result.current.state.status).toBe("completed");
    });

    expect(result.current.state.currentAgent).toBe("Researcher");
    expect(result.current.state.finalReport).toBe("# Completed report");
    expect(result.current.state.id).toBe("mock-generated-id");
    expect(result.current.state.traceId).toBe("trace-test-123");
    expect(result.current.history).toHaveLength(1);
    expect(result.current.history[0].question).toBe(request.question);
    expect(mockedFetchEventSource).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        headers: expect.objectContaining({ "X-Trace-Id": "trace-test-123" }),
      })
    );
  });

  it("sets error state when stream throws", async () => {
    const request = createMockResearchRequest();

    mockedFetchEventSource.mockRejectedValue(new Error("Backend unavailable"));

    const { result } = renderHook(() => useResearchStream());

    await act(async () => {
      await result.current.startResearch(request);
    });

    await waitFor(() => {
      expect(result.current.state.status).toBe("error");
    });

    expect(result.current.state.error).toMatchObject({
      code: "UNKNOWN_ERROR",
      traceId: "trace-test-123",
      userMessage: "Something went wrong. Please try again.",
    });
  });

  it("deletes history item and resets active state when deleted id is selected", async () => {
    const history = [createMockHistoryItem({ id: "item-1" })];
    localStorage.setItem("research_history", JSON.stringify(history));

    const { result } = renderHook(() => useResearchStream());

    await waitFor(() => {
      expect(result.current.history).toHaveLength(1);
    });

    act(() => {
      result.current.loadHistoryItem(history[0]);
    });

    act(() => {
      result.current.deleteHistoryItem("item-1");
    });

    expect(result.current.history).toEqual([]);
    expect(result.current.state.status).toBe("idle");
    expect(result.current.state.id).toBeNull();
    expect(localStorage.getItem("research_history")).toBe("[]");
  });
});
