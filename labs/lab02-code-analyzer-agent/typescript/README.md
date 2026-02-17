# Code Analyzer Agent - TypeScript Backend

This is a robust backend service built with [Hono](https://hono.dev/) and TypeScript that leverages various Large Language Models (LLMs) to perform static code analysis. It focuses on identifying bugs, complexity issues, and security vulnerabilities.

## Features

*   **Multi-Provider LLM Support:** Works seamlessly with Google Gemini (Free), Groq (Free/Fast), Anthropic Claude, OpenAI GPT, and Ollama (Local).
*   **Smart Input Parsing:** Accepts both `application/json` and `text/plain` payloads. Can auto-detect languages or handle pasted JSON strings intelligently.
*   **Security First:**
    *   **Prompt Isolation:** All user code is Base64 encoded before being sent to the LLM to prevent prompt injection attacks.
    *   **Input Sanitization:** Language parameters are rigorously sanitized.
    *   **Secure Defaults:** CORS is restrictive in production, permissive in dev.
*   **Specialized Analysis:**
    *   `/analyze`: General code quality, bugs, and performance.
    *   `/analyze/security`: Dedicated security audit (OWASP Top 10 focus).
*   **Mock Mode:** Includes a built-in mock mode for testing the parsing logic without an API key (`LLM_MOCK=true`).

## Installation

1.  **Install dependencies:**
    ```bash
    npm install
    ```

2.  **Configure Environment:**
    Copy the example configuration:
    ```bash
    cp .env.example .env
    ```
    Edit `.env` and add at least one API key (e.g., `GOOGLE_API_KEY` is free and recommended).

3.  **Start Development Server:**
    ```bash
    npm run dev
    ```
    The server will start on `http://localhost:3000`.

## API Documentation

### 1. General Analysis
Analyzes code for general quality, complexity, and potential bugs.

**Endpoint:** `POST /analyze`

**Request (Plain Text - Recommended):**
Just paste your raw code. The language is auto-detected.
```bash
curl -X POST "http://localhost:3000/analyze" \
  -H "Content-Type: text/plain" \
  --data "console.log('hello world');"
```

**Request (JSON):**
```bash
curl -X POST "http://localhost:3000/analyze" \
  -H "Content-Type: application/json" \
  -d '{
    "language": "python",
    "code": "print(\"hello\")"
  }'
```

**Response:**
```json
{
  "summary": "Brief summary of the code...",
  "complexity": { "score": 1, "reasoning": "..." },
  "vulnerabilities": [
    {
      "type": "security",
      "severity": "low",
      "description": "...",
      "suggestion": "..."
    }
  ]
}
```

### 2. Security Audit
Performs a deep security review focusing on OWASP vulnerabilities, secrets, and insecure practices.

**Endpoint:** `POST /analyze/security`

**Request:**
Same input format as `/analyze`.
```bash
curl -X POST "http://localhost:3000/analyze/security" \
  -H "Content-Type: text/plain" \
  --data "const password = 'hardcoded_secret';"
```

**Response:**
Returns vulnerabilities with severity levels including `critical`.

## Configuration (.env)

| Variable | Description | Default |
| :--- | :--- | :--- |
| `PORT` | Server port | `3000` |
| `NODE_ENV` | Environment (`development` / `production`) | `development` |
| `CORS_ORIGIN` | Allowed CORS origin | `*` (dev only) |
| `LLM_MOCK` | Set to `true` to use mock responses | `false` |
| `GOOGLE_API_KEY` | Key for Gemini (Free Tier) | - |
| `GROQ_API_KEY` | Key for Groq (Llama 3) | - |
| `ANTHROPIC_API_KEY`| Key for Claude | - |
| `OPENAI_API_KEY` | Key for GPT-4 | - |

## Testing

To run the unit tests (if any):
```bash
npm run test
```
