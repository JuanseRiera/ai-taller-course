# Codebase RAG System POC

A Proof of Concept (POC) API for a Retrieval-Augmented Generation (RAG) system designed to interact with JavaScript and Python codebases. This system indexes code files, generates embeddings using Google's Gemini models, and provides endpoints for querying the codebase and evaluating the quality of the RAG pipeline.

## Features

*   **Code Indexing**: Splits Python and JavaScript/TypeScript code into logical chunks (functions, classes) and generates vector embeddings.
*   **Vector Search**: Implements a local, file-based vector store using cosine similarity for efficient retrieval.
*   **RAG Querying**: Retrieves relevant code snippets based on natural language questions and uses Google Gemini to generate context-aware answers.
*   **Evaluation Framework**: Built-in endpoint to evaluate the system's performance using metrics like Retrieval Precision/Recall and Generation Relevance/Correctness (LLM-as-a-judge).
*   **Observability**: Detailed logging for every step of the pipeline (Indexing, Chunking, Retrieval, Generation).

## Tech Stack

*   **Language**: TypeScript
*   **Framework**: [Hono](https://hono.dev/)
*   **LLM & Embeddings**: Google Gemini API (`gemini-2.5-flash`, `gemini-embedding-001`)
*   **Vector Store**: In-memory / Local JSON storage

## Prerequisites

*   Node.js (v18 or higher)
*   A Google AI Studio API Key with access to Gemini models.

## Setup

1.  **Install Dependencies**
    ```bash
    npm install
    ```

2.  **Environment Configuration**
    Create a `.env` file in the root directory (copy from `.env.example` if available) and add your Google API Key:
    ```env
    GOOGLE_API_KEY=your_api_key_here
    PORT=8000
    ```

## Usage

### Starting the Server

Development mode:
```bash
npm run dev
```

Production build:
```bash
npm run build
npm start
```

### API Endpoints

#### 1. Index Files
Values are file contents.
**POST** `/index/files`

```bash
curl -X POST http://localhost:8000/index/files \
  -H "Content-Type: application/json" \
  -d '{
    "files": {
      "auth.py": "def login(user, password):\n    return token",
      "api.py": "def get_users():\n    return db.query(User).all()"
    }
  }'
```

#### 2. Query Codebase
Ask a question about the indexed code.
**POST** `/query`

```bash
curl -X POST http://localhost:8000/query \
  -H "Content-Type: application/json" \
  -d '{"question": "How does login work?"}'
```

#### 3. Evaluate RAG Performance
Run a test case to get retrieval and generation metrics.
**POST** `/evaluate`

```bash
curl -X POST http://localhost:8000/evaluate \
  -H "Content-Type: application/json" \
  -d '{
    "examples": [{
      "question": "How does login work?",
      "expected_answer": "Login validates credentials and returns a token",
      "relevant_files": ["auth.py"]
    }]
  }'
```

## Testing

The project includes a suite of integration tests in the `scripts/` directory to verify the system's functionality.

1.  **Basic Integration Test**:
    ```bash
    ./scripts/test-rag.sh
    ```

2.  **Advanced Test Suite**:
    This suite indexes a more complex mock codebase and runs 4 specific test cases (Simple Retrieval, Multi-file Logic, Complex Architecture, Negative Test).
    
    First, verify the server is running, then execute the scripts:
    
    ```bash
    # Index the complex test dataset
    ./scripts/setup-index.sh

    # Run individual test cases
    ./scripts/test-1-simple.sh
    ./scripts/test-2-multifile.sh
    ./scripts/test-3-complex.sh
    ./scripts/test-4-negative.sh
    ```

## Project Structure

*   `src/index.ts`: API entry point and route definitions.
*   `src/services/rag-service.ts`: Core logic for indexing, querying, and evaluation.
*   `src/services/vector-store.ts`: Local vector storage implementation.
*   `src/utils/gemini-client.ts`: Client for interacting with Google Gemini API.
*   `src/utils/code-splitter.ts`: Logic for splitting code into semantic chunks.
*   `storage/`: Directory where the vector index is persisted (`vector-db.json`).
