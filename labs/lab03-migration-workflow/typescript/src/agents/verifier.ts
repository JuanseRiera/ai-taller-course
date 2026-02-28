import { llmService } from '../utils/llm.js';
import { VerificationReport, ExecutionResult, SourceFile } from '../types/migration.js';
import { z } from 'zod';

const FileVerificationSchema = z.object({
  path: z.string(),
  success: z.boolean(),
  issues: z.array(z.string()),
  summary: z.string()
});

type FileVerification = z.infer<typeof FileVerificationSchema>;

export const verifyMigration = async (
  executionResult: ExecutionResult,
  originalFiles: SourceFile[],
  targetFramework: string
): Promise<VerificationReport> => {
  const fileVerifications: FileVerification[] = [];

  for (const originalFile of originalFiles) {
    const migratedCode = executionResult.files[originalFile.path];
    
    if (!migratedCode) {
      fileVerifications.push({
        path: originalFile.path,
        success: false,
        issues: ['File was not migrated or missing from execution result.'],
        summary: 'Migration skipped or failed.'
      });
      continue;
    }

    const prompt = `
      You are a QA engineer verifying a code migration to ${targetFramework}.
      
      Original File (${originalFile.path}):
      ${originalFile.content}
      
      Migrated Code:
      ${migratedCode}
      
      Tasks:
      1. Check if the migrated code logically matches the original functionality.
      2. Identify any missing imports or broken references.
      3. Verify adherence to ${targetFramework} patterns BUT strictly adhering to the original logic.
      4. Ensure NO "enhancements" or "improvements" (like added error handling where none existed) were added. If found, mark as an issue.
      5. Ensure NO hallucinated code was added.
      
      Respond in strict JSON format:
      {
        "path": "${originalFile.path}",
        "success": boolean,
        "issues": string[],
        "summary": "Short verification summary"
      }
    `;

    try {
      const verification = await llmService.generateJson<FileVerification>(prompt, FileVerificationSchema);
      fileVerifications.push(verification);
    } catch (error) {
      console.error(`Verification failed for ${originalFile.path}:`, error);
      fileVerifications.push({
        path: originalFile.path,
        success: false,
        issues: [`Verification process failed: ${error instanceof Error ? error.message : String(error)}`],
        summary: 'Verification error.'
      });
    }
  }

  const overallSuccess = fileVerifications.every(v => v.success);
  const issues = fileVerifications.flatMap(v => v.issues);
  const summary = `Migration ${overallSuccess ? 'succeeded' : 'completed with issues'}. processed ${fileVerifications.length} files.`;

  return {
    success: overallSuccess,
    issues,
    summary,
    files: executionResult.files // Return the verified files
  };
};
