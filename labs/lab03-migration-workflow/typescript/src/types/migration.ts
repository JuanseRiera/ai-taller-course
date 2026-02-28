import { z } from 'zod';

// ==========================================
// Phase 1: Analysis
// ==========================================

export const AnalysisSchema = z.object({
  patterns: z.array(z.string()).describe('List of design patterns or architectural styles identified in the source code'),
  dependencies: z.array(z.string()).describe('List of external libraries or internal modules imported'),
  potentialIssues: z.array(z.string()).describe('List of potential challenges for migration (e.g., framework-specific coupling)'),
  summary: z.string().describe('High-level summary of what the code does')
});

export type AnalysisResult = z.infer<typeof AnalysisSchema>;

// ==========================================
// Phase 2: Planning
// ==========================================

export const MigrationStepSchema = z.object({
  id: z.string(),
  description: z.string(),
  dependencies: z.array(z.string()).describe('IDs of steps that must be completed before this one'),
  complexity: z.enum(['low', 'medium', 'high']),
  file: z.string().describe('The specific file path this step targets')
});

export const MigrationPlanSchema = z.object({
  steps: z.array(MigrationStepSchema),
  rationale: z.string().describe('Explanation of the migration strategy')
});

export type MigrationPlan = z.infer<typeof MigrationPlanSchema>;

// ==========================================
// Phase 3: Execution
// ==========================================

export const ExecutionResultSchema = z.object({
  files: z.record(z.string(), z.string()).describe('Map of file paths to migrated source code'),
  logs: z.array(z.string()).describe('Execution logs or notes')
});

export type ExecutionResult = z.infer<typeof ExecutionResultSchema>;

// ==========================================
// Phase 4: Verification
// ==========================================

export const VerificationReportSchema = z.object({
  success: z.boolean(),
  issues: z.array(z.string()).describe('List of remaining issues or manual fix-ups required'),
  summary: z.string().describe('Final report summary'),
  files: z.record(z.string(), z.string()).describe('Final verified code (may be same as execution result)')
});

export type VerificationReport = z.infer<typeof VerificationReportSchema>;

// ==========================================
// Shared Types
// ==========================================

export interface SourceFile {
  path: string;
  content: string;
}

export interface MigrationRequest {
  files: SourceFile[];
  sourceFramework?: string; // Optional, can be inferred
  targetFramework: string;
}
