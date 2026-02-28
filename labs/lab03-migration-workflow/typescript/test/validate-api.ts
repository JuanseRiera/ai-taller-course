import { spawn, ChildProcess } from 'child_process';
// import { VerificationReport } from '../src/types/migration.js'; // Types might not work directly in TS execution context without compilation or ts-node adjustments
// For simplicity in this test script, we'll define a minimal interface or cast to any.

interface VerificationReport {
  success: boolean;
  issues: string[];
  summary: string;
  files: Record<string, string>;
}

async function wait(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function runTest() {
  console.log('Starting API server...');
  
  // Start the server in a child process
  const serverProcess = spawn('npm', ['run', 'dev'], {
    stdio: 'inherit',
    shell: true,
    detached: false
  });


  // Give the server a few seconds to boot up
  await wait(5000);

  const payload = {
    targetFramework: "FastAPI",
    files: [
      {
        path: "routes/users.js",
        content: `
const express = require('express');
const router = express.Router();

// Get all users
router.get('/users', async (req, res) => {
    const users = await db.getUsers();
    res.json(users);
});

module.exports = router;
        `
      }
    ]
  };

  try {
    console.log('Sending migration request...');
    const response = await fetch('http://localhost:3000/v1/migrate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      throw new Error(`API returned status ${response.status}`);
    }

    const result = await response.json() as VerificationReport;
    
    console.log('\n--- Test Results ---');
    console.log(`Success Status: ${result.success}`);
    console.log(`Summary: ${result.summary}`);
    
    // Validation Checks
    const migratedFile = result.files['routes/users.js'];
    
    if (!migratedFile) {
      console.error('FAIL: Migrated file not found in response.');
      process.exit(1);
    }

    console.log('\n--- Migrated Code Snippet ---');
    console.log(migratedFile);

    const hasFastAPI = migratedFile.includes('FastAPI') || migratedFile.includes('APIRouter');
    const hasDef = migratedFile.includes('def get_users') || migratedFile.includes('async def');
    const hasTryExcept = migratedFile.includes('try:') || migratedFile.includes('except');
    const hasHttpException = migratedFile.includes('HTTPException');
    
    if (hasFastAPI && hasDef) {
      console.log('\nPASS: Output contains expected FastAPI constructs.');
    } else {
      console.error('\nFAIL: Output does not look like valid FastAPI code.');
      process.exit(1);
    }

    if (hasTryExcept || hasHttpException) {
      console.error('\nFAIL: Output contains unrequested error handling (enhancements). STRICT MODE VIOLATED.');
      process.exit(1);
    } else {
      console.log('\nPASS: Output strictly respects original logic (no added error handling).');
    }

  } catch (error) {
    console.error('Test failed:', error);
  } finally {
    console.log('Stopping server...');
    serverProcess.kill();
    process.exit(0);
  }
}

runTest();
