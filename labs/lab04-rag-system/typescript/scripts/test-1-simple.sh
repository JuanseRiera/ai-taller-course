#!/bin/bash
echo "--- TEST 1: Simple Retrieval (Database Connection) ---"
echo "Question: How do I connect to the database?"
echo "Relevant File: db.py"

# Query
curl -s -X POST http://localhost:8000/query \
  -H "Content-Type: application/json" \
  -d '{"question": "How do I connect to the database?"}' | json_pp

# Evaluate
echo "Evaluating..."
curl -s -X POST http://localhost:8000/evaluate \
  -H "Content-Type: application/json" \
  -d '{
    "examples": [{
      "question": "How do I connect to the database?",
      "expected_answer": "Use the connect function in db.py which prints Connecting to Postgres.",
      "relevant_files": ["db.py"]
    }]
  }' | json_pp
echo -e "\n"
