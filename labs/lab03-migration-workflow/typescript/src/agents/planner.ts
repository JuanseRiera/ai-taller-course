import { llmService } from '../utils/llm.js';
import { AnalysisResult, MigrationPlan, MigrationPlanSchema, SourceFile } from '../types/migration.js';

export const planMigration = async (analysis: AnalysisResult, targetFramework: string, files: SourceFile[]): Promise<MigrationPlan> => {
  const analysisSummary = `
    Patterns: ${analysis.patterns.join(', ')}
    Dependencies: ${analysis.dependencies.join(', ')}
    Potential Issues: ${analysis.potentialIssues.join(', ')}
    Summary: ${analysis.summary}
  `;
  
  const availableFiles = files.map(f => f.path).join(', ');

  const prompt = `
    You are an expert technical project manager. Based on the analysis of a legacy application, generate a detailed migration plan to ${targetFramework}.
    
    Analysis Report:
    ${analysisSummary}
    
    Available Source Files:
    ${availableFiles}
    
    Create a step-by-step plan.
    IMPORTANT: The "file" field within each step MUST match EXACTLY one of the paths in the "Available Source Files" list above.
    Do NOT add "src/" or change the path.
    DO NOT propose creating new files.
    DO NOT propose improvements or enhancements. Migrate ONLY what exists.
    
    Steps must be ordered topologically based on dependencies.
    Assign complexity (low, medium, high) to each step.
    
    Respond in strict JSON format matching the following schema:
    {
      "steps": [
        {
          "id": string,
          "description": string,
          "dependencies": string[],
          "complexity": "low" | "medium" | "high",
          "file": string // Must match EXACTLY one of the input file paths
        }
      ],
      "rationale": string
    }
  `;

  try {
    const plan = await llmService.generateJson<MigrationPlan>(prompt, MigrationPlanSchema);
    return plan;
  } catch (error) {
    console.error("Planning failed:", error);
    throw error;
  }
};
