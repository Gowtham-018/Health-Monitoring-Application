from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from deps import get_db, get_current_active_user
from schemas import TicketLifecycleRequest, TicketLifecycleResponse
from services.ticket_lifecycle_graph import run_ticket_lifecycle

router = APIRouter(prefix="/tickets", tags=["tickets"])


@router.post("/lifecycle", response_model=TicketLifecycleResponse)
async def ticket_lifecycle(
    request: TicketLifecycleRequest,
    current_user = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    result = await run_ticket_lifecycle(request.dict(), current_user.id, db)
    if result.get("error") and result["source"] == "local-fallback":
        return result
    if result.get("error"):
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=result["error"])
    return result


@router.get("/")
async def list_tickets(
    current_user = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    from models import Ticket
    tickets = db.query(Ticket).filter(Ticket.user_id == current_user.id).all()
    return {"tickets": tickets}
