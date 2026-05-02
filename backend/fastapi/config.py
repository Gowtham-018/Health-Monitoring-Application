import os
from pathlib import Path

try:
    from dotenv import load_dotenv
    dotenv_path = Path(__file__).parent.parent / ".env"
    load_dotenv(dotenv_path)
except Exception:
    pass

GOOGLE_API_KEY = os.getenv("GOOGLE_API_KEY", "")
MODEL_NAME = os.getenv("MODEL_NAME", "gemini-2.5-flash")

CHROMADB_PATH = os.getenv("CHROMADB_PATH", "./chromadb_data")

