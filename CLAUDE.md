# Notification Creator

Internal-tooling notification app. Scripts, CI/CD, monitoring, and cron jobs POST notifications via REST API. A React web portal displays them with tag-based filtering. Chrome browser notifications fire in real-time via SSE.

## Tech Stack

- **Backend:** Python — FastAPI, SQLAlchemy (async) + aiosqlite (SQLite), sse-starlette, Pydantic v2, Uvicorn
- **Frontend:** React + TypeScript (Vite), Tailwind CSS v4
- **Real-time:** SSE (sse-starlette → browser EventSource API → Chrome Notification API)
- **Deployment:** Docker Compose (nginx reverse proxy for frontend, uvicorn for backend)
- **No auth** — internal tool on private network

## Project Structure

```
notification_creator/
├── backend/
│   ├── pyproject.toml          # Python deps (install with uv)
│   ├── Dockerfile
│   ├── app/
│   │   ├── main.py             # FastAPI app, CORS, lifespan (creates tables on startup)
│   │   ├── config.py           # DB path, CORS origins
│   │   ├── database.py         # Async SQLAlchemy engine/session
│   │   ├── models.py           # ORM: Notification, NotificationTag
│   │   ├── schemas.py          # Pydantic request/response models
│   │   ├── crud.py             # All DB queries
│   │   ├── events.py           # In-process EventBus (asyncio.Queue fan-out)
│   │   └── routers/
│   │       ├── notifications.py  # REST CRUD + publishes SSE events
│   │       └── sse.py            # SSE stream endpoint
│   └── tests/
├── frontend/
│   ├── package.json
│   ├── Dockerfile              # Multi-stage: node build → nginx
│   ├── nginx.conf              # SPA routing + /api/ proxy to backend (SSE-safe)
│   ├── vite.config.ts          # Dev proxy /api → localhost:8000
│   └── src/
│       ├── App.tsx
│       ├── api.ts              # Fetch wrappers for all endpoints
│       ├── types.ts            # TypeScript interfaces
│       ├── hooks/
│       │   ├── useNotifications.ts  # State management, filtering, pagination
│       │   └── useSSE.ts            # EventSource + Chrome Notification API
│       └── components/
│           ├── Header.tsx           # Title + notification permission button
│           ├── NotificationList.tsx
│           ├── NotificationCard.tsx # Priority colors, mark read, delete
│           └── TagFilter.tsx        # Searchable tag pill filter
└── docker-compose.yml
```

## Commands

### Development

```bash
# Backend (from backend/)
uv venv .venv && uv pip install -e .
.venv/bin/uvicorn app.main:app --reload

# Frontend (from frontend/)
npm install
npm run dev
```

### Production (Docker)

```bash
docker compose up --build     # Frontend on :3000, backend on :8000 (internal)
```

### Type checking

```bash
cd frontend && npx tsc --noEmit
```

## API Endpoints (all under /api/v1/)

| Method | Path                        | Purpose                    |
|--------|-----------------------------|----------------------------|
| POST   | /notifications              | Create with tags           |
| GET    | /notifications              | List (filter tags/priority/unread, paginated) |
| GET    | /notifications/{id}         | Get single                 |
| PATCH  | /notifications/{id}/read    | Mark read                  |
| PATCH  | /notifications/read         | Mark multiple read (body: {ids}) |
| DELETE | /notifications/{id}         | Delete                     |
| GET    | /tags                       | List all distinct tags     |
| GET    | /sse                        | SSE event stream           |

## Key Patterns

- **SSE events** are published via `events.event_bus` singleton — POST/DELETE handlers call `event_bus.publish()`, SSE endpoint subscribes each client with its own asyncio.Queue
- **nginx.conf** disables proxy buffering for SSE to work through the reverse proxy
- **SQLite DB** is stored at `backend/data/notifications.db` (dev) or in a Docker named volume (prod)
- **Tailwind v4** uses `@import "tailwindcss"` in index.css with the `@tailwindcss/vite` plugin (no tailwind.config.js)
