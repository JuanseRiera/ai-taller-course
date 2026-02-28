import { analyzeSource } from '../agents/analyzer.js';
import { planMigration } from '../agents/planner.js';
import { executeMigration } from '../agents/executor.js';
import { verifyMigration } from '../agents/verifier.js';
import { SourceFile, VerificationReport } from '../types/migration.js';

export const runMigration = async (
  files: SourceFile[], 
  targetFramework: string
): Promise<VerificationReport> => {
  console.log(`Starting migration pipeline for ${files.length} files to ${targetFramework}...`);
  
  // Phase 1: Analysis
  console.log('--- Phase 1: Analyzing Source Code ---');
  const analysis = await analyzeSource(files, targetFramework);
  console.log('Analysis completed.');

  // Phase 2: Planning
  console.log('--- Phase 2: Creating Migration Plan ---');
  const plan = await planMigration(analysis, targetFramework, files);
  console.log(`Plan generated with ${plan.steps.length} steps.`);

  // Phase 3: Execution
  console.log('--- Phase 3: Executing Migration Steps ---');
  const executionResult = await executeMigration(plan, files, targetFramework);
  console.log(`Execution completed for ${Object.keys(executionResult.files).length} files.`);

  // Phase 4: Verification
  console.log('--- Phase 4: Verifying Migrated Code ---');
  const verification = await verifyMigration(executionResult, files, targetFramework);
  console.log('Verification completed.');

  return verification;
};
