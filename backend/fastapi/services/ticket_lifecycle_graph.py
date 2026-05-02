from typing import TypedDict, Optional
from langgraph.graph import StateGraph, END
from servicenow_client import ServiceNowClient, ServiceNowClientError
from models import Ticket
from sqlalchemy.orm import Session


class TicketLifecycleState(TypedDict):
    ticket_payload: dict
    user_id: int
    auto_resolve: bool
    attempt: int
    servicenow_ticket_id: Optional[str]
    status: str
    source: str
    local_ticket_id: Optional[int]
    service_now_error: Optional[str]
    response: str
    suggested_action: Optional[str]
    error: Optional[str]


def validate_ticket(state: TicketLifecycleState) -> TicketLifecycleState:
    payload = state["ticket_payload"]
    missing = []

    for field in ["short_description", "description"]:
        if not payload.get(field):
            missing.append(field)

    if missing:
        state["error"] = f"Missing required fields: {', '.join(missing)}"
        state["status"] = "invalid"
        state["suggested_action"] = "request_correction"

    state["status"] = state.get("status", "new")
    return state


def decide_auto_resolve(state: TicketLifecycleState) -> TicketLifecycleState:
    if state["auto_resolve"]:
        state["status"] = "resolved"
        if not state["ticket_payload"].get("resolution_notes"):
            state["error"] = "Auto-resolve requested but no resolution_notes were provided."
            state["suggested_action"] = "provide_resolution_notes"
    return state


async def update_servicenow(state: TicketLifecycleState) -> TicketLifecycleState:
    if state.get("error"):
        return state

    state["attempt"] += 1
    client = ServiceNowClient()
    payload = {
        "short_description": state["ticket_payload"].get("short_description"),
        "description": state["ticket_payload"].get("description"),
        "urgency": state["ticket_payload"].get("urgency"),
        "impact": state["ticket_payload"].get("impact"),
        "caller_id": state["ticket_payload"].get("caller_id"),
    }

    try:
        if state["servicenow_ticket_id"]:
            if state["status"] == "resolved":
                result = await client.close_ticket(state["servicenow_ticket_id"], state["ticket_payload"].get("resolution_notes", "Auto-resolved."))
            else:
                result = await client.update_ticket_status(state["servicenow_ticket_id"], state["status"])
        else:
            result = await client.create_ticket(payload)
            state["servicenow_ticket_id"] = str(result.get("sys_id") or result.get("id") or "")

        state["source"] = "servicenow"
        state["service_now_error"] = None
        state["status"] = state["status"] or result.get("status") or "new"
    except ServiceNowClientError as exc:
        state["service_now_error"] = str(exc)
        state["source"] = "local-fallback"

    return state


def choose_servicenow_path(state: TicketLifecycleState) -> str:
    if state.get("service_now_error"):
        if state["attempt"] < 2:
            return "retry_update_servicenow"
        return "update_local_db"
    return "update_local_db"


def update_local_db(state: TicketLifecycleState, db: Session) -> TicketLifecycleState:
    ticket = None
    if state["local_ticket_id"]:
        ticket = db.query(Ticket).filter(Ticket.id == state["local_ticket_id"]).first()

    if ticket is None:
        ticket = Ticket(
            user_id=state["user_id"],
            servicenow_sys_id=state.get("servicenow_ticket_id"),
            number=state["ticket_payload"].get("number"),
            short_description=state["ticket_payload"].get("short_description", ""),
            description=state["ticket_payload"].get("description", ""),
            urgency=state["ticket_payload"].get("urgency"),
            impact=state["ticket_payload"].get("impact"),
            status=state["status"],
            resolution_notes=state["ticket_payload"].get("resolution_notes"),
            source=state["source"],
        )
        db.add(ticket)
    else:
        ticket.servicenow_sys_id = state.get("servicenow_ticket_id")
        ticket.status = state["status"]
        ticket.resolution_notes = state["ticket_payload"].get("resolution_notes")
        ticket.source = state["source"]

    db.commit()
    db.refresh(ticket)
    state["local_ticket_id"] = ticket.id
    return state


def respond_to_chatbot(state: TicketLifecycleState) -> TicketLifecycleState:
    if state.get("error"):
        state["response"] = (
            f"Ticket lifecycle failed: {state['error']}. "
            "Please correct the input and retry."
        )
        return state

    if state["service_now_error"]:
        state["response"] = (
            f"ServiceNow update failed after {state['attempt']} attempts. "
            "The ticket has been saved locally for later synchronization."
        )
    else:
        state["response"] = (
            f"Ticket has been processed successfully. "
            f"Local ticket ID: {state['local_ticket_id']}, source: {state['source']}."
        )

    if state["auto_resolve"]:
        state["suggested_action"] = "ticket_resolved"
    else:
        state["suggested_action"] = "ticket_saved"

    return state


def build_ticket_lifecycle_graph():
    graph = StateGraph(TicketLifecycleState)

    graph.add_node("validate_ticket", validate_ticket)
    graph.add_node("decide_auto_resolve", decide_auto_resolve)
    graph.add_node("update_servicenow", update_servicenow)
    graph.add_node("retry_update_servicenow", update_servicenow)
    graph.add_node("update_local_db", update_local_db)
    graph.add_node("respond_to_chatbot", respond_to_chatbot)

    graph.set_entry_point("validate_ticket")
    graph.add_edge("validate_ticket", "decide_auto_resolve")
    graph.add_edge("decide_auto_resolve", "update_servicenow")
    graph.add_conditional_edges("update_servicenow", choose_servicenow_path, {
        "retry_update_servicenow": "retry_update_servicenow",
        "update_local_db": "update_local_db",
    })
    graph.add_edge("retry_update_servicenow", "update_servicenow")
    graph.add_edge("update_local_db", "respond_to_chatbot")
    graph.add_edge("respond_to_chatbot", END)

    return graph.compile()


ticket_lifecycle_graph = build_ticket_lifecycle_graph()


async def run_ticket_lifecycle(ticket_payload: dict, user_id: int, db: Session):
    state: TicketLifecycleState = TicketLifecycleState(
        ticket_payload=ticket_payload,
        user_id=user_id,
        auto_resolve=ticket_payload.get("auto_resolve", False),
        attempt=0,
        servicenow_ticket_id=None,
        status="new",
        source="local",
        local_ticket_id=None,
        service_now_error=None,
        response="",
        suggested_action=None,
        error=None,
    )

    result = await ticket_lifecycle_graph.ainvoke(state, db=db)
    return {
        "ticket_id": result.get("local_ticket_id", 0),
        "servicenow_sys_id": result.get("servicenow_ticket_id"),
        "status": result.get("status", "unknown"),
        "source": result.get("source", "local"),
        "message": result.get("response", ""),
        "attempt": result.get("attempt", 0),
        "error": result.get("service_now_error") or result.get("error"),
        "suggested_action": result.get("suggested_action"),
    }
