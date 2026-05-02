import os
import chromadb
from chromadb.config import Settings
import google.generativeai as genai

client = None
collection = None

# ChromaDB data directory
CHROMADB_PATH = os.getenv("CHROMADB_PATH", "./chromadb_data")
EMBEDDING_MODEL = os.getenv("EMBEDDING_MODEL", "textembedding-gecko-mini")
GOOGLE_API_KEY = os.getenv("GOOGLE_API_KEY", "")

if GOOGLE_API_KEY:
    genai.configure(api_key=GOOGLE_API_KEY)


def build_embeddings(texts: list[str]) -> list[list[float]]:
    """Generate vector embeddings for text using Gemini."""
    if not GOOGLE_API_KEY:
        raise RuntimeError("GOOGLE_API_KEY is required to build text embeddings.")

    response = genai.embed_content(model=EMBEDDING_MODEL, content=texts)
    embeddings = []

    if isinstance(response, dict):
        if "data" in response:
            for item in response["data"]:
                if item is None:
                    continue
                embedding = item.get("embedding")
                if embedding is not None:
                    embeddings.append(embedding)
        elif "embedding" in response:
            embeddings.append(response["embedding"])
        elif "embeddings" in response:
            for item in response["embeddings"]:
                if item is None:
                    continue
                embeddings.append(item.get("embedding"))

    if not embeddings:
        raise RuntimeError("Could not extract embeddings from Gemini response.")

    return embeddings


def initialize_chromadb():
    """Initialize ChromaDB client and load the role-aware knowledge base."""
    global client, collection

    try:
        from knowledge_base import serialize_knowledge_base
    except ImportError:
        import sys
        sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))
        from knowledge_base import serialize_knowledge_base

    settings = Settings(
        chroma_db_impl="duckdb+parquet",
        persist_directory=CHROMADB_PATH,
        anonymized_telemetry=False,
    )
    client = chromadb.Client(settings)

    collection = client.get_or_create_collection(
        name="pulsemate_knowledge",
        metadata={"hnsw:space": "cosine"},
    )

    if collection.count() == 0:
        chunks = serialize_knowledge_base()
        texts = [chunk["text"] for chunk in chunks]
        embeddings = build_embeddings(texts)

        collection.add(
            ids=[chunk["id"] for chunk in chunks],
            documents=texts,
            metadatas=[chunk["metadata"] for chunk in chunks],
            embeddings=embeddings,
        )


def get_collection():
    """Get ChromaDB collection, initializing it if needed."""
    global collection
    if collection is None:
        initialize_chromadb()
    return collection


def query_knowledge_base(query: str, role: str, top_k: int = 3) -> list:
    """Query ChromaDB using a role-aware retrieval filter."""
    coll = get_collection()
    query_embedding = build_embeddings([query])[0]
    results = coll.query(
        query_embeddings=[query_embedding],
        n_results=top_k,
        include=["documents", "metadatas", "ids", "distances"],
    )

    filtered = []
    if results and results["metadatas"]:
        for i, metadata in enumerate(results["metadatas"][0]):
            role_restriction = metadata.get("role_restriction")
            if role_restriction is None or role_restriction == role:
                filtered.append(
                    {
                        "id": results["ids"][0][i],
                        "text": results["documents"][0][i],
                        "category": metadata.get("category"),
                        "scope": metadata.get("scope"),
                        "distance": results["distances"][0][i] if results["distances"] else 0,
                    }
                )

    return filtered


def search_knowledge_base(query: str, role: str, top_k: int = 3) -> list:
    """Backward-compatible wrapper for query_knowledge_base."""
    return query_knowledge_base(query, role, top_k)
