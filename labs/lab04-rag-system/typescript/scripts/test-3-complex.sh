#!/bin/bash
echo "--- TEST 3: Complex Architecture (Auth Flow) ---"
echo "Question: Describe the relationship between the login function and token generation."
echo "Relevant Files: auth.py, session.py"

# Query
curl -s -X POST http://localhost:8000/query \
  -H "Content-Type: application/json" \
  -d '{"question": "Describe the relationship between the login function and token generation."}' | json_pp

# Evaluate
echo "Evaluating..."
curl -s -X POST http://localhost:8000/evaluate \
  -H "Content-Type: application/json" \
  -d '{
    "examples": [{
      "question": "Describe the relationship between the login function and token generation.",
      "expected_answer": "The login function in auth.py calls create_token from session.py if password validation succeeds.",
      "relevant_files": ["auth.py", "session.py"]
    }]
  }' | json_pp
echo -e "\n"
