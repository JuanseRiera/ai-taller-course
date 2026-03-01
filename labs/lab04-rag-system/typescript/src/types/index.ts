export interface RetrievalExample {
  question: string;
  expected_answer: string;
  relevant_files: string[];
}

export interface EvaluationResult {
  question: string;
  answer: string;
  expected_answer: string;
  metrics: {
    retrieval_precision: number;
    retrieval_recall: number;
    generation_relevance: number;
    generation_correctness: number;
    latency_ms: number;
  };
}

export interface RAGMetrics {
  retrieval_precision: number;
  retrieval_recall: number;
  generation_relevance: number;
  generation_correctness: number;
  avg_latency_ms: number;
}
