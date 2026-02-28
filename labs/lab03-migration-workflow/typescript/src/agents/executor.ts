import { llmService } from '../utils/llm.js';
import { MigrationPlan, ExecutionResult, SourceFile } from '../types/migration.js';
import { z } from 'zod';

const StepResultSchema = z.object({
  thought: z.string().describe('Reasoning about the migration approach'),
  code: z.string().describe('The migrated code'),
  status: z.enum(['success', 'failed']).describe('Whether the migration step was successful')
});

type StepResult = z.infer<typeof StepResultSchema>;

export const executeMigration = async (
  plan: MigrationPlan, 
  files: SourceFile[], 
  targetFramework: string
): Promise<ExecutionResult> => {
  const result: ExecutionResult = {
    files: {},
    logs: []
  };

  for (const step of plan.steps) {
    console.log(`Executing step: ${step.id} - ${step.description}`);
    result.logs.push(`Starting step ${step.id}: ${step.description}`);

    const sourceFile = files.find(f => f.path === step.file);
    if (!sourceFile) {
      const errorMsg = `Source file not found for step ${step.id}: ${step.file}`;
      console.error(errorMsg);
      result.logs.push(`ERROR: ${errorMsg}`);
      continue;
    }

    const prompt = `
      You are an expert developer performing a migration to ${targetFramework}.
      
      Task: Execute step "${step.description}" for file "${step.file}".
      
      Source Code:
      ${sourceFile.content}
      
      Instructions:
      1. Analyze the source code and the task.
      2. Plan the code changes (Thought).
      3. Generate the migrated code (Action).
      4. STRICTLY MIGRATE ONLY WHAT IS PRESENT. Do NOT add "best practices", extra error handling, or improvements.
      5. If the source code does not have error handling, the migrated code MUST NOT have it.
      6. If you want to suggest an improvement, add it as a COMMENT, not as code.
      7. Ensure NO hallucinated imports.
      
      Respond in strict JSON format:
      {
        "thought": "Analysis of what needs to change...",
        "code": "The full migrated code string...",
        "status": "success" | "failed"
      }
    `;

    try {
      const stepResult = await llmService.generateJson<StepResult>(prompt, StepResultSchema);
      
      if (stepResult.status === 'success') {
        result.files[step.file] = stepResult.code;
        result.logs.push(`Step ${step.id} completed. Thought: ${stepResult.thought}`);
      } else {
        result.logs.push(`Step ${step.id} reported failure.`);
      }
    } catch (error) {
      console.error(`Step ${step.id} failed with error:`, error);
      result.logs.push(`Step ${step.id} failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  return result;
};
