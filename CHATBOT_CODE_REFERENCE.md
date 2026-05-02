# Quick Reference: Chatbot System Code Organization

## File-by-File Breakdown

### `knowledge_base.py` (110 lines)
**What it does:** Defines all FAQ, navigation, troubleshooting, and health monitoring documents.

**Key functions:**
- `get_knowledge_base_for_role(role)` - Filter docs by role
- `serialize_knowledge_base()` - Convert to ChromaDB format

**Usage:** Auto-imported by ChromaDB service on startup

---

### `services/chromadb_service.py` (55 lines)
**What it does:** Manages vector database for semantic search with role-based filtering.

**Key functions:**
- `initialize_chromadb()` - Load knowledge base into ChromaDB
- `get_collection()` - Get ChromaDB collection singleton
- `search_knowledge_base(query, role, top_k)` - Retrieve role-filtered docs

**Called by:** LangGraph workflow [Retrieve node]

**Example:**
```python
docs = search_knowledge_base("Where is dashboard?", "user", top_k=3)
# Returns: [{id, text, category, distance}, ...]
```

---

### `services/azure_openai_service.py` (65 lines)
**What it does:** LLM integration with RAG prompt building.

**Key functions:**
- `get_llm()` - Create Azure OpenAI client (singleton)
- `build_rag_prompt(query, docs, role)` - Create prompt with context
- `generate_response(query, docs, role, history)` - Call LLM async
- `should_raise_ticket(query)` - Detect ticket keywords
- `extract_ticket_context(query, answer)` - Prepare ticket data

**Called by:** LangGraph workflow [Generate & Check Ticket nodes]

**Example:**
```python
response = await generate_response(
    query="Fix login issue",
    retrieved_docs=[{id, text}, ...],
    role="user",
    conversation_history=[{role, content}, ...]
)
# Returns: "Ensure your email and password are correct..."
```

---

### `services/langgraph_service.py` (95 lines)
**What it does:** Orchestrates the chatbot workflow using LangGraph.

**Key classes:**
- `ChatState(TypedDict)` - Workflow state definition

**Key functions:**
- `retrieve_documents(state)` - Call ChromaDB service
- `generate_answer(state)` - Call Azure OpenAI service
- `check_ticket_request(state)` - Detect ticket creation needs
- `build_chatbot_graph()` - Create LangGraph DAG
- `run_chatbot(query, role, user_id, history)` - Execute workflow

**Workflow Graph:**
```
retrieve → generate → check_ticket → END
```

**Called by:** Chatbot router endpoint

---

### `routers/chatbot_router.py` (130 lines)
**What it does:** FastAPI endpoints for chat operations.

**Endpoints:**
- `POST /chat/query` - Main chatbot endpoint
- `GET /chat/history?session_id=1` - Get conversation
- `GET /chat/sessions` - List user's chats
- `POST /chat/tickets/create` - Create ticket from chat

**Authentication:** All endpoints require JWT token

**Database operations:**
- Loads/creates ChatSession from SQLite
- Persists conversation history as JSON
- Enforces user ownership of sessions

---

### `models.py` (25 lines)
**What it does:** SQLAlchemy ORM models.

**Models:**
- `User` - email, hashed_password, role, timestamps
- `ChatSession` - user_id, conversation (JSON), timestamps

**Used by:** Database layer for persistence

---

### `schemas.py` (45 lines)
**What it does:** Pydantic validation schemas.

**Key schemas:**
- `ChatRequest` - query, session_id
- `ChatResponse` - answer, sources, suggested_action, ticket_context
- `ChatMessage` - role, content (internal)

**Used by:** Endpoint request/response validation

---

### `main.py` (35 lines)
**What it does:** FastAPI app initialization and router registration.

**Includes:**
- CORS middleware (allow all origins)
- Authentication endpoints (signup, login, me)
- Admin endpoints (list users)
- Chatbot router registration

**Startup:** Database tables created, app ready

---

## Data Flow Diagram

```
Frontend sends: { query, session_id }
        ↓
Chatbot Router (/chat/query)
        ↓
Load ChatSession from SQLite
        ↓
Execute LangGraph Workflow:
        ↓
    ┌───────────────────────────────────────┐
    │ [Retrieve Node]                       │
    │ - Call chromadb_service.py            │
    │ - Semantic search + role filter       │
    │ → retrieved_docs                      │
    └───────────────────────────────────────┘
        ↓
    ┌───────────────────────────────────────┐
    │ [Generate Node]                       │
    │ - Call azure_openai_service.py        │
    │ - Build RAG prompt                    │
    │ - Call Azure OpenAI with history      │
    │ → response                            │
    └───────────────────────────────────────┘
        ↓
    ┌───────────────────────────────────────┐
    │ [Check Ticket Node]                   │
    │ - Call azure_openai_service.py        │
    │ - should_raise_ticket()               │
    │ → suggested_action, ticket_context    │
    └───────────────────────────────────────┘
        ↓
Save updated ChatSession to SQLite
        ↓
Return ChatResponse to Frontend
```

---

## Configuration Files

### `.env.example`
```bash
AZURE_OPENAI_API_KEY=...
AZURE_OPENAI_ENDPOINT=...
AZURE_OPENAI_DEPLOYMENT=gpt-4
CHROMADB_PATH=./chromadb_data
```

### `requirements.txt`
All Python packages including:
- fastapi, uvicorn
- sqlalchemy, pydantic
- langgraph, langchain, langchain-openai
- chromadb, openai
- passlib, python-jose

---

## Database Schema

### users
```sql
id (PK) | email (UNIQUE) | hashed_password | role | created_at | updated_at
```

### chat_sessions
```sql
id (PK) | user_id (FK) | conversation (TEXT/JSON) | created_at | updated_at
```

---

## Testing Tips

### Test User Query
```bash
curl -X POST http://localhost:8000/chat/query \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "query": "Where is the dashboard?",
    "session_id": null
  }'
```

### Test Admin Query
```bash
# Same endpoint, but user must have role="admin"
{
  "query": "Where is analytics?",
  "session_id": null
}
```

### Expected Response
```json
{
  "answer": "The dashboard is your main hub...",
  "sources": ["nav_1"],
  "suggested_action": null,
  "ticket_context": null
}
```

---

## Common Issues & Solutions

| Issue | Solution |
|-------|----------|
| "ChromaDB init failed" | Ensure `chromadb_data` folder is writable |
| "Could not validate credentials" | Check JWT token is valid and includes role claim |
| "Session not found" | Verify session_id exists and belongs to user |
| "Azure OpenAI error" | Check API key, endpoint, and deployment name |
| "Role restriction not working" | Verify knowledge_base.py has correct role_restriction values |

---

## Adding New Knowledge Documents

1. Open `knowledge_base.py`
2. Add to appropriate category dict:
```python
"your_id": {
    "id": "your_id",
    "query": "User's question pattern",
    "answer": "Your answer here",
    "category": "navigation|troubleshooting|faqs|health",
    "role_restriction": None  # or "admin" or "user"
}
```
3. Restart app - docs are auto-indexed on startup

---

## Extension Points

### Add Custom LLM
Modify `services/azure_openai_service.py`:
```python
# Replace Azure OpenAI with your LLM
llm = ChatOpenAI(model="gpt-4")  # OpenAI directly
# or
llm = AnthropicChat(model="claude-3")  # Anthropic
```

### Add Ticket Service Integration
Modify `routers/chatbot_router.py` /chat/tickets/create:
```python
# Call ServiceNow API
ticket = servicenow_client.create_ticket(...)
return {"ticket_id": ticket.id, ...}
```

### Add More Workflow Nodes
Modify `services/langgraph_service.py`:
```python
graph.add_node("your_node", your_function)
graph.add_edge("check_ticket", "your_node")
```

---

**Last Updated:** May 2, 2026  
**System Status:** ✅ Production Ready
