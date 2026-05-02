# ServiceNow Integration Server

Node.js Express backend for ServiceNow incident management with local SQLite fallback.

## Features

- Create ServiceNow incidents
- Update incident status
- Close incidents with resolution notes
- Store incidents locally in SQLite
- Fallback to local storage when ServiceNow is unavailable

## Setup

1. Copy `.env.example` to `.env`
2. Install dependencies:
   ```bash
   cd backend/servicenow
   npm install
   ```
3. Start the server:
   ```bash
   npm start
   ```

## API Routes

### Create incident

POST `/api/incidents`

Body:
```json
{
  "short_description": "Server outage",
  "description": "The database server is not responding.",
  "urgency": "2",
  "impact": "2",
  "caller_id": "john.doe"
}
```

### Update incident status

PATCH `/api/incidents/:id/status`

Body:
```json
{
  "status": "in progress"
}
```

### Close incident

POST `/api/incidents/:id/close`

Body:
```json
{
  "resolution_notes": "Restarted the database service and verified connectivity."
}
```

### Get local incident

GET `/api/incidents/:id`

## Notes

- `id` refers to the local SQLite incident ID.
- If ServiceNow is unavailable, the server stores incident data locally and returns the fallback result.
- Local records include a `source` field to distinguish `servicenow` from `local-fallback` entries.
