import { useState } from "react";
import { AgentLog } from "../lib/types";
import { ChevronDown, ChevronRight, User, Terminal, List, Clock, ShieldAlert } from "lucide-react";
import { cn } from "../lib/utils";
import { format } from "date-fns";

interface AgentLogsProps {
  logs: AgentLog[];
}

export function AgentLogs({ logs }: AgentLogsProps) {
  const [isOpen, setIsOpen] = useState(false);

  if (!logs || logs.length === 0) return null;

  return (
    <div className="mt-8 border-t border-gray-200 pt-6 animate-in fade-in slide-in-from-bottom-4">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex w-full items-center justify-between rounded-lg bg-gray-50 px-4 py-3 text-left text-sm font-medium text-gray-900 hover:bg-gray-100 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
      >
        <span className="flex items-center gap-2">
          <Terminal className="h-4 w-4 text-gray-500" />
          Agent Trace Log ({logs.length} interactions)
        </span>
        {isOpen ? (
          <ChevronDown className="h-4 w-4 text-gray-500" />
        ) : (
          <ChevronRight className="h-4 w-4 text-gray-500" />
        )}
      </button>

      {isOpen && (
        <div className="mt-4 space-y-4 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
          {logs.map((log, index) => (
            <div key={index} className="flex gap-4 p-4 rounded-lg bg-white border border-gray-100 shadow-sm transition-all hover:shadow-md">
              <div className="flex-shrink-0">
                <div className={cn(
                  "h-8 w-8 rounded-full flex items-center justify-center text-white text-xs font-bold",
                  log.agent === "User" ? "bg-gray-500" :
                  log.agent === "Supervisor" ? "bg-orange-500" :
                  log.agent === "Researcher" ? "bg-blue-500" :
                  log.agent === "Writer" ? "bg-purple-500" :
                  "bg-green-500"
                )}>
                  {log.agent.charAt(0)}
                </div>
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <p className="text-sm font-semibold text-gray-900">{log.agent}</p>
                  <span className="text-xs text-gray-400 font-mono">Step {index + 1}</span>
                </div>
                
                <div className="prose prose-sm max-w-none text-gray-600 font-mono text-xs bg-gray-50 p-3 rounded-md overflow-x-auto whitespace-pre-wrap border border-gray-100">
                  {log.content}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
