#!/bin/bash
echo "Indexing files for advanced test suite..."
curl -s -X POST http://localhost:8000/index/files \
  -H "Content-Type: application/json" \
  -d '{
    "files": {
      "auth.py": "def login(user, password):\n    # Main login entry point\n    if validate_password(user, password):\n        return create_token(user)\n    return None",
      "auth_utils.py": "def validate_password(user, password):\n    # Check password hash\n    return True",
      "session.py": "def create_token(user):\n    # Generate JWT token\n    return \"abc-123\"",
      "api.py": "def get_users():\n    return db.query(User).all()\n\ndef create_user(username):\n    # Create a new user in the system\n    db.save(User(username))",
      "db.py": "def connect():\n    # Establishes connection to the PostgreSQL database\n    print(\"Connecting to Postgres\")\n    return Connection()\n\ndef query(model):\n    return QueryBuilder(model)\n\ndef save(obj):\n    # Saves object to database\n    pass",
      "config.py": "DB_HOST = \"localhost\"\nDB_PORT = 5432\nSECRET_KEY = \"secret\""
    }
  }' | json_pp
echo -e "\n"
