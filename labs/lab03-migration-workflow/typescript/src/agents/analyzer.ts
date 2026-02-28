import { llmService } from '../utils/llm.js';
import { AnalysisResult, AnalysisSchema, SourceFile } from '../types/migration.js';

export const analyzeSource = async (files: SourceFile[], targetFramework: string): Promise<AnalysisResult> => {
  const fileContents = files.map(f => `FILE: ${f.path}\n${f.content}`).join('\n\n');
  
  const prompt = `
    You are an expert software architect analyzing code for migration to ${targetFramework}.
    
    Please analyze the following source code files:
    ${fileContents}
    
    Identify:
    1. Architectural patterns used (e.g., MVC, Flux, Singleton).
    2. External dependencies and libraries based ONLY on imports.
    3. Potential challenges for migrating to ${targetFramework}.
    4. A brief summary of the application's purpose.
    
    Respond in strict JSON format matching the following schema:
    {
      "patterns": string[],
      "dependencies": string[],
      "potentialIssues": string[],
      "summary": string
    }
  `;

  try {
    const analysis = await llmService.generateJson<AnalysisResult>(prompt, AnalysisSchema);
    return analysis;
  } catch (error) {
    console.error("Analysis failed:", error);
    throw error;
  }
};
