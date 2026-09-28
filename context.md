# AI Code Review Assistant — Project Context

## Assignment
Full Stack Engineering Internship Assessment
Company evaluating: Strix Engineering Studio
Deadline: 3 days

## Tech Stack
- Frontend: Next.js (TypeScript, Tailwind CSS, App Router)
- Backend: FastAPI (Python, uv + venv)
- Database: PostgreSQL via SQLAlchemy async + asyncpg
- Migrations: Alembic
- AI: OpenAI-compatible API (default: Groq)
- Auth: JWT (python-jose + bcrypt)
- File upload: ZIP only

## Project Structure
code-review-assistant/
├── backend/          FastAPI app
│   ├── .venv/        uv virtual environment
│   ├── app/
│   │   ├── api/      route handlers (thin)
│   │   ├── core/     config, database, security
│   │   ├── models/   SQLAlchemy ORM models
│   │   ├── schemas/  Pydantic request/response schemas
│   │   └── services/ business logic
│   ├── alembic/      migrations
│   ├── .env
│   └── pyproject.toml
└── frontend/         Next.js app
    ├── app/          App Router pages
    ├── components/
    ├── lib/          api.ts, auth.ts
    ├── types/
    └── .env.local

## Key Rules
- API routes in app/api/ — keep thin, call services
- Business logic in app/services/ only
- SQLAlchemy async throughout — no sync queries
- AI provider NOT hardcoded — read from ai_providers table per user
- JWT stored in httpOnly cookie on frontend
- UUID primary keys on all tables
- All routes protected except /auth/register and /auth/login

## AI Provider Pattern
```python
from openai import OpenAI
client = OpenAI(
    base_url=provider.base_url,
    api_key=provider.api_key
)
```

## Default Providers
- Groq: https://api.groq.com/openai/v1 | llama3-70b-8192
- OpenAI: https://api.openai.com/v1 | gpt-4o-mini
- LM Studio: http://localhost:1234/v1 | local-model

## Review Output Schema
```json
{
  "summary": "string",
  "issues": [
    {
      "title": "string",
      "description": "string", 
      "severity": "critical|high|medium|low",
      "file": "string",
      "line": "number or null"
    }
  ],
  "recommendations": ["string"]
}
```

## Review Templates
- security: hardcoded creds, auth issues, input validation, injection
- performance: slow ops, inefficient rendering, unnecessary queries
- quality: naming, structure, readability, maintainability

## Database Tables
users, projects, files, reviews, ai_providers,
chat_sessions, messages

## Environment Variables
Backend .env:
  DATABASE_URL=postgresql+asyncpg://...
  SECRET_KEY=
  ALGORITHM=HS256
  ACCESS_TOKEN_EXPIRE_MINUTES=1440

Frontend .env.local:
  NEXT_PUBLIC_API_URL=http://localhost:8000