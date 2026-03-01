import { geminiClient } from '../utils/gemini-client.js';
import { VectorStore, VectorDocument } from './vector-store.js';
import { CodeSplitter } from '../utils/code-splitter.js';
import { RetrievalExample, EvaluationResult } from '../types/index.js';

export class RAGService {
  private vectorStore: VectorStore;
  private splitter: CodeSplitter;

  constructor() {
    this.vectorStore = new VectorStore();
    this.splitter = new CodeSplitter();
  }

  async indexFiles(files: Record<string, string>): Promise<{ indexedCount: number; chunks: number }> {
    console.log(`[INDEX] Starting indexing for ${Object.keys(files).length} files.`);
    let chunkCount = 0;
    
    // Clear existing index for this POC to ensure fresh state
    this.vectorStore.clear();

    for (const [filename, content] of Object.entries(files)) {
      const fileChunks = this.splitter.split(filename, content);
      console.log(`[CHUNK] ${filename}: ${fileChunks.length} chunks created.`);
      
      for (const chunk of fileChunks) {
        try {
          const embedding = await geminiClient.embed(chunk.text);
          this.vectorStore.addDocument({
            id: chunk.id,
            text: chunk.text,
            metadata: chunk.metadata,
            embedding
          });
          chunkCount++;
        } catch (error) {
          console.error(`[INDEX] Error embedding chunk ${chunk.id}:`, error);
        }
      }
    }

    await this.vectorStore.save();
    console.log(`[INDEX] Completed. Indexed ${chunkCount} chunks.`);
    return { indexedCount: Object.keys(files).length, chunks: chunkCount };
  }

  async query(question: string): Promise<{ answer: string; retrievedDocs: VectorDocument[] }> {
    console.log(`[QUERY] Processing question: "${question}"`);
    const startTime = Date.now();

    const queryEmbedding = await geminiClient.embed(question);
    const retrievedDocs = this.vectorStore.search(queryEmbedding, 3);
    
    console.log(`[RETRIEVE] Found ${retrievedDocs.length} relevant chunks.`);

    const context = retrievedDocs.map((doc: VectorDocument) => 
      `File: ${doc.metadata.filename} (Lines ${doc.metadata.lineStart}-${doc.metadata.lineEnd})\n` +
      `Content:\n${doc.text}`
    ).join('\n\n');

    const prompt = `
      You are a helpful coding assistant. Use the following code snippets to answer the user's question.
      If the code doesn't contain the answer, say you don't know.
      
      Context:
      ${context}
      
      Question: ${question}
      
      Answer:
    `;

    const answer = await geminiClient.chat([{ role: 'user', content: prompt }]);
    
    const latency = Date.now() - startTime;
    console.log(`[GENERATE] Answer generated in ${latency}ms`);
    
    return { answer, retrievedDocs };
  }

  async evaluate(examples: RetrievalExample[]): Promise<{ results: EvaluationResult[], aggregate: any }> {
    console.log(`[EVAL] Starting evaluation for ${examples.length} examples.`);
    const results: EvaluationResult[] = [];

    for (const example of examples) {
        const startTime = Date.now();
        const { answer, retrievedDocs } = await this.query(example.question);
        const latency = Date.now() - startTime;

        // Retrieval Metrics
        const retrievedFiles = new Set(retrievedDocs.map(d => d.metadata.filename));
        const relevantFiles = new Set(example.relevant_files);
        
        const truePositives = [...retrievedFiles].filter(f => relevantFiles.has(f)).length;
        const precision = retrievedFiles.size > 0 ? truePositives / retrievedFiles.size : 0;
        const recall = relevantFiles.size > 0 ? truePositives / relevantFiles.size : 0;

        // Generation Metrics (LLM-as-a-judge)
        const evaluationPrompt = `
        You are an impartial judge. Evaluate the quality of the generated answer compared to the expected answer.
        
        Question: ${example.question}
        Expected Answer: ${example.expected_answer}
        Generated Answer: ${answer}
        
        Rate the following on a scale of 0.0 to 1.0:
        1. Relevance: Does the answer address the question?
        2. Correctness: Is the answer factually correct based on the expected answer?
        
        Output valid JSON only: {"relevance": number, "correctness": number}
        `;

        let relevance = 0;
        let correctness = 0;
        
        try {
            const evalResponse = await geminiClient.chat([{ role: 'user', content: evaluationPrompt }]);
            const cleanJson = evalResponse.replace(/```json|```/g, '').trim();
            const metrics = JSON.parse(cleanJson);
            relevance = metrics.relevance || 0;
            correctness = metrics.correctness || 0;
        } catch (e) {
            console.error("[EVAL] Error parsing judge response", e);
        }

        results.push({
            question: example.question,
            answer,
            expected_answer: example.expected_answer,
            metrics: {
                retrieval_precision: precision,
                retrieval_recall: recall,
                generation_relevance: relevance,
                generation_correctness: correctness,
                latency_ms: latency
            }
        });
    }

    // Aggregate
    const aggregate = results.reduce((acc, curr) => ({
        retrieval_precision: acc.retrieval_precision + curr.metrics.retrieval_precision,
        retrieval_recall: acc.retrieval_recall + curr.metrics.retrieval_recall,
        generation_relevance: acc.generation_relevance + curr.metrics.generation_relevance,
        generation_correctness: acc.generation_correctness + curr.metrics.generation_correctness,
        avg_latency_ms: acc.avg_latency_ms + curr.metrics.latency_ms
    }), {
        retrieval_precision: 0,
        retrieval_recall: 0,
        generation_relevance: 0,
        generation_correctness: 0,
        avg_latency_ms: 0
    });

    const count = results.length || 1;
    aggregate.retrieval_precision /= count;
    aggregate.retrieval_recall /= count;
    aggregate.generation_relevance /= count;
    aggregate.generation_correctness /= count;
    aggregate.avg_latency_ms /= count;

    return { results, aggregate };
  }
}
