import { formatDistanceToNow } from "date-fns";
import { Plus, History, Trash2 } from "lucide-react";
import { HistoryItem } from "../lib/types";

interface SidebarProps {
  history: HistoryItem[];
  onSelect: (item: HistoryItem) => void;
  onNewResearch: () => void;
  onDelete: (id: string) => void;
  selectedId?: string | null;
}

export function Sidebar({ history, onSelect, onNewResearch, onDelete, selectedId }: SidebarProps) {
  return (
    <aside className="fixed left-0 top-0 h-full w-64 border-r border-gray-200 bg-gray-50/50 p-4 shadow-sm z-50">
      <div className="mb-8 flex items-center gap-2 px-2">
        <div className="h-8 w-8 rounded-lg bg-blue-600 flex items-center justify-center">
          <History className="h-5 w-5 text-white" />
        </div>
        <h1 className="text-lg font-semibold text-gray-900">Research Lab</h1>
      </div>

      <button
        onClick={onNewResearch}
        className="mb-6 flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
      >
        <Plus className="h-4 w-4" />
        New Research
      </button>

      <div className="space-y-1">
        <h2 className="mb-2 px-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
          History
        </h2>
        {history.length === 0 ? (
          <p className="px-2 text-sm text-gray-400 italic">No research yet</p>
        ) : (
          <div className="space-y-1 overflow-y-auto max-h-[calc(100vh-200px)]">
            {history.map((item) => (
              <div key={item.id} className="group relative flex items-center">
                <button
                  onClick={() => onSelect(item)}
                  className={`w-full rounded-md pl-3 pr-10 py-2.5 text-left text-sm transition-colors ${
                    selectedId === item.id
                      ? "bg-white text-blue-600 shadow-sm ring-1 ring-gray-200"
                      : "text-gray-600 hover:bg-gray-100/50 hover:text-gray-900"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <p className="truncate font-medium flex-1 mr-2">{item.question}</p>
                    {item.status === "draft" && (
                      <span className="inline-flex items-center rounded-full bg-orange-100 px-1.5 py-0.5 text-[10px] font-medium text-orange-800 flex-shrink-0">
                        Draft
                      </span>
                    )}
                  </div>
                  <p className="mt-0.5 text-xs text-gray-400">
                    {formatDistanceToNow(item.timestamp, { addSuffix: true })}
                  </p>
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete(item.id);
                  }}
                  className="absolute right-2 p-1.5 text-gray-400 opacity-0 transition-all hover:bg-red-50 hover:text-red-500 group-hover:opacity-100 rounded-md"
                  title="Delete research"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </aside>
  );
}
