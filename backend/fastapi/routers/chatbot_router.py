import json
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
import os
import sys

# Add parent directory to path
parent_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if parent_dir not in sys.path:
    sys.path.insert(0, parent_dir)

from models import User, ChatSession
from schemas import ChatRequest, ChatResponse
from database import SessionLocal
from deps import get_current_active_user
from services.chromadb_service import initialize_chromadb, search_knowledge_base
from services.langgraph_service import run_chatbot

router = APIRouter(prefix="/chat", tags=["chatbot"])


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


@router.on_event("startup")
async def startup_chatbot():
    """Initialize ChromaDB on startup."""
    try:
        initialize_chromadb()
    except Exception as e:
        print(f"Warning: ChromaDB initialization failed: {e}")


@router.post("/query", response_model=ChatResponse)
async def chat_query(
    request: ChatRequest,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    """Send a query to the chatbot."""
    try:
        # Retrieve or create chat session
        session = None
        conversation_history = []

        if request.session_id:
            session = db.query(ChatSession).filter(ChatSession.id == request.session_id).first()
            if session and session.user_id != current_user.id:
                raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Unauthorized session access")
            if session:
                conversation_history = json.loads(session.conversation)

        # Run chatbot workflow
        result = await run_chatbot(
            query=request.query,
            role=current_user.role,
            user_id=current_user.id,
            conversation_history=conversation_history,
        )

        if result.get("error"):
            raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=result["error"])

        # Save or update session
        updated_history = conversation_history + [
            {"role": "user", "content": request.query},
            {"role": "assistant", "content": result["answer"]},
        ]

        if session:
            session.conversation = json.dumps(updated_history)
            db.commit()
        else:
            session = ChatSession(
                user_id=current_user.id,
                conversation=json.dumps(updated_history),
            )
            db.add(session)
            db.commit()
            db.refresh(session)

        return ChatResponse(
            answer=result["answer"],
            sources=result.get("sources", []),
            suggested_action=result.get("suggested_action"),
            ticket_context=result.get("ticket_context"),
        )

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))


@router.get("/history")
async def chat_history(
    session_id: int,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    """Retrieve chat history for a session."""
    session = db.query(ChatSession).filter(ChatSession.id == session_id).first()

    if not session:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Session not found")

    if session.user_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Unauthorized session access")

    return {"history": json.loads(session.conversation)}


@router.post("/sessions")
async def list_sessions(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    """List chat sessions for current user."""
    sessions = (
        db.query(ChatSession)
        .filter(ChatSession.user_id == current_user.id)
        .order_by(ChatSession.updated_at.desc())
        .all()
    )
    return {
        "sessions": [
            {
                "id": s.id,
                "created_at": s.created_at,
                "updated_at": s.updated_at,
                "preview": json.loads(s.conversation)[0]["content"] if s.conversation else "",
            }
            for s in sessions
        ]
    }


@router.post("/tickets/create")
async def create_ticket_from_chat(
    request: dict,
    current_user: User = Depends(get_current_active_user),
):
    """Create a ticket from chatbot interaction."""
    try:
        # This will integrate with the main ticket system
        ticket_data = {
            "user_id": current_user.id,
            "role": current_user.role,
            "description": request.get("description", ""),
            "source": "chatbot",
            "related_docs": request.get("related_docs", []),
        }
        # TODO: Integrate with ticket creation service
        return {"ticket_id": 1, "status": "created", "data": ticket_data}
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))
