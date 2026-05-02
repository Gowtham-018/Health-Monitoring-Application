# PulseMate Chatbot System - Integration Guide

## Architecture Overview

The PulseMate chatbot is built using **LangGraph** and **ChromaDB** with **Azure OpenAI** as the LLM backend. It provides role-based RAG (Retrieval-Augmented Generation) capabilities with conversation memory.

## System Components

### 1. FastAPI Backend (`backend/fastapi/`)

**Core Services:**
- **LangGraph Workflow** (`services/langgraph_service.py`)
  - Orchestrates the chatbot logic using a directed acyclic graph (DAG)
  - Three-step workflow: Retrieve → Generate → Check Ticket
  - Maintains conversation state and history

- **ChromaDB Vector Store** (`services/chromadb_service.py`)
  - Stores knowledge base embeddings
  - Supports semantic search
  - Applies role-based filtering on retrieved documents

- **Azure OpenAI Integration** (`services/azure_openai_service.py`)
  - Generates responses using Azure's GPT-4
  - Builds RAG prompts with retrieved context
  - Supports multi-turn conversations with history

- **Knowledge Base** (`knowledge_base.py`)
  - Pre-populated with FAQ, navigation help, troubleshooting, health info
  - Documents have role restrictions (admin/user)
  - Organized in categories for easy maintenance

### 2. Database Schema

**users table:**
```sql
CREATE TABLE users (
  id INTEGER PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  hashed_password TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'user',
  created_at DATETIME,
  updated_at DATETIME
);
```

**chat_sessions table:**
```sql
CREATE TABLE chat_sessions (
  id INTEGER PRIMARY KEY,
  user_id INTEGER NOT NULL,
  conversation TEXT NOT NULL,  -- JSON array of messages
  created_at DATETIME,
  updated_at DATETIME
);
```

### 3. API Endpoints

**Chat Endpoints:**
- `POST /chat/query` - Send a message (requires authentication)
  - Request: `{ "query": "...", "session_id": null }`
  - Response: `{ "answer": "...", "sources": [...], "suggested_action": "..." }`

- `GET /chat/history?session_id=1` - Retrieve full conversation history

- `GET /chat/sessions` - List all chat sessions for current user

- `POST /chat/tickets/create` - Create a ticket from chatbot context

## Workflow Execution

### LangGraph States & Nodes

```
START
  ↓
[Retrieve] → Search ChromaDB with user query
  ↓
[Generate] → Build RAG prompt + call Azure OpenAI
  ↓
[Check Ticket] → Detect if ticket creation is needed
  ↓
END
```

### State Management

Each workflow run processes a `ChatState` containing:
- `query`: User's input message
- `role`: User role (admin/user) for RBAC
- `messages`: Conversation history
- `retrieved_docs`: Matched knowledge base documents
- `response`: Generated answer
- `suggested_action`: Ticket creation flag
- `ticket_context`: Data for ticket creation

## Role-Based Access Control

### Admin Access
- Can view analytics information
- Can access all knowledge base documents
- Receives admin-focused prompts

### User Access
- Cannot view admin analytics
- Filtered knowledge base (admin docs removed)
- User-focused prompts with data restrictions

**Implementation:**
1. User role is checked at request level (`get_current_active_user`)
2. ChromaDB results are filtered by `role_restriction` metadata
3. LLM prompt includes role-specific instructions

## Knowledge Base Structure

Each knowledge document includes:
- `id`: Unique identifier
- `query`: User query pattern
- `answer`: Response text
- `category`: navigation | troubleshooting | faqs | health
- `role_restriction`: null (public) | "admin" | "user"

Example:
```python
{
    "id": "nav_3",
    "query": "Where is analytics?",
    "answer": "Analytics is available only to admins...",
    "category": "navigation",
    "role_restriction": "admin"
}
```

## Configuration

### Required Environment Variables

```bash
# Azure OpenAI
AZURE_OPENAI_API_KEY=your-key
AZURE_OPENAI_ENDPOINT=https://your-resource.openai.azure.com/
AZURE_OPENAI_DEPLOYMENT=gpt-4

# ChromaDB
CHROMADB_PATH=./chromadb_data

# Database
DATABASE_URL=sqlite:///./pulsemate_auth.db
```

Copy `.env.example` to `.env` and fill in values.

## Frontend Integration

### React Component Integration

The frontend (`frontend/src/components/FloatingChatbot.tsx`) connects to the backend:

```typescript
const response = await fetch('/chat/query', {
  method: 'POST',
  headers: { 
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    query: userMessage,
    session_id: sessionId
  })
});
```

### Expected Response

```json
{
  "answer": "The dashboard is your main hub...",
  "sources": ["nav_1", "nav_2"],
  "suggested_action": "raise_ticket",
  "ticket_context": {
    "issue_description": "Device not connecting",
    "related_answer": "...",
    "source_from_chatbot": true
  }
}
```

## Running the System

### 1. Start FastAPI Backend
```bash
cd backend/fastapi
pip install -r requirements.txt
export FLASK_ENV=development  # or set in .env
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

### 2. Start React Frontend
```bash
cd frontend
npm install
npm run dev  # Runs on http://localhost:5173
```

### 3. CORS Configuration

The FastAPI server includes CORS middleware to allow requests from the frontend:
```python
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

## Testing the Chatbot

### Example Queries

**User Role:**
- "Where is the dashboard?"
- "How to fix login issue?"
- "What is normal heart rate?"
- "Can I raise a ticket for a problem?"

**Admin Role:**
- "Where is analytics?" ← Returns admin-only info
- "How to fix device disconnect?" ← Same as user
- "Show ticket overview" ← Admin-focused response

### Ticket Creation Flow

1. User asks: "I have a device connection issue"
2. Chatbot detects "issue" keyword → `suggested_action: "raise_ticket"`
3. Frontend prompts: "Do you want to create a ticket?"
4. User confirms → Frontend calls `POST /chat/tickets/create`
5. Backend creates ticket and links to conversation

## Troubleshooting

### ChromaDB Initialization Failed
- Ensure `chromadb_data` directory is writable
- Check `CHROMADB_PATH` environment variable

### Azure OpenAI Connection Error
- Verify `AZURE_OPENAI_API_KEY` is set correctly
- Check endpoint format: `https://{resource}.openai.azure.com/`
- Ensure deployment name matches Azure resource

### Role-Based Filtering Not Working
- Verify user role is correctly fetched from `/auth/me`
- Check knowledge base `role_restriction` metadata
- Ensure JWT token includes role claim

## Future Enhancements

- [ ] Intent classification for better query routing
- [ ] Context-aware ticket templates
- [ ] Multi-language support
- [ ] Chatbot training on real interactions
- [ ] ServiceNow integration for ticket sync
- [ ] Analytics dashboard for chatbot metrics
