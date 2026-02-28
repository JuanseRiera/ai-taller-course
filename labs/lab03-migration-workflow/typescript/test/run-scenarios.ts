import { spawn } from 'child_process';

async function wait(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

const scenarios = [
  {
    name: "Level 1: Simple Utility",
    description: "Migrate a simple pure function. Should remain a simple function.",
    targetFramework: "Python",
    files: [{
      path: "utils/math.js",
      content: "function calculateTotal(items) { return items.reduce((sum, item) => sum + item.price, 0); } module.exports = calculateTotal;"
    }],
    expectedKeywords: ["def calculate_total", "sum", "return"],
    forbiddenKeywords: ["try:", "except", "class "]
  },
  {
    name: "Level 2: Class Logic",
    description: "Migrate a JS Class to Python Class. Should preserve methods and state.",
    targetFramework: "Python",
    files: [{
      path: "models/User.js",
      content: "class User { constructor(name) { this.name = name; this.active = true; } deactivate() { this.active = false; } } module.exports = User;"
    }],
    expectedKeywords: ["class User", "__init__", "self.name", "def deactivate"],
    forbiddenKeywords: ["try:", "except", "pydantic"]
  },
  {
    name: "Level 3: Async Processing",
    description: "Migrate async/await loop. Strict adherence: NO added error handling.",
    targetFramework: "Python",
    files: [{
      path: "services/orders.js",
      content: "const processOrders = async (orders, db) => { const results = []; for (const order of orders) { if (order.status === 'pending') { const user = await db.getUser(order.userId); await db.updateStatus(order.id, 'processing'); results.push({ orderId: order.id, user: user.name }); } } return results; };"
    }],
    expectedKeywords: ["async def", "await", "for order in orders", "append"],
    forbiddenKeywords: ["try:", "except", "logging"]
  },
  {
    name: "Level 4: Express Middleware",
    description: "Migrate HTTP middleware. Should map logic 1:1.",
    targetFramework: "FastAPI",
    files: [{
      path: "middleware/auth.js",
      content: "const authMiddleware = (req, res, next) => { const token = req.headers['authorization']; if (token) { req.user = verify(token); next(); } else { res.status(401).send('Unauthorized'); } };"
    }],
    expectedKeywords: ["Header", "401"],
    forbiddenKeywords: ["try:", "except Exception"]
  }
];

async function runScenarios() {
  const targetScenarioName = process.argv[2];
  const scenariosToRun = targetScenarioName 
    ? scenarios.filter(s => s.name.includes(targetScenarioName))
    : scenarios;

  if (scenariosToRun.length === 0) {
    console.error(`No scenarios found matching "${targetScenarioName}"`);
    process.exit(1);
  }

  console.log('Starting API server...');
  
  const serverProcess = spawn('npm', ['run', 'dev'], {
    stdio: 'inherit',
    shell: true,
    detached: false
  });

  await wait(5000);

  try {
    for (const scenario of scenariosToRun) {
      console.log(`\n\n---------------------------------------------------`);
      console.log(`RUNNING SCENARIO: ${scenario.name}`);
      console.log(`Description: ${scenario.description}`);
      console.log(`---------------------------------------------------`);

      const payload = {
        targetFramework: scenario.targetFramework,
        files: scenario.files
      };

      console.log('Sending request...');
      const response = await fetch('http://localhost:3000/v1/migrate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        throw new Error(`API returned status ${response.status}`);
      }

      const result = await response.json() as any;
      
      console.log(`Success: ${result.success}`);
      if (!result.success) {
        console.log(`Issues: ${result.issues?.join(', ')}`);
      }

      for (const originalFile of scenario.files) {
        const migratedContent = result.files[originalFile.path];
        
        if (!migratedContent) {
          console.error(`❌ FAIL: File ${originalFile.path} missing from output.`);
          continue;
        }

        console.log(`\n--- Migrated Content for ${originalFile.path} ---`);
        console.log(migratedContent);
        console.log(`-----------------------------------------------`);

        const missingKeywords = scenario.expectedKeywords.filter(k => !migratedContent.includes(k));
        if (missingKeywords.length > 0) {
          console.error(`❌ FAIL: Missing expected keywords: ${missingKeywords.join(', ')}`);
        } else {
          console.log(`✅ PASS: All expected keywords present.`);
        }

        const foundForbidden = scenario.forbiddenKeywords.filter(k => migratedContent.includes(k));
        if (foundForbidden.length > 0) {
          console.error(`❌ FAIL: Found forbidden keywords (Improvements detected): ${foundForbidden.join(', ')}`);
        } else {
          console.log(`✅ PASS: No unrequested improvements detected.`);
        }
      }
    }
  } catch (error) {
    console.error('Test Runner Failed:', error);
  } finally {
    console.log('\nStopping server...');
    if (serverProcess.pid) {
      try {
        process.kill(serverProcess.pid);
      } catch (e) {}
    }
    process.exit(0);
  }
}

runScenarios();
