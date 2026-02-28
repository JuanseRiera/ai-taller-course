# AI Code Migration Agent

A robust, multi-agent system designed to autonomously migrate source code between frameworks and languages (e.g., Express.js to FastAPI, React Class Components to Functional Components).

## Architecture

The system uses a 4-phase pipeline pattern to ensure high-quality, safe migrations:

1.  **Analyzer Agent**: Parses source code to identify patterns, dependencies, and potential issues without "hallucinating" content.
2.  **Planner Agent**: Creates a topological migration plan, strictly targeting *existing* files.
3.  **Executor Agent (ReAct)**: executing the plan step-by-step. It is strictly forbidden from adding unrequested "improvements" or "best practices" (1:1 logic mapping).
4.  **Verifier Agent**: Validates the output against the original logic and flags any deviations or hallucinations.

## Prerequisites

- Node.js (v18+)
- An API Key for one of the following providers:
  - Google Gemini (Recommended/Free Tier) -> `GOOGLE_API_KEY`
  - Anthropic Claude -> `ANTHROPIC_API_KEY`
  - OpenAI -> `OPENAI_API_KEY`
  - Groq -> `GROQ_API_KEY`

## Setup

1.  **Install Dependencies**:
    ```bash
    npm install
    ```

2.  **Environment Setup**:
    Create a `.env` file in the root directory (or export variables in your shell):
    ```bash
    export GOOGLE_API_KEY="your_api_key_here"
    ```

## Running the Server

Start the Hono API server:

```bash
npm run dev
```

The server will start on `http://localhost:3000`.

## Quick Test (cURL)

You can test the migration API using the following `curl` command. This example migrates a simple JavaScript math function to Python.

```bash
curl -X POST http://localhost:3000/v1/migrate \
  -H "Content-Type: application/json" \
  -d '{
    "targetFramework": "Python",
    "files": [
      {
        "path": "utils/math.js",
        "content": "function add(a, b) { return a + b; } module.exports = add;"
      }
    ]
  }'
```

### Expected Output

You should receive a JSON response containing the verification report and the migrated code:

```json
{
  "success": true,
  "issues": [],
  "summary": "Migration succeeded. processed 1 files.",
  "files": {
    "utils/math.js": "def add(a, b):\n    return a + b\n"
  }
}
```
