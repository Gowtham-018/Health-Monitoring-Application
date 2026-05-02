import os
from typing import Any, Dict
import httpx

SERVICENOW_API_URL = os.getenv("SERVICENOW_API_URL", "http://localhost:4000/api")
SERVICENOW_TIMEOUT = float(os.getenv("SERVICENOW_TIMEOUT", "15"))


class ServiceNowClientError(Exception):
    def __init__(self, message: str, details: Any = None):
        super().__init__(message)
        self.details = details


class ServiceNowClient:
    def __init__(self, base_url: str = SERVICENOW_API_URL):
        self.base_url = base_url.rstrip("/")
        self.timeout = SERVICENOW_TIMEOUT

    async def create_ticket(self, payload: Dict[str, Any]) -> Dict[str, Any]:
        async with httpx.AsyncClient(timeout=self.timeout) as client:
            try:
                response = await client.post(f"{self.base_url}/incidents", json=payload)
                response.raise_for_status()
                return response.json().get("incident") or response.json().get("servicNowResult") or response.json()
            except httpx.HTTPError as exc:
                raise ServiceNowClientError("ServiceNow create ticket failed", str(exc))

    async def update_ticket_status(self, ticket_id: str, status: str) -> Dict[str, Any]:
        async with httpx.AsyncClient(timeout=self.timeout) as client:
            try:
                response = await client.patch(f"{self.base_url}/incidents/{ticket_id}/status", json={"status": status})
                response.raise_for_status()
                return response.json().get("incident") or response.json()
            except httpx.HTTPError as exc:
                raise ServiceNowClientError("ServiceNow update status failed", str(exc))

    async def close_ticket(self, ticket_id: str, resolution_notes: str) -> Dict[str, Any]:
        async with httpx.AsyncClient(timeout=self.timeout) as client:
            try:
                response = await client.post(
                    f"{self.base_url}/incidents/{ticket_id}/close",
                    json={"resolution_notes": resolution_notes},
                )
                response.raise_for_status()
                return response.json().get("incident") or response.json()
            except httpx.HTTPError as exc:
                raise ServiceNowClientError("ServiceNow close ticket failed", str(exc))
