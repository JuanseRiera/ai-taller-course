import { useState } from "react";
import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Download, Check, Copy, AlertCircle } from "lucide-react";

interface ReportViewProps {
  finalReport: string | null;
  reportStatus?: "complete" | "draft" | null;
}

export function ReportView({ finalReport, reportStatus = "complete" }: ReportViewProps) {
  const [copied, setCopied] = useState(false);

  if (!finalReport) return null;

  const handleDownload = () => {
    const blob = new Blob([finalReport], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "research-report.md";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(finalReport);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy text: ", err);
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto animate-in fade-in zoom-in duration-300">
      {reportStatus === "draft" && (
        <div className="mb-4 rounded-md bg-orange-50 p-4 border border-orange-200 shadow-sm animate-in fade-in slide-in-from-top-2">
          <div className="flex items-center">
            <AlertCircle className="h-5 w-5 text-orange-400 mr-2" aria-hidden="true" />
            <h3 className="text-sm font-medium text-orange-800">
              Draft Report
            </h3>
          </div>
          <div className="mt-1 ml-7 text-sm text-orange-700">
            <p>This research was stopped before final approval (likely due to iteration limits). The content below is a draft.</p>
          </div>
        </div>
      )}

      <div className="mb-6 flex justify-between items-center px-4">
        <h2 className="text-2xl font-bold tracking-tight text-gray-900 flex items-center gap-2">
          {reportStatus === "complete" ? (
            <Check className="h-6 w-6 text-green-500" />
          ) : (
            <AlertCircle className="h-6 w-6 text-orange-500" />
          )}
          {reportStatus === "complete" ? "Research Complete" : "Research Draft"}
        </h2>
        <div className="flex gap-2">
          <button
            onClick={handleDownload}
            className="inline-flex items-center gap-2 rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 transition-colors"
          >
            <Download className="h-4 w-4 text-gray-500" />
            Download
          </button>
          <button
            onClick={handleCopy}
            className={`inline-flex items-center gap-2 rounded-md px-3 py-2 text-sm font-semibold shadow-sm transition-all duration-200 ${
              copied
                ? "bg-green-600 text-white"
                : "bg-blue-600 text-white hover:bg-blue-500"
            }`}
          >
            {copied ? (
              <>
                <Check className="h-4 w-4" />
                Copied!
              </>
            ) : (
              <>
                <Copy className="h-4 w-4" />
                Copy
              </>
            )}
          </button>
        </div>
      </div>
      
      <div className="bg-white px-8 py-10 shadow-lg ring-1 ring-gray-900/5 sm:rounded-3xl lg:px-12 xl:px-16 min-h-[500px] overflow-x-auto">
        <article className="prose prose-slate prose-lg max-w-none prose-headings:font-semibold prose-headings:tracking-tight prose-a:text-blue-600 hover:prose-a:text-blue-500 prose-table:border-collapse prose-th:border prose-th:border-gray-300 prose-th:p-3 prose-th:bg-gray-50 prose-td:border prose-td:border-gray-300 prose-td:p-3">
          <Markdown remarkPlugins={[remarkGfm]}>{finalReport}</Markdown>
        </article>
      </div>
    </div>
  );
}
