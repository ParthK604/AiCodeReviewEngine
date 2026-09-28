# AI Code Review Assistant

AI Code Review Assistant is a full-stack workspace for understanding and reviewing uploaded codebases. Users create projects, upload ZIP archives, browse a safe file tree, and inspect source files in the browser.

The app also connects to OpenAI-compatible providers such as Groq, OpenAI, or a local LM Studio server. It supports security, performance, and quality reviews, a code-aware chat assistant, and searchable review history.

## Features

- ✅ JWT authentication with bcrypt password hashing
- ✅ Project creation and ownership isolation
- ✅ Safe ZIP upload with binary, generated-directory, and size filtering
- ✅ Recursive file tree and code viewer
- ✅ Configurable AI providers with connection testing
- ✅ Security, performance, and quality review templates
- ✅ Code-aware chat with relevant-file context
- ✅ Review history, search, filters, and re-run support
- ✅ Responsive dark interface with loading and empty states

## Tech Stack

| Layer | Technology |
| --- | --- |
| Frontend | Next.js, TypeScript, React |
| Backend | FastAPI, Python |
| Database | PostgreSQL, SQLAlchemy async, asyncpg |
| Migrations | Alembic |
| AI | OpenAI-compatible APIs, default Groq |
| Authentication | JWT, bcrypt |

## Architecture

```text
Browser
	│ Axios + JWT bearer token
	▼
Next.js App Router ──► FastAPI API routers
														│
														▼
										 Service layer
											 │        │
											 ▼        ▼
								 PostgreSQL   AI provider
								 via asyncpg  OpenAI-compatible API
```

## Setup

### Prerequisites

- Python 3.13+
- Node.js 22+
- PostgreSQL or a hosted PostgreSQL connection
- An OpenAI-compatible provider key for live reviews and chat

### Clone

```bash
git clone <repository-url>
cd strix
```

### Backend

```bash
cd backend
uv venv
uv pip install -r requirements.txt
uv run uvicorn app.main:app --reload --port 8000
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

The frontend runs at `http://localhost:3000` and the API at `http://localhost:8000`.

### Environment Variables

| Variable | Description | Example |
| --- | --- | --- |
| `DATABASE_URL` | PostgreSQL connection string | `postgresql+asyncpg://...` |
| `SECRET_KEY` | JWT signing secret | long random string |
| `ALGORITHM` | JWT algorithm | `HS256` |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | Token lifetime | `1440` |
| `GROQ_BASE_URL` | Built-in provider URL | `https://api.groq.com/openai/v1` |
| `GROQ_API_KEY` | Optional fallback Groq key | secret |
| `GROQ_MODEL` | Fallback model | `llama3-70b-8192` |
| `NEXT_PUBLIC_API_URL` | Frontend API origin | `http://localhost:8000` |

### Seed Test Data

```bash
cd backend
uv run python app/seed.py
```

## Test Credentials

| User | Email | Password |
| --- | --- | --- |
| Admin | `admin@codereview.ai` | `Admin1234!` |
| Test user | `test@codereview.ai` | `Test1234!` |

Change these credentials before using seeded data in a shared environment.

## API Documentation

FastAPI's interactive documentation is available at `http://localhost:8000/docs`.

| Method | Endpoint | Purpose |
| --- | --- | --- |
| POST | `/api/auth/register` | Register a user |
| POST | `/api/auth/login` | Obtain a JWT |
| GET | `/api/auth/me` | Get the current user |
| GET/POST | `/api/projects/` | List or create projects |
| POST | `/api/projects/{id}/files/upload` | Upload a ZIP |
| GET | `/api/projects/{id}/files/` | Get the file tree |
| GET/POST | `/api/providers/` | Manage AI providers |
| POST | `/api/reviews/` | Run an AI review |
| GET | `/api/reviews/search` | Search review history |
| POST | `/api/chat/sessions` | Create a code chat session |
| POST | `/api/chat/sessions/{id}/messages` | Ask about code |

## Deployment Notes

Deploy the backend with the files under `backend/` and provide a managed PostgreSQL URL. Deploy the Next.js app with the files under `frontend/` and set `NEXT_PUBLIC_API_URL` to the public backend URL. Run the seed script only against a database where the sample credentials are acceptable.

See [DEPLOY.md](DEPLOY.md) for the Railway and Vercel checklist and [ARCHITECTURE.md](ARCHITECTURE.md) for detailed design decisions.
