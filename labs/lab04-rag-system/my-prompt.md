You are an expert AI developer with the task of helping me create a poc of an API to interact with a RAG service. The rag service is for a large set of repositories in javascript and python that we have. The API should have:
1. An endpoint to load files and index them with embedding and metadata. Since it a POC we can save the documents in a temporary file no need for a db.
2. An endpoint to retrieve relevant code according to a user question.
3. An endpoing to retrieve relevant metrics about our system. we will need to build a framwork to evaluate retrival and generation queality. Test Questions → RAG → Compare to Ground Truth → Metrics.
The API should be build with great observability. Since this is a POC a basic logging in the most important steps (Embedding, chunking, Retrieval, generation) should be sufficient. The valuation framework should have metrics like retrival presition and recall, generation relevance and correctness and latency. We are also going to implement an integration test that we should use to check that the api is working as expected. Here is the tests that I would like to run:
# Index some files
curl -X POST http://localhost:8000/index/files \
  -H "Content-Type: application/json" \
  -d '{
    "files": {
      "auth.py": "def login(user, password):\n    # Validate credentials\n    return token",
      "api.py": "def get_users():\n    return db.query(User).all()"
    }
  }'

# Query
curl -X POST http://localhost:8000/query \
  -H "Content-Type: application/json" \
  -d '{"question": "How does login work?"}'

# Evaluate
curl -X POST http://localhost:8000/evaluate \
  -H "Content-Type: application/json" \
  -d '{
    "examples": [{
      "question": "How does login work?",
      "expected_answer": "Login validates credentials and returns a token",
      "relevant_files": ["auth.py"]
    }]
  }'

  The project will be done in typescript using hono. The root of the project is /Users/juanseriera/Documents/Cursos/AI Taller/AI_Training/labs/lab04-rag-system/typescript. The embedding will be done using gemini embedding tool and the llm client to use is also gemini. You can use this generic llm client file to guide you /Users/juanseriera/Documents/Cursos/AI Taller/AI_Training/labs/lab03-migration-workflow/typescript/src/utils/llm-client.ts but it should be less abstract since we are only going to use gemini.