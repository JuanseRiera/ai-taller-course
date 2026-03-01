#!/bin/bash
echo "--- TEST 2: Multi-file Logic (User Creation) ---"
echo "Question: How is a new user created?"
echo "Relevant Files: api.py, db.py"

# Query
curl -s -X POST http://localhost:8000/query \
  -H "Content-Type: application/json" \
  -d '{"question": "How is a new user created?"}' | json_pp

# Evaluate
echo "Evaluating..."
curl -s -X POST http://localhost:8000/evaluate \
  -H "Content-Type: application/json" \
  -d '{
    "examples": [{
      "question": "How is a new user created?",
      "expected_answer": "The create_user function in api.py calls db.save with a new User object.",
      "relevant_files": ["api.py", "db.py"]
    }]
  }' | json_pp
echo -e "\n"
