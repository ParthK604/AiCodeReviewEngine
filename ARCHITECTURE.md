# Architecture

## Frontend Architecture

The frontend uses Next.js App Router. Route groups and dynamic segments organize authentication, dashboard, project files, reviews, chat, and provider settings:

```text
app/
├── (auth)/login, register
├── dashboard/
├── settings/
└── projects/[id]/
    ├── layout.tsx       project tabs
    ├── page.tsx         files and code viewer
    ├── review/          review runner
    ├── reviews/         history and detail
    └── chat/            code assistant
```

Components own local interaction state. `frontend/lib/api.ts` is the typed HTTP boundary, and the Axios interceptor attaches the JWT and redirects unauthenticated users. The app uses local state plus API refetching instead of a global state library because each workflow has a narrow ownership boundary.

### Auth Flow

```text
Login form → POST /api/auth/login → JWT
			       ├─ localStorage for API requests
			       └─ same-site cookie for route middleware
Protected page → Axios Bearer token → FastAPI dependency → current User
```

## Backend Architecture

FastAPI routers validate HTTP concerns and delegate to services. Services own database queries, ownership checks, ZIP extraction, provider calls, review parsing, and chat context assembly. This keeps routes thin and makes business behavior testable without coupling it to request objects.

All database access is asynchronous. `asyncpg` avoids blocking the event loop for PostgreSQL I/O, while SQLAlchemy's async session provides typed ORM access and transaction boundaries.

## Database Design

```text
users
 ├── projects ── files
 ├── reviews ── file_ids[]
 ├── ai_providers
 └── chat_sessions ── messages
```

All tables use UUID primary keys. Projects, files, reviews, providers, and chat sessions are scoped to a user. Files additionally reference their project; messages reference chat sessions. PostgreSQL is a good fit because the data has clear relational ownership, foreign keys, timestamps, JSONB review payloads, and UUID/array support. MongoDB would make ownership joins and consistency rules less explicit for this workload.

Important indexes include unique/indexed user email, foreign-key lookup paths, project ownership, file project ownership, and review user/project filtering. PostgreSQL JSONB is used for the variable review issue payload while the review's stable identity fields remain relational.

## AI Integration Flow

```text
User selects files/template
	↓
Review service loads owned files
	↓
Build bounded code context
	↓
Call selected OpenAI-compatible provider
	↓
Parse constrained JSON response
	↓
Persist review and return typed response
```

Providers are configurable per user so credentials and model choices are not hardcoded into review logic. Groq is the default fallback because it offers a compatible API and a practical low-latency model for development. Templates are explicit security, performance, and quality prompts so the user can select a review intent and the result remains structured.

Chat uses simple case-insensitive keyword search to select up to five relevant files. This is intentionally transparent and dependency-light for the first version. Vector search would improve semantic recall on large repositories but would add embedding generation, an index, storage, and operational cost; it is a good later optimization rather than a prerequisite for the core workflow.

## Key Engineering Decisions

- **FastAPI over NestJS:** Python aligns naturally with the AI and code-analysis ecosystem, while FastAPI supplies typed request validation and async support with little ceremony.
- **PostgreSQL over MongoDB:** The application has strong ownership relationships and transactional writes across users, projects, files, reviews, and chat sessions.
- **Groq as default provider:** It is OpenAI-compatible, fast for interactive review/chat flows, and can be overridden per user.
- **Service layer over fat routes:** Business rules stay reusable and independently testable instead of being hidden in HTTP handlers.
