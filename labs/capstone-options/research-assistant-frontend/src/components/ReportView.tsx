import Markdown from "react-markdown";
import { Download, Check, Share2 } from "lucide-react";

interface ReportViewProps {
  finalReport: string | null;
}

export function ReportView({ finalReport }: ReportViewProps) {
  if (!finalReport) return null;

  return (
    <div className="w-full max-w-4xl mx-auto animate-in fade-in zoom-in duration-300">
      <div className="mb-6 flex justify-between items-center px-4">
        <h2 className="text-2xl font-bold tracking-tight text-gray-900 flex items-center gap-2">
          <Check className="h-6 w-6 text-green-500" />
          Research Complete
        </h2>
        <div className="flex gap-2">
          <button className="inline-flex items-center gap-2 rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50">
            <Download className="h-4 w-4 text-gray-500" />
            Download
          </button>
          <button className="inline-flex items-center gap-2 rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600">
            <Share2 className="h-4 w-4" />
            Share
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
