from pydantic import BaseModel, EmailStr, constr
from typing import Optional, List


class Token(BaseModel):
    access_token: str
    token_type: str


class TokenData(BaseModel):
    email: Optional[str] = None
    role: Optional[str] = None


class UserCreate(BaseModel):
    email: EmailStr
    password: constr(min_length=8)
    role: Optional[str] = "user"


class UserOut(BaseModel):
    id: int
    email: EmailStr
    role: str

    class Config:
        orm_mode = True


class ChatMessage(BaseModel):
    role: str  # "user" or "assistant"
    content: str


class ChatRequest(BaseModel):
    query: str
    session_id: Optional[int] = None


class ChatResponse(BaseModel):
    answer: str
    sources: List[str]
    suggested_action: Optional[str]  # "raise_ticket", "view_analytics", etc.
    ticket_context: Optional[dict] = None


class TicketLifecycleRequest(BaseModel):
    short_description: str
    description: str
    urgency: Optional[str] = "3"
    impact: Optional[str] = "3"
    auto_resolve: Optional[bool] = False
    resolution_notes: Optional[str] = None
    user_approved: Optional[bool] = False


class TicketLifecycleResponse(BaseModel):
    ticket_id: int
    servicenow_sys_id: Optional[str]
    status: str
    source: str
    message: str
    attempt: int
    error: Optional[str] = None
    suggested_action: Optional[str] = None
