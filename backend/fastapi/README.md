# PulseMate FastAPI Auth & Chatbot Service

## Features

### Authentication
- Signup & Login APIs
- Store users in SQLite
- Roles: "user" and "admin"
- Password validation (min 8 chars, uppercase, lowercase, number, special char)
- Hash passwords using bcrypt
- JWT authentication

### Chatbot with LangGraph & RAG
- Multi-turn conversation with memory
- Role-based access control
  - Admin: Can access analytics info
  - User: Cannot access admin data
- ChromaDB vector database for knowledge retrieval
- Gemini LLM integration via Google Generative AI
- Conversation history persistence
- Automatic ticket creation suggestions
- Knowledge base includes:
  - App navigation help
  - Troubleshooting
  - FAQs
  - Health monitoring info

## Setup

1. Create a Python environment:
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

2. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```

3. Configure Gemini:
   - Copy `.env.example` to `.env`
   - Fill in your Gemini credentials:
     ```
     GOOGLE_API_KEY=AIzaSyDzwIXhnyXLCCoEW3LLu__Zuq_NI9OCMOE
     MODEL_NAME=gemini-2.5-flash
     ```

4. Run the server:
   ```bash
   uvicorn main:app --reload
   ```

## Database

- SQLite database file: `pulsemate_auth.db`
- Tables: `users`, `chat_sessions`

## API Endpoints

### Authentication
- `POST /auth/signup` - Register new user
- `POST /auth/token` - Login (OAuth2 password flow)
- `GET /auth/me` - Get current user info
- `GET /admin/users` - List all users (admin only)

### Chatbot
- `POST /chat/query` - Send message to chatbot
- `GET /chat/history` - Retrieve chat history for a session
- `GET /chat/sessions` - List chat sessions for current user
- `POST /chat/tickets/create` - Create ticket from chatbot

## Architecture

### LangGraph Workflow
The chatbot uses LangGraph to orchestrate a multi-step workflow:

1. **Retrieve** - Search ChromaDB for relevant documents
2. **Generate** - Use Gemini to generate response with RAG context
3. **Check Ticket** - Determine if user is asking about raising a ticket

### Role-Based Access Control
- Knowledge base documents can be restricted by role
- Prompts include role-specific instructions
- Users cannot access admin-only information

### Vector Database (ChromaDB)
- Stores knowledge base documents as embeddings using Gemini.
- Supports semantic search over FAQs, troubleshooting guides, and navigation help.
- Separates admin, user, and shared knowledge scopes.
- Automatically filters retrieval results by user role.

### Conversation Memory
- Each chat session is persisted in SQLite
- Full conversation history is maintained
- History is passed to LLM for context-aware responses

