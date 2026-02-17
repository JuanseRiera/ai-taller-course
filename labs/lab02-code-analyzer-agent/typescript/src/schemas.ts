import { z } from 'zod';

export const AnalysisResponseSchema = z.object({
  summary: z.string().describe("A brief summary of the code's purpose (max 2 sentences)."),
  complexity: z.object({
    score: z.number().min(1).max(10).describe("Overall complexity score from 1 to 10."),
    reasoning: z.string().describe("Reasoning for the complexity score (max 2 sentences)."),
  }),
  vulnerabilities: z.array(z.object({
    type: z.string().describe("Type of issue (e.g., 'security', 'performance', 'maintainability')."),
    severity: z.enum(['low', 'medium', 'high', 'critical']).describe("Severity of the issue."),
    description: z.string().describe("Brief description of the issue (max 2 sentences)."),
    line: z.number().optional().describe("Line number where the issue occurs, if applicable."),
    complexityScore: z.number().min(1).max(10).describe("Complexity score for fixing this specific issue (1-10)."),
    costBenefit: z.enum(['low', 'medium', 'high']).describe("Cost-benefit analysis of fixing this issue."),
    suggestion: z.string().describe("Actionable suggestion to fix the issue (max 2 sentences)."),
  })).describe("List of identified vulnerabilities or issues."),
});

export type AnalysisResponse = z.infer<typeof AnalysisResponseSchema>;
