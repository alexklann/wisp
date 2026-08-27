# AGENTS.md — Agent Guidelines & Project Knowledge Base

For anyone reading this:
This is really only intended as a quick overview for AI assistants.
This project is not and will never be vibe-coded. All code is written by hand, by humans.
AI was only used during debugging and architectural decision making. Nothing was automated.
Except for this document, since this is not intended to be read by anyone other than AI models.

---

## 1. AGENT OPERATIONAL DIRECTIVES (CRITICAL)

- **MODE:** Advisory, architectural review, debugging, and planning ONLY.
- **FILE MODIFICATION RULE:** NEVER use write or edit tools on project source code files (`*.py`, `*.tsx`, `*.ts`, `*.css`, etc.). All application code MUST be written by the human developer.
- **ALLOWED OUTPUTS:** Architectural outlines, diagnostic analysis, pseudocode, code snippets in markdown chat blocks, and documentation updates (e.g. `AGENTS.md`, `tasks.md`).
- **COMPATIBILITY INVARIANT:** Never suggest breaking changes to existing WebSocket protocols, database schemas, or REST endpoint contracts without providing explicit synchronized migration steps for both backend and frontend.
- **DOCUMENTATION INVARIANT:** Always update `AGENTS.md` when project architecture changes, and track active tasks in `tasks.md`.

---

## 2. PROJECT METADATA & REPOSITORY TARGETS

```yaml
project:
  name: Wisp
  type: Self-hosted, lightweight, real-time chat application (Discord alternative)
  status: Active development (non-production)
  upstream_vcs: Codeberg
  upstream_repo: "https://codeberg.org/klann/wisp"
  license: GPL-3.0
```

---

## 3. TECH STACK SPECIFICATION

### Backend
```yaml
runtime: Python >=3.12 (target >=3.14)
framework: FastAPI (async)
package_manager: uv
database: SQLite (chat.db) via SQLModel + aiosqlite (async SQLAlchemy session)
auth: PyJWT (HMAC-SHA256 bearer token), bcrypt (passwords)
realtime: WebSockets (FastAPI native WebSocket hub)
push_notifications: WebPush (py-webpush + VAPID ec_key / vapid_private.pem)
file_storage: Local filesystem (`backend/uploads/`), 1GB hard limit
core_dependencies:
  - fastapi[standard]
  - sqlmodel
  - aiosqlite
  - pyjwt
  - bcrypt
  - webpush
  - pillow
  - psutil
```

### Frontend
```yaml
runtime: Bun
framework: React 19
bundler: Vite
language: TypeScript (strict mode)
state_management: Zustand
styling: Tailwind CSS v4 (@tailwindcss/vite, tailwind-merge)
rich_text_markdown: Slate, slate-react, react-markdown, remark-gfm
ui_utilities: react-virtuoso (virtual scrolling), react-dropzone (file uploads), use-sound
```

---

## 4. SYSTEM ARCHITECTURE & DATA FLOW

### Directory Layout
```text
wisp/
├── backend/
│   ├── core/              # Security utilities, JWT encoding/decoding, VAPID config
│   ├── routes/
│   │   ├── auth.py        # Login, registration, token issuance
│   │   ├── channel.py     # Channel CRUD & permissions
│   │   ├── messages.py    # Message history & REST endpoints
│   │   ├── push.py        # WebPush subscription & notification dispatch
│   │   ├── server.py      # Server settings, member management, roles
│   │   ├── upload.py      # Multipart file uploads & media handling
│   │   └── ws.py          # WebSocket connection hub & real-time dispatch
│   ├── database.py        # Async engine & session factory (sqlite+aiosqlite)
│   ├── main.py            # Application lifespan, CORS middleware, router aggregation
│   ├── models.py          # SQLModel DB models & Pydantic schemas
│   ├── pyproject.toml     # Backend configuration & uv lock
│   └── uploads/           # Persisted binary upload payloads
├── frontend/
│   ├── src/
│   │   ├── components/    # Modular React UI components
│   │   ├── hooks/         # Custom React hooks (WS lifecycle, audio, auth)
│   │   ├── stores/        # Zustand global state stores
│   │   ├── types/         # TypeScript type definitions and WS payload schemas
│   │   ├── icons/         # UI iconography
│   │   ├── lib/           # Utility functions & API client helpers
│   │   ├── App.tsx        # Main application layout & view routing
│   │   └── AuthPage.tsx   # Login/Register view
│   ├── package.json       # Bun package manifest
│   └── vite.config.ts     # Vite + Tailwind v4 bundler config
├── AGENTS.md              # Machine-readable context & rules for AI assistants
├── tasks.md               # Active task backlog
└── README.md              # Human-facing project overview
```

### Authentication & Real-Time Flow
```text
[Client] --- (POST /api/auth/login) ---> [FastAPI /routes/auth.py]
         <--- (Bearer Token JWT) -------

[Client] --- (WS Connect: /ws?token=<JWT>) ---> [FastAPI /routes/ws.py]
         <===[ Authenticated Bidirectional Event Stream ]===>
```
- **Bearer Token:** Issued on login/register via `token_secret`; sent in `Authorization: Bearer <token>` header for REST and validated during WebSocket handshake.
- **VAPID / WebPush:** Keys generated at initial boot (`vapid_private.pem`, `vapid_public.pem`). Environment is injected with `VAPID_PUBLIC_KEY` and `VAPID_CLAIM_SUB`.
- **Role Enforcement:** Server-side validation on all administrative endpoints and channel mutations.

---

## 5. ENVIRONMENT & RUNTIME COMMANDS

### Environment Variables
```ini
# frontend/.env
VITE_BACKEND_URL="http://localhost:3001"
VITE_ALLOWED_HOSTS="127.0.0.1"

# backend/.env
token_secret="<openssl_generated_secret>"
backend_public_url="http://localhost:3001"
FRONTEND_CORS_ORIGINS="http://localhost:3000"
# Injected after initial boot:
VAPID_PUBLIC_KEY="<base64_vapid_public_key>"
VAPID_CLAIM_SUB="mailto:<admin_email>"
```

### CLI Command Reference
```bash
# Backend (from backend/)
uv sync                                # Sync dependencies
uv run fastapi dev --port 3001         # Start development server

# Frontend (from frontend/)
bun install                            # Install dependencies
bun run dev --port 3000                # Start Vite development server
bun run build                          # Typecheck (tsc -b) & build production bundle
bun run lint                           # Run ESLint (eslint .)
```

---

## 6. CODE CONVENTIONS & CONSTRAINTS

### Python / FastAPI
- **Signatures:** Strict Python 3.12+ type annotations on all parameters and returns.
- **Concurrency:** Fully asynchronous (`async def`) for all route handlers, DB queries, and WebSocket operations.
- **ORM / DB:** `sqlmodel.ext.asyncio.session.AsyncSession` via `Depends(get_session)`. Transactions must be committed or rolled back cleanly.
- **Error Responses:** Use `fastapi.HTTPException` with precise HTTP status codes (e.g. `401 Unauthorized`, `403 Forbidden`, `404 Not Found`).

### TypeScript / React
- **Types:** Strict TypeScript; zero `any` usage. Declare discrete interfaces for REST models, Zustand store state, and WebSocket events.
- **State:** Zustand stores under `src/stores/` for client-side state caching.
- **Styling:** Tailwind CSS v4 classes; utility merge via `tailwind-merge`.
- **DOM & Components:** Modular, functional components with custom hooks extracting non-visual logic.

### Git & Commits
- **Format:** Conventional Commits (`feat:`, `fix:`, `refactor:`, `docs:`, `chore:`, `perf:`).
- **Target:** Upstream repository is Codeberg (`klann/wisp`). Do not assume GitHub workflows.

---

## 7. BACKLOG POINTER
- Refer to `tasks.md` for current sprint items and work-in-progress features (e.g. PWA capabilities).