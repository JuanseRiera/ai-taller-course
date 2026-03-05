"use client";

import { useResearchStream } from "@/hooks/useResearchStream";
import { Sidebar } from "@/components/Sidebar";
import { ResearchForm } from "@/components/ResearchForm";
import { StreamingView } from "@/components/StreamingView";
import { ReportView } from "@/components/ReportView";
import { AgentLogs } from "@/components/AgentLogs";
import { AnimatePresence, motion } from "framer-motion";
import { Loader2 } from "lucide-react";

export default function Dashboard() {
  const {
    state,
    history,
    startResearch,
    clearState,
    loadHistoryItem
  } = useResearchStream();

  return (
    <div className="flex h-screen bg-gray-50 text-gray-900 font-sans antialiased overflow-hidden selection:bg-blue-100 selection:text-blue-900">
      <Sidebar
        history={history}
        onSelect={loadHistoryItem}
        onNewResearch={clearState}
        selectedId={state.status === "completed" ? undefined : undefined} // Ideally pass selected ID logic here
      />

      <main className="flex-1 ml-64 overflow-y-auto relative h-full">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 min-h-full flex flex-col">
          
          <AnimatePresence mode="wait">
            {state.status === "idle" && (
              <motion.div
                key="form"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
                className="flex-1 flex flex-col justify-center"
              >
                <ResearchForm onSubmit={startResearch} isLoading={false} />
              </motion.div>
            )}

            {state.status === "streaming" && (
              <motion.div
                key="streaming"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 1.05 }}
                transition={{ duration: 0.4 }}
                className="flex-1 flex flex-col justify-center items-center py-12"
              >
                <StreamingView
                  currentAgent={state.currentAgent}
                  currentPreview={state.currentPreview}
                />
              </motion.div>
            )}

            {(state.status === "completed" || state.status === "error") && (
              <motion.div
                key="result"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
                className="flex-1 py-8"
              >
                {state.error ? (
                  <div className="rounded-md bg-red-50 p-4 border border-red-200">
                    <div className="flex">
                      <div className="flex-shrink-0">
                        <Loader2 className="h-5 w-5 text-red-400" aria-hidden="true" />
                      </div>
                      <div className="ml-3">
                        <h3 className="text-sm font-medium text-red-800">
                          Research Error
                        </h3>
                        <div className="mt-2 text-sm text-red-700">
                          <p>{state.error}</p>
                        </div>
                        <button
                          type="button"
                          onClick={clearState}
                          className="mt-4 rounded-md bg-red-100 px-2 py-1.5 text-sm font-medium text-red-800 hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
                        >
                          Try Again
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <>
                    <ReportView finalReport={state.finalReport} reportStatus={state.reportStatus} />
                    <div className="mt-12 mx-auto max-w-4xl px-8">
                       <AgentLogs logs={state.conversationHistory} />
                    </div>
                  </>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}
