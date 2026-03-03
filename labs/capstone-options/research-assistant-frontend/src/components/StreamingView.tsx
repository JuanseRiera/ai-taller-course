import { motion } from "framer-motion";
import { Loader2, User, BookOpen, PenTool, CheckCircle, BrainCircuit } from "lucide-react";
import { cn } from "../lib/utils";

interface StreamingViewProps {
  currentAgent: string | null;
  currentPreview: string;
}

const agentIcons: Record<string, React.ReactNode> = {
  Researcher: <BookOpen className="h-6 w-6 text-blue-500" />,
  Writer: <PenTool className="h-6 w-6 text-purple-500" />,
  Reviewer: <CheckCircle className="h-6 w-6 text-green-500" />,
  Supervisor: <BrainCircuit className="h-6 w-6 text-orange-500" />,
  default: <User className="h-6 w-6 text-gray-400" />,
};

export function StreamingView({ currentAgent, currentPreview }: StreamingViewProps) {
  const icon = agentIcons[currentAgent || "default"] || agentIcons.default;

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] px-4 text-center space-y-8 animate-in fade-in duration-500">
      <div className="relative">
        <div className="absolute inset-0 animate-ping rounded-full bg-blue-400 opacity-20"></div>
        <div className="relative rounded-full bg-white p-4 shadow-lg ring-1 ring-gray-900/5">
          {icon}
        </div>
      </div>

      <div className="space-y-4 max-w-2xl w-full">
        <h2 className="text-2xl font-semibold text-gray-900 tracking-tight flex items-center justify-center gap-2">
          {currentAgent ? `${currentAgent} is working...` : "Initializing..."}
          <Loader2 className="h-5 w-5 animate-spin text-gray-400" />
        </h2>
        
        <div className="relative overflow-hidden rounded-xl bg-gray-50 p-6 ring-1 ring-inset ring-gray-200 shadow-sm text-left">
          <div className="absolute top-0 left-0 w-1 h-full bg-blue-500 animate-pulse"></div>
          <p className="font-mono text-sm text-gray-600 whitespace-pre-wrap break-words min-h-[100px]">
             {currentPreview || "Waiting for agent output..."}
             <span className="inline-block w-2 h-4 ml-1 align-middle bg-blue-500 animate-pulse"></span>
          </p>
        </div>
      </div>
    </div>
  );
}
