import string
import secrets
import aiosqlite
import sqlite3
from fastapi import FastAPI, HTTPException, Request
from fastapi.responses import RedirectResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, HttpUrl
from typing import Optional
from contextlib import asynccontextmanager
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

DB_PATH = "urls.db"

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: Initialize the database
    async with aiosqlite.connect(DB_PATH) as db:
        await db.execute("""
            CREATE TABLE IF NOT EXISTS urls (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                original_url TEXT NOT NULL UNIQUE,
                short_code TEXT NOT NULL UNIQUE
            )
        """)
        await db.commit()
    logger.info("Database initialized.")
    yield
    # Shutdown: (No specific cleanup needed for aiosqlite in this simple case)

app = FastAPI(title="URL Shortener", lifespan=lifespan)

# CORS for frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Configure for production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class URLRequest(BaseModel):
    url: HttpUrl
    custom_code: Optional[str] = None

class URLResponse(BaseModel):
    short_code: str
    short_url: str

def generate_short_code(length: int = 6) -> str:
    """Generate a random alphanumeric string."""
    chars = string.ascii_letters + string.digits
    return "".join(secrets.choice(chars) for _ in range(length))

@app.post("/shorten", response_model=URLResponse)
async def shorten_url(request: URLRequest, raw_request: Request):
    original_url_str = str(request.url)
    
    async with aiosqlite.connect(DB_PATH) as db:
        # Check if URL already exists
        cursor = await db.execute(
            "SELECT short_code FROM urls WHERE original_url = ?", 
            (original_url_str,)
        )
        row = await cursor.fetchone()
        
        if row:
            short_code = row[0]
        else:
            # Not in DB, need to create new entry
            if request.custom_code:
                short_code = request.custom_code
                # Check for collision with custom code
                cursor = await db.execute(
                    "SELECT 1 FROM urls WHERE short_code = ?", 
                    (short_code,)
                )
                if await cursor.fetchone():
                    raise HTTPException(status_code=400, detail="Short code already exists")
            else:
                # Generate unique random code
                while True:
                    short_code = generate_short_code()
                    cursor = await db.execute(
                        "SELECT 1 FROM urls WHERE short_code = ?", 
                        (short_code,)
                    )
                    if not await cursor.fetchone():
                        break
            
            # Insert logic (unified)
            await db.execute(
                "INSERT INTO urls (original_url, short_code) VALUES (?, ?)",
                (original_url_str, short_code)
            )
            await db.commit()

    # Construct the full short URL using the request base URL
    base_url = str(raw_request.base_url).rstrip("/")
    return URLResponse(
        short_code=short_code,
        short_url=f"{base_url}/{short_code}"
    )

@app.get("/{short_code}")
async def redirect_to_url(short_code: str):
    async with aiosqlite.connect(DB_PATH) as db:
        cursor = await db.execute(
            "SELECT original_url FROM urls WHERE short_code = ?", 
            (short_code,)
        )
        row = await cursor.fetchone()
        
    if row:
        return RedirectResponse(url=row[0])
    else:
        raise HTTPException(status_code=404, detail="Short URL not found")

@app.get("/health/status")
async def health():
    return {"status": "healthy"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
