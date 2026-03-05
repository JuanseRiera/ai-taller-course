"use client";

import { useState } from "react";
import { AlertTriangle, RefreshCw, ChevronDown, ChevronUp } from "lucide-react";
import { ResearchError } from "@/lib/types";

interface ErrorDisplayProps {
  error: ResearchError;
  onRetry: () => void;
  onReset: () => void;
}

export function ErrorDisplay({ error, onRetry, onReset }: ErrorDisplayProps) {
  const [showDetails, setShowDetails] = useState(false);

  return (
    <div className="rounded-xl bg-red-50 p-6 border border-red-200">
      <div className="flex items-start gap-3">
        <AlertTriangle className="h-5 w-5 text-red-500 mt-0.5" aria-hidden="true" />
        <div className="flex-1">
          <h3 className="text-sm font-semibold text-red-900">Something went wrong</h3>
          <p className="mt-2 text-sm text-red-800">{error.userMessage}</p>
          <p className="mt-2 text-xs text-red-700">Reference ID: {error.traceId}</p>

          <div className="mt-4 flex flex-wrap gap-2">
            {error.retryable && (
              <button
                type="button"
                onClick={onRetry}
                className="inline-flex items-center gap-2 rounded-md bg-red-700 px-3 py-1.5 text-sm font-medium text-white hover:bg-red-800"
              >
                <RefreshCw className="h-4 w-4" />
                Retry
              </button>
            )}

            <button
              type="button"
              onClick={onReset}
              className="inline-flex items-center rounded-md bg-red-100 px-3 py-1.5 text-sm font-medium text-red-900 hover:bg-red-200"
            >
              Start New Research
            </button>

          </div>

          <button
            type="button"
            onClick={() => setShowDetails((prev) => !prev)}
            className="mt-4 inline-flex items-center gap-1 text-xs text-red-800 hover:text-red-900"
          >
            {showDetails ? (
              <>
                <ChevronUp className="h-3.5 w-3.5" /> Hide technical details
              </>
            ) : (
              <>
                <ChevronDown className="h-3.5 w-3.5" /> Show technical details
              </>
            )}
          </button>

          {showDetails && (
            <pre className="mt-3 rounded-md bg-red-100 p-3 text-xs text-red-900 overflow-auto">
{JSON.stringify(
  {
    code: error.code,
    message: error.message,
    status: error.status,
    details: error.details,
    timestamp: new Date(error.timestamp).toISOString(),
  },
  null,
  2
)}
            </pre>
          )}
        </div>
      </div>
    </div>
  );
}
