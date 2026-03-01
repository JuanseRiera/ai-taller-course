#!/bin/bash

# Index files: 3 relevant to login, 2 irrelevant
echo "Indexing files..."
curl -X POST http://localhost:8000/index/files \
  -H "Content-Type: application/json" \
  -d '{
    "files": {
      "auth.py": "def login(user, password):\n    # Main login entry point\n    if validate_password(user, password):\n        return create_token(user)\n    return None",
      "auth_utils.py": "def validate_password(user, password):\n    # Check password hash\n    return True",
      "session.py": "def create_token(user):\n    # Generate JWT token\n    return \"abc-123\"",
      "api.py": "def get_users():\n    return db.query(User).all()",
      "db.py": "def connect():\n    return \"connected\""
    }
  }'
echo -e "\n"

# Query
echo "Querying..."
curl -X POST http://localhost:8000/query \
  -H "Content-Type: application/json" \
  -d '{"question": "How does login work?"}'
echo -e "\n"

# Evaluate
echo "Evaluating..."
curl -X POST http://localhost:8000/evaluate \
  -H "Content-Type: application/json" \
  -d '{
    "examples": [{
      "question": "How does login work?",
      "expected_answer": "Login validates credentials using auth_utils and creates a token using session.",
      "relevant_files": ["auth.py", "auth_utils.py", "session.py"]
    }]
  }'
echo -e "\n"
