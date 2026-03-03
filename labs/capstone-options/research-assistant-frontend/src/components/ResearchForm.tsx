import { useState } from "react";
import { ResearchRequest } from "../lib/types";
import { Search, Sliders, FileText, Loader2, ArrowRight } from "lucide-react";
import { cn } from "../lib/utils";

interface ResearchFormProps {
  onSubmit: (request: ResearchRequest) => void;
  isLoading: boolean;
}

export function ResearchForm({ onSubmit, isLoading }: ResearchFormProps) {
  const [question, setQuestion] = useState("");
  const [depth, setDepth] = useState<"brief" | "detailed" | "technical">("detailed");
  const [format, setFormat] = useState<"essay" | "bullet_points" | "table">("essay");
  const [iterations, setIterations] = useState(5);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (question.trim()) {
      onSubmit({
        question,
        depth,
        report_format: format,
        max_iterations: iterations,
      });
    }
  };

  return (
    <div className="mx-auto max-w-2xl w-full px-4 sm:px-6 lg:px-8 py-12">
      <div className="text-center mb-10">
        <h1 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
          Start New Research
        </h1>
        <p className="mt-4 text-lg leading-6 text-gray-500">
          Enter your topic and let our AI agents investigate for you.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="bg-white shadow-xl rounded-2xl border border-gray-100 p-8 space-y-8">
        <div>
          <label htmlFor="question" className="block text-sm font-medium leading-6 text-gray-900">
            Research Question
          </label>
          <div className="mt-2 relative rounded-md shadow-sm">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
              <Search className="h-5 w-5 text-gray-400" aria-hidden="true" />
            </div>
            <input
              type="text"
              name="question"
              id="question"
              className="block w-full rounded-md border-0 py-3 pl-10 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6 transition-shadow"
              placeholder="e.g., Impact of AI on healthcare..."
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              disabled={isLoading}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 gap-x-6 gap-y-8 sm:grid-cols-2">
          <div>
            <label className="block text-sm font-medium leading-6 text-gray-900 mb-3 flex items-center gap-2">
              <Sliders className="h-4 w-4 text-blue-500" /> Research Depth
            </label>
            <div className="flex rounded-md shadow-sm ring-1 ring-inset ring-gray-300">
              {["brief", "detailed", "technical"].map((opt) => (
                <button
                  key={opt}
                  type="button"
                  onClick={() => setDepth(opt as any)}
                  className={cn(
                    "relative flex-1 px-3 py-2 text-sm font-semibold first:rounded-l-md last:rounded-r-md focus:z-10 focus:ring-2 focus:ring-blue-600 focus:outline-none transition-colors capitalize",
                    depth === opt
                      ? "bg-blue-600 text-white hover:bg-blue-500"
                      : "bg-white text-gray-900 hover:bg-gray-50 ring-inset ring-gray-300"
                  )}
                >
                  {opt}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium leading-6 text-gray-900 mb-3 flex items-center gap-2">
              <FileText className="h-4 w-4 text-green-500" /> Report Format
            </label>
            <select
              value={format}
              onChange={(e) => setFormat(e.target.value as any)}
              className="block w-full rounded-md border-0 py-2.5 pl-3 pr-10 text-gray-900 ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-blue-600 sm:text-sm sm:leading-6 bg-white"
            >
              <option value="essay">Essay</option>
              <option value="bullet_points">Bullet Points</option>
              <option value="table">Table</option>
            </select>
          </div>
        </div>

        <div>
          <label htmlFor="iterations" className="block text-sm font-medium leading-6 text-gray-900 mb-2">
            Max Iterations: {iterations}
          </label>
          <input
            type="range"
            id="iterations"
            min="1"
            max="20"
            value={iterations}
            onChange={(e) => setIterations(parseInt(e.target.value))}
            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
          />
          <p className="mt-1 text-xs text-gray-500 text-right">Limit agent loops</p>
        </div>

        <button
          type="submit"
          disabled={!question.trim() || isLoading}
          className="flex w-full items-center justify-center rounded-lg bg-gray-900 px-3 py-3 text-sm font-semibold text-white shadow-sm hover:bg-gray-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gray-900 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Starting Research...
            </>
          ) : (
            <>
              Start Investigation <ArrowRight className="ml-2 h-4 w-4" />
            </>
          )}
        </button>
      </form>
    </div>
  );
}
