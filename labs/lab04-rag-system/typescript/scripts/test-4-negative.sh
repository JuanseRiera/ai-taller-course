#!/bin/bash
echo "--- TEST 4: Negative Test (Payment Gateway) ---"
echo "Question: How is the payment gateway implemented?"
echo "Relevant Files: None"

# Query
curl -s -X POST http://localhost:8000/query \
  -H "Content-Type: application/json" \
  -d '{"question": "How is the payment gateway implemented?"}' | json_pp

# Evaluate
echo "Evaluating..."
curl -s -X POST http://localhost:8000/evaluate \
  -H "Content-Type: application/json" \
  -d '{
    "examples": [{
      "question": "How is the payment gateway implemented?",
      "expected_answer": "I do not know, as the codebase does not contain payment logic.",
      "relevant_files": []
    }]
  }' | json_pp
echo -e "\n"
