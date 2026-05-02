# PulseMate System Integration

## End-to-End Working Flow

1. **User Signup/Login**:
   - User signs up via React frontend → FastAPI `/auth/signup`
   - JWT token issued, stored in localStorage
   - Role-based dashboard loads (admin/user)

2. **Chatbot Interaction**:
   - User asks questions in chat → React frontend → FastAPI `/chat/query`
   - LangGraph workflow:
     - Retrieves role-filtered docs from ChromaDB RAG
     - Generates response with Gemini
     - Checks if ticket should be raised
   - If ticket suggested, user can approve → Frontend calls FastAPI `/tickets/lifecycle`

3. **Ticket Creation**:
   - FastAPI ticket lifecycle workflow:
     - Validates ticket
     - Calls Node.js ServiceNow server to create incident
     - If ServiceNow fails, stores locally in SQLite
     - Updates status, responds to chatbot

4. **Ticket Management**:
   - Admins can view tickets in UI → React frontend → FastAPI `/tickets/` (GET)
   - Ticket status updates via ServiceNow API or local fallback

5. **Role-Based Restrictions**:
   - Enforced in FastAPI: users see only their tickets, admins see all
   - RAG filters knowledge by role
   - UI shows role-specific features

## API Connections

- **Frontend (React) ↔ FastAPI**:
  - Auth: `/auth/signup`, `/auth/token`, `/auth/me`
  - Chat: `/chat/query`
  - Tickets: `/tickets/lifecycle` (POST), `/tickets/` (GET)

- **FastAPI ↔ Node.js ServiceNow Server**:
  - Ticket creation: `POST /api/incidents`
  - Status update: `PATCH /api/incidents/:id/status`
  - Close ticket: `POST /api/incidents/:id/close`

- **FastAPI ↔ ChromaDB**:
  - Knowledge retrieval: `query_knowledge_base(query, role)`

- **FastAPI ↔ Gemini**:
  - Embeddings: `build_embeddings(texts)`
  - Response generation: `generate_response(query, docs, role)`

## Deployment Steps

### Prerequisites
- Node.js 18+, Python 3.12+, npm, pip
- SQLite (comes with Python)
- Google API key for Gemini
- ServiceNow instance credentials (optional for local fallback)

### 1. Setup Environment Variables

Create `.env` files in each backend directory:

**backend/fastapi/.env**:
```
GOOGLE_API_KEY=your-google-api-key
MODEL_NAME=gemini-2.5-flash
EMBEDDING_MODEL=textembedding-gecko-mini
CHROMADB_PATH=./chromadb_data
SERVICENOW_API_URL=http://localhost:4000/api
```

**backend/servicenow/.env**:
```
SN_INSTANCE=your-instance.service-now.com
SN_USERNAME=admin
SN_PASSWORD=changeme
SN_TABLE=incident
SQLITE_DB_PATH=./data/incidents.db
```

### 2. Install Dependencies

**FastAPI Backend**:
```bash
cd backend/fastapi
pip install -r requirements.txt
```

**Node.js ServiceNow Server**:
```bash
cd backend/servicenow
npm install
```

**React Frontend**:
```bash
cd frontend
npm install
```

### 3. Start Services

Run each in separate terminals:

**1. Node.js ServiceNow Server** (port 4000):
```bash
cd backend/servicenow
npm start
```

**2. FastAPI Backend** (port 8000):
```bash
cd backend/fastapi
uvicorn main:app --reload
```

**3. React Frontend** (port 5173):
```bash
cd frontend
npm run dev
```

### 4. Access Application

- Frontend: http://localhost:5173
- FastAPI docs: http://localhost:8000/docs
- ServiceNow server: http://localhost:4000

### 5. Test End-to-End Flow

1. Signup as user/admin
2. Login and access dashboard
3. Use chatbot to ask questions
4. Trigger ticket creation
5. View tickets in UI
6. Check ServiceNow (if configured) or local SQLite

## Notes

- ServiceNow integration is optional; system falls back to local SQLite
- ChromaDB initializes knowledge base on first run
- JWT tokens expire; implement refresh if needed
- For production, use proper CORS, HTTPS, and database