# Research Assistant API (AutoGen + Gemini)

This project implements an AI-powered Research Assistant using **Microsoft AutoGen**, **Google Gemini**, and **FastAPI**.
It features a multi-agent system (Researcher, Writer, Reviewer, Supervisor) orchestrated to produce high-quality research reports.

## Features
- **Multi-Agent Orchestration**: Specialized agents for gathering, writing, and reviewing.
- **Iterative Workflow**: Research -> Write -> Review -> Refine loop.
- **Real-time Streaming**: Server-Sent Events (SSE) for live agent progress updates.
- **Configurable**: Adjustable depth, format, and iterations.

## Prerequisites

- Python 3.9+
- Google Cloud API Key (for Gemini)

## Setup

1. **Install Dependencies**:
   ```bash
   python3 -m pip install -r requirements.txt
   ```

2. **Configure Environment**:
   - Rename `.env` (or create one) and add your Google API Key:
     ```
     GOOGLE_API_KEY=your_actual_api_key
     ```
     (A `.env` file with a placeholder has been created for you).

## Running the API

Start the server:
```bash
python3 -m uvicorn src.app.main:app --reload
```

## Usage

### Endpoint: `POST /research`

Starts a research session. Returns a Server-Sent Events (SSE) stream.

**Request Body:**

```json
{
  "question": "Research topic here",
  "depth": "brief" | "detailed" | "technical",
  "max_iterations": 5,
  "report_format": "essay" | "bullet_points" | "table"
}
```

**Response Stream:**

The stream yields JSON events:

1.  **Progress Updates**:
    ```json
    {"type": "progress", "message": "Researcher has started gathering information..."}
    ```
    ```json
    {"type": "progress", "message": "Researcher has completed their step.", "preview": "Partial content..."}
    ```

2.  **Final Result**:
    ```json
    {
      "type": "result",
      "data": {
        "final_report": "The markdown or JSON report content...",
        "conversation_history": [
          {
            "agent": "Researcher",
            "role": "user",
            "content": "Full text of what the agent said..."
          },
          ...
        ],
        "metadata": {
          "iterations": 5,
          "model": "gemini-2.5-flash"
        }
      }
    }
    ```

**Example Request**:
```bash
curl -N -X POST http://localhost:8000/research \
  -H "Content-Type: application/json" \
  -d '{
    "question": "Explain the differences between RAG and fine-tuning for LLMs",
    "depth": "detailed",
    "max_iterations": 5,
    "report_format": "essay"
  }'
```

### Project Structure
- `src/app/agents/`: Individual agent definitions (Researcher, Writer, Reviewer, Supervisor).
- `src/app/core/orchestrator.py`: AutoGen GroupChat and streaming logic.
- `src/app/main.py`: FastAPI application.
