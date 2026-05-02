from typing import TypedDict, Annotated, Sequence, Optional
from langgraph.graph import StateGraph, END
from langgraph.graph.message import add_messages

from chromadb_service import query_knowledge_base
from gemini_service import (
    generate_response,
    should_raise_ticket,
    extract_ticket_context,
)


class ChatState(TypedDict):
    """State for the chatbot workflow."""

    query: str
    role: str
    user_id: int
    messages: Annotated[Sequence[dict], add_messages]
    retrieved_docs: list
    response: str
    suggested_action: Optional[str]
    ticket_context: Optional[dict]
    error: Optional[str]


def retrieve_documents(state: ChatState) -> ChatState:
    """Retrieve relevant documents from the role-based RAG store."""
    try:
        docs = query_knowledge_base(state["query"], state["role"], top_k=3)
        state["retrieved_docs"] = docs
    except Exception as e:
        state["error"] = f"Retrieval failed: {str(e)}"
    return state


async def generate_answer(state: ChatState) -> ChatState:
    """Generate answer using LLM with RAG."""
    if state.get("error"):
        return state

    try:
        answer = await generate_response(
            state["query"],
            state["retrieved_docs"],
            state["role"],
            conversation_history=state["messages"],
        )
        state["response"] = answer
        state["messages"].append({"role": "user", "content": state["query"]})
        state["messages"].append({"role": "assistant", "content": answer})
    except Exception as e:
        state["error"] = f"Generation failed: {str(e)}"
    return state


def check_ticket_request(state: ChatState) -> ChatState:
    """Check if user is asking about raising a ticket."""
    if state.get("error"):
        return state

    if should_raise_ticket(state["query"]):
        state["suggested_action"] = "raise_ticket"
        state["ticket_context"] = extract_ticket_context(state["query"], state["response"])
    return state


def build_chatbot_graph():
    """Build the LangGraph workflow for the chatbot."""
    graph = StateGraph(ChatState)

    graph.add_node("retrieve", retrieve_documents)
    graph.add_node("generate", generate_answer)
    graph.add_node("check_ticket", check_ticket_request)

    graph.set_entry_point("retrieve")
    graph.add_edge("retrieve", "generate")
    graph.add_edge("generate", "check_ticket")
    graph.add_edge("check_ticket", END)

    return graph.compile()


chatbot_workflow = build_chatbot_graph()


async def run_chatbot(
    query: str,
    role: str,
    user_id: int,
    conversation_history: list = None,
):
    """Run the chatbot workflow."""
    if conversation_history is None:
        conversation_history = []

    state = ChatState(
        query=query,
        role=role,
        user_id=user_id,
        messages=conversation_history,
        retrieved_docs=[],
        response="",
        suggested_action=None,
        ticket_context=None,
        error=None,
    )

    result = await chatbot_workflow.ainvoke(state)

    return {
        "answer": result.get("response", ""),
        "sources": [doc["id"] for doc in result.get("retrieved_docs", [])],
        "suggested_action": result.get("suggested_action"),
        "ticket_context": result.get("ticket_context"),
        "error": result.get("error"),
    }
