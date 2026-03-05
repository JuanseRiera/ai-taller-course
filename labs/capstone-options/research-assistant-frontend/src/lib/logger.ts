type LogLevel = "info" | "warn" | "error";

export interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  traceId?: string;
  context?: Record<string, unknown>;
}

const MAX_LOG_ENTRIES = 200;
const inMemoryLogs: LogEntry[] = [];

function write(level: LogLevel, message: string, options: { traceId?: string; context?: Record<string, unknown> } = {}) {
  const entry: LogEntry = {
    timestamp: new Date().toISOString(),
    level,
    message,
    traceId: options.traceId,
    context: options.context,
  };

  inMemoryLogs.push(entry);
  if (inMemoryLogs.length > MAX_LOG_ENTRIES) {
    inMemoryLogs.shift();
  }

  const payload = {
    message: entry.message,
    traceId: entry.traceId,
    ...entry.context,
  };

  if (level === "info") {
    console.info("[frontend]", payload);
  } else if (level === "warn") {
    console.warn("[frontend]", payload);
  } else {
    console.error("[frontend]", payload);
  }
}

export const logger = {
  info(message: string, options?: { traceId?: string; context?: Record<string, unknown> }) {
    write("info", message, options);
  },
  warn(message: string, options?: { traceId?: string; context?: Record<string, unknown> }) {
    write("warn", message, options);
  },
  error(message: string, options?: { traceId?: string; context?: Record<string, unknown> }) {
    write("error", message, options);
  },
};

export function getLogsSnapshot(): LogEntry[] {
  return [...inMemoryLogs];
}
