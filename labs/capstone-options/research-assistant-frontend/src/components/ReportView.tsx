import { useState } from "react";
import Markdown from "react-markdown";
import { Download, Check, Copy } from "lucide-react";

interface ReportViewProps {
  finalReport: string | null;
}

export function ReportView({ finalReport }: ReportViewProps) {
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
      <div className="mb-6 flex justify-between items-center px-4">
        <h2 className="text-2xl font-bold tracking-tight text-gray-900 flex items-center gap-2">
          <Check className="h-6 w-6 text-green-500" />
          Research Complete
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
      
      <div className="bg-white px-8 py-10 shadow-lg ring-1 ring-gray-900/5 sm:rounded-3xl lg:px-12 xl:px-16 min-h-[500px]">
        <article className="prose prose-slate prose-lg max-w-none prose-headings:font-semibold prose-headings:tracking-tight prose-a:text-blue-600 hover:prose-a:text-blue-500">
          <Markdown>{finalReport}</Markdown>
        </article>
      </div>
    </div>
  );
}
