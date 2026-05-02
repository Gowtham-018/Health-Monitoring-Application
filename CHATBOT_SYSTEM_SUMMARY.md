# PulseMate AI Chatbot System - Complete Overview

## What Was Built

A full-stack AI chatbot system using **LangGraph**, **ChromaDB**, and **Azure OpenAI** with role-based RAG capabilities, conversation memory, and ticket creation workflows.

---

## 📁 Project Structure

```
backend/fastapi/
├── main.py                          # FastAPI app with CORS
├── models.py                        # SQLAlchemy models (User, ChatSession)
├── schemas.py                       # Pydantic schemas (ChatRequest, ChatResponse)
├── auth.py                          # JWT & password hashing logic
├── config.py                        # Configuration & environment
├── database.py                      # SQLite connection
├── deps.py                          # Dependency injection
├── knowledge_base.py                # Pre-populated FAQ & knowledge docs
├── requirements.txt                 # Python dependencies
├── .env.example                     # Configuration template
├── README.md                        # Setup instructions
├── services/
│   ├── chromadb_service.py         # Vector DB with role-based filtering
│   ├── azure_openai_service.py     # LLM integration & RAG prompts
│   └── langgraph_service.py        # LangGraph workflow orchestration
└── routers/
    └── chatbot_router.py           # Chat endpoints (query, history, sessions)
```

---

## 🤖 Core Features

### 1. **LangGraph Workflow**
- Multi-step orchestration: Retrieve → Generate → Check Ticket
- State management with conversation history
- Async execution for non-blocking responses
- Proper error handling throughout pipeline

### 2. **RAG with ChromaDB**
- Semantic search on knowledge base
- Documents organized by category (navigation, troubleshooting, FAQs, health)
- **Role-based filtering**
  - Admin documents accessible only to admins
  - User queries return filtered results
  - Automatic removal of sensitive info for regular users

### 3. **Azure OpenAI Integration**
- Uses `langchain_openai` for LLM calls
- Builds RAG prompts with context
- Supports multi-turn conversations
- Maintains last 4 messages for context awareness
- Role-aware prompts (different instructions for admin vs user)

### 4. **Conversation Memory**
- SQLite persistence
- Full conversation history per session
- Session isolation (users can't access others' chats)
- JSON serialization for conversation storage

### 5. **Ticket Creation Integration**
- Detects ticket keywords in user queries
- Automatic `suggested_action: "raise_ticket"` when relevant
- Extracts context for ticket creation
- Returns ticket context to frontend for ticket form pre-population

---

## 🔐 Role-Based Access Control

| Feature | User | Admin |
|---------|------|-------|
| Dashboard access | ✓ (vitals only) | ✓ (analytics) |
| Chatbot access | ✓ | ✓ |
| View admin docs | ✗ | ✓ |
| View analytics info | ✗ | ✓ |
| Raise tickets | ✓ | ✓ |
| Create tickets | ✗ | ✓ |

**Implementation:**
```python
# In chromadb_service.py
if doc["role_restriction"] is None or doc["role_restriction"] == role:
    filtered.append(doc)  # Only return if public or role matches
```

---

## 📊 Knowledge Base

Pre-populated with 12 documents across 4 categories:

### Navigation (3 docs)
- "Where is dashboard?"
- "How do I logout?"
- "Where is analytics?" (admin-only)

### Troubleshooting (3 docs)
- "How to fix login issue?"
- "Device not connecting?"
- "Vitals reading is incorrect?"

### FAQs (3 docs)
- "What are the user roles?"
- "Can I create multiple accounts?"
- "How are tickets managed?"

### Health Monitoring (3 docs)
- "What is normal heart rate?"
- "What oxygen level is healthy?"
- "How to interpret vitals?"

**Easily extensible:** Add new docs to `knowledge_base.py` and they'll be auto-indexed.

---

## 🔌 API Endpoints

### Chat Endpoints

**POST /chat/query**
```json
Request:
{
  "query": "How to fix login issue?",
  "session_id": null
}

Response:
{
  "answer": "Ensure your email and password are correct...",
  "sources": ["ts_1", "ts_2"],
  "suggested_action": null,
  "ticket_context": null
}
```

**GET /chat/history?session_id=1**
```json
Response:
{
  "history": [
    {"role": "user", "content": "Where is dashboard?"},
    {"role": "assistant", "content": "The dashboard is..."},
    ...
  ]
}
```

**GET /chat/sessions**
```json
Response:
{
  "sessions": [
    {
      "id": 1,
      "created_at": "2024-01-15T10:30:00",
      "updated_at": "2024-01-15T10:45:00",
      "preview": "Where is dashboard?"
    }
  ]
}
```

**POST /chat/tickets/create**
```json
Request:
{
  "description": "Device not connecting",
  "related_docs": ["ts_2", "hm_1"]
}

Response:
{
  "ticket_id": 123,
  "status": "created",
  "data": {...}
}
```

---

## 🚀 Setup Instructions

### 1. Install Dependencies
```bash
cd backend/fastapi
pip install -r requirements.txt
```

### 2. Configure Azure OpenAI
```bash
cp .env.example .env
# Edit .env with your Azure credentials:
# AZURE_OPENAI_API_KEY=your-key
# AZURE_OPENAI_ENDPOINT=https://your-resource.openai.azure.com/
# AZURE_OPENAI_DEPLOYMENT=gpt-4
```

### 3. Run Server
```bash
uvicorn main:app --reload --port 8000
```

### 4. Connect Frontend
The React frontend at `frontend/src/components/FloatingChatbot.tsx` calls:
```typescript
const response = await fetch('/chat/query', {
  method: 'POST',
  headers: { 'Authorization': `Bearer ${token}` },
  body: JSON.stringify({ query, session_id })
});
```

---

## 📦 Dependencies

**Core:**
- `fastapi` - Web framework
- `uvicorn` - ASGI server
- `sqlalchemy` - ORM
- `pydantic` - Data validation

**AI/ML:**
- `langgraph` - Workflow orchestration
- `langchain` - LLM framework
- `langchain-openai` - Azure OpenAI integration
- `chromadb` - Vector database
- `openai` - Azure OpenAI SDK

**Auth & Security:**
- `passlib[bcrypt]` - Password hashing
- `python-jose[cryptography]` - JWT tokens

---

## 🧪 Testing the Chatbot

### Example Queries

**As a User:**
```
Q: "Where is the dashboard?"
A: "The dashboard is your main hub. After login, you'll see your role-specific dashboard..."
Suggested action: None

Q: "I have a device connection problem"
A: "Check WiFi connection, restart the device, and ensure it's within range..."
Suggested action: "raise_ticket"
```

**As an Admin:**
```
Q: "Where is analytics?"
A: "Analytics is available only to admins on the Admin Dashboard..."
(Regular user would get: "I don't have information about admin features")
```

---

## 🔄 Workflow Execution Flow

```
User Message → /chat/query
       ↓
Authentication Check (JWT)
       ↓
Load/Create ChatSession
       ↓
Execute LangGraph Workflow:
  1. [Retrieve] → ChromaDB semantic search
     - Query embeddings via Azure OpenAI
     - Filter by role_restriction
     - Return top 3 matches
  2. [Generate] → Build RAG prompt
     - Combine role instructions + retrieved docs + query
     - Call Azure OpenAI
     - Get response
  3. [Check Ticket] → Detect keywords
     - Extract ticket context if needed
     - Set suggested_action
  ↓
Save to ChatSession (SQLite)
       ↓
Return Response → Frontend
       ↓
Frontend displays answer + optional ticket button
```

---

## ⚙️ Configuration

### Environment Variables
```bash
AZURE_OPENAI_API_KEY=sk-...              # Azure OpenAI key
AZURE_OPENAI_ENDPOINT=https://.../      # Azure endpoint
AZURE_OPENAI_DEPLOYMENT=gpt-4           # Model deployment
CHROMADB_PATH=./chromadb_data           # Vector DB path
DATABASE_URL=sqlite:///./pulsemate.db   # SQLite path
```

### Database Auto-Creation
- SQLite database is created automatically on first run
- Tables: `users`, `chat_sessions`
- ChromaDB initialized on app startup

---

## 🚨 Error Handling

| Error | Handling |
|-------|----------|
| Invalid JWT | 401 Unauthorized |
| User not found | 401 Unauthorized |
| Session access denied | 403 Forbidden |
| ChromaDB init failed | Warning logged, app continues |
| Azure OpenAI timeout | 500 error with message |
| Missing knowledge docs | Returns "Information not available" |

---

## 📈 Future Enhancements

- [ ] Intent classification (use LLM to classify query intent)
- [ ] Response ranking (return top answer with confidence)
- [ ] ServiceNow ticket sync (auto-update ticket status)
- [ ] Analytics dashboard (track chatbot metrics)
- [ ] Multi-language support (translate queries/responses)
- [ ] Custom training (fine-tune on real conversations)
- [ ] WebSocket support (real-time streaming responses)
- [ ] Conversation export (PDF/email conversation history)

---

## 📝 Notes

- Knowledge base is pre-populated in memory
- No external databases required (SQLite is bundled)
- CORS enabled for frontend communication
- All endpoints require JWT authentication (except /auth/*)
- Conversation history stored as JSON strings (easy to export)
- Role information comes from JWT token + verified against DB

---

**Build Status:** ✅ Complete and Ready for Testing

For detailed integration guide, see: [CHATBOT_INTEGRATION_GUIDE.md](./CHATBOT_INTEGRATION_GUIDE.md)
