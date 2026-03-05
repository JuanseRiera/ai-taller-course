export type ErrorCode =
  | "NETWORK_ERROR"
  | "API_ERROR"
  | "STREAM_ERROR"
  | "TIMEOUT_ERROR"
  | "UNKNOWN_ERROR";

export class AppError extends Error {
  code: ErrorCode;
  retryable: boolean;
  status?: number;
  details?: string;

  constructor(
    message: string,
    options: {
      code?: ErrorCode;
      retryable?: boolean;
      status?: number;
      details?: string;
    } = {}
  ) {
    super(message);
    this.name = "AppError";
    this.code = options.code ?? "UNKNOWN_ERROR";
    this.retryable = options.retryable ?? false;
    this.status = options.status;
    this.details = options.details;
  }
}

export class NetworkError extends AppError {
  constructor(message = "Unable to reach the research service", details?: string) {
    super(message, { code: "NETWORK_ERROR", retryable: true, details });
    this.name = "NetworkError";
  }
}

export class ApiError extends AppError {
  constructor(status: number, message: string, details?: string) {
    super(message, {
      code: "API_ERROR",
      retryable: status >= 500 || status === 429,
      status,
      details,
    });
    this.name = "ApiError";
  }
}

export class StreamError extends AppError {
  constructor(message: string, details?: string) {
    super(message, { code: "STREAM_ERROR", retryable: true, details });
    this.name = "StreamError";
  }
}

export class TimeoutError extends AppError {
  constructor(message = "The research stream timed out", details?: string) {
    super(message, { code: "TIMEOUT_ERROR", retryable: true, details });
    this.name = "TimeoutError";
  }
}

export function toAppError(error: unknown): AppError {
  if (error instanceof AppError) {
    return error;
  }

  if (error instanceof Error) {
    const lowered = error.message.toLowerCase();

    if (lowered.includes("fetch") || lowered.includes("network") || lowered.includes("failed to connect")) {
      return new NetworkError("Unable to connect to the research service", error.message);
    }

    if (lowered.includes("timeout")) {
      return new TimeoutError("The request took too long and was stopped", error.message);
    }

    return new AppError("Something went wrong", {
      code: "UNKNOWN_ERROR",
      details: error.message,
      retryable: false,
    });
  }

  return new AppError("Something went wrong", {
    code: "UNKNOWN_ERROR",
    retryable: false,
  });
}

export function getUserMessage(error: AppError): string {
  switch (error.code) {
    case "NETWORK_ERROR":
      return "We could not reach the research service. Please check your connection and try again.";
    case "API_ERROR":
      return "The research service returned an unexpected response. Please try again in a moment.";
    case "STREAM_ERROR":
      return "The live research stream was interrupted. Please retry the request.";
    case "TIMEOUT_ERROR":
      return "The research took too long to respond. Please retry.";
    default:
      return "Something went wrong. Please try again.";
  }
}
