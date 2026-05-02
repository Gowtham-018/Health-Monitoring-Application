import os
import google.generativeai as genai

GOOGLE_API_KEY = os.getenv("GOOGLE_API_KEY", "")
MODEL_NAME = os.getenv("MODEL_NAME", "gemini-2.5-flash")

if GOOGLE_API_KEY:
    genai.configure(api_key=GOOGLE_API_KEY)


def build_rag_prompt(query: str, retrieved_docs: list, role: str) -> str:
    """Build RAG prompt with retrieved knowledge."""
    context = "\n\n".join([doc["text"] for doc in retrieved_docs])
    role_instruction = (
        "You are a helpful PulseMate assistant. Restrict admin-only information from regular users."
        if role == "user"
        else "You are a helpful PulseMate assistant for admins. You can access all information."
    )

    prompt = f"""{role_instruction}

User query: {query}

Knowledge base:
{context}

Answer the user's query using only the knowledge provided above. If the information is not available, say so."""

    return prompt


async def generate_response(query: str, retrieved_docs: list, role: str, conversation_history: list = None):
    """Generate response using Gemini with RAG."""
    prompt = build_rag_prompt(query, retrieved_docs, role)

    if conversation_history:
        history_text = "\n".join([
            f"{msg['role']}: {msg['content']}" for msg in conversation_history[-4:]
        ])
        prompt = f"Conversation history:\n{history_text}\n\n{prompt}"

    response = genai.responses.create(
        model=MODEL_NAME,
        temperature=0.7,
        max_output_tokens=512,
        text=prompt,
    )

    if hasattr(response, "output_text") and response.output_text:
        return response.output_text

    if response and getattr(response, "output", None):
        output = response.output[0]
        if getattr(output, "content", None):
            return output.content[0].text

    return "I'm sorry, I couldn't generate a response right now."


def should_raise_ticket(query: str) -> bool:
    """Determine if the user is asking about raising a ticket."""
    ticket_keywords = ["ticket", "issue", "problem", "raise", "create", "incident", "support"]
    return any(keyword in query.lower() for keyword in ticket_keywords)


def extract_ticket_context(query: str, answer: str) -> dict:
    """Extract context for ticket creation."""
    return {
        "issue_description": query,
        "related_answer": answer,
        "source_from_chatbot": True,
    }
