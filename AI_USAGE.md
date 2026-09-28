# AI Usage Log

This file is maintained from `ai_chat_log.md`. A new session entry is added after every completed phase.

## Phase 7 — Review + Chat Reliability
Date: 2026-09-28
Tool: GitHub Copilot

Prompt:
- Review why the project review and code chat workflows were failing.

Generated:
- Fixed the missing Next.js `Link` import that caused the review page runtime error.
- Aligned default AI settings with the workspace environment variable names.
- Made stale empty seeded Groq providers use the configured default provider.

Changes I made:
- Validated editor diagnostics, backend compilation, and environment setting resolution.

Wrote myself:
- No application code was written manually outside the AI-assisted implementation.

## Tools Used

- Claude (claude.ai) — planning/context reference as recorded in the project chat log.
- GitHub Copilot — implementation, debugging, validation, and documentation across Phases 1–6.

## Phase 1 — Foundation
Date: 2026-09-27
Tool: GitHub Copilot

Prompt:
- Build the FastAPI foundation with async SQLAlchemy, PostgreSQL UUID models, Alembic, CORS, and the health endpoint.

Generated:
- Settings and async database engine in `backend/app/core/`
- Models for users, projects, files, reviews, AI providers, chat sessions, and messages
- Model registry and FastAPI startup table creation
- `backend/alembic.ini` and `backend/alembic/env.py`

Changes I made:
- Normalized standard PostgreSQL URLs to the asyncpg dialect.
- Validated Python compilation and editor diagnostics.

Wrote myself:
- No application code was written manually outside the AI-assisted implementation.

## Phase 6 — Polish, Documentation + Deploy
Date: 2026-09-27
Tool: GitHub Copilot

Prompt:
- Add global error handling, toast notifications, loading/empty states, mobile responsive polish, validation, a 404 page, backend error consistency, seed data, README, architecture documentation, and deployment instructions.

Generated:
- Centralized Axios error extraction and success/error toast integration
- Toast provider, skeleton components, mobile sidebar behavior, and dark 404 page
- Generic FastAPI exception handler and idempotent async seed script
- README, ARCHITECTURE.md, and DEPLOY.md

Changes I made:
- Added `react-hot-toast` and retained the existing safe Markdown fallback for chat content.
- Added seeded admin/test users, two sample projects, realistic files, a review, chat messages, and a Groq provider.
- Added responsive behavior for dashboard cards, project files, review panels, and mobile chat.

Wrote myself:
- No application code was written manually outside the AI-assisted implementation.

## Engineering Decisions Made Without AI

- [Fill in project-specific decisions made independently.]

## Code Written Without AI Assistance

- [Fill in any manually written code.]

## What I Learned From This Process

- [Fill in lessons learned.]

## Phase 5 — Chat With Code + Review History
Date: 2026-09-27
Tool: GitHub Copilot

Prompt:
- Add protected code chat sessions, provider-backed assistant responses, review history search, project navigation tabs, chat UI, review history cards, and review detail/re-run pages.

Generated:
- Chat schemas, relationships, async service, context search, provider call, and chat API routes
- Review history search endpoint
- Chat session API helpers and project layout navigation
- Chat window, message bubbles, suggestion prompts, session sidebar, and loading states
- Review history search/filter page and individual review detail page with re-run action

Changes I made:
- Added eager loading for chat messages so newly created sessions serialize safely.
- Added escaped basic Markdown rendering for assistant messages.
- Attempted to install `react-markdown`, but the current npm environment did not update the dependency manifest, so no unresolved import was introduced.
- Validated backend imports/diagnostics, frontend diagnostics, and the Next build command.

Wrote myself:
- No application code was written manually outside the AI-assisted implementation.

## Phase 2 — Authentication
Date: 2026-09-27
Tool: GitHub Copilot

Prompt:
- Add bcrypt password hashing, JWT authentication, protected FastAPI auth routes, and the frontend login/register flow.

Generated:
- User Pydantic schemas
- Password and JWT helpers
- Async authentication service and Bearer-token dependency
- Register, login, and current-user endpoints
- Frontend Axios client, token helpers, middleware, auth pages, layout, and navbar

Changes I made:
- Added `email-validator` to the backend requirements and installed it in the virtual environment after the `EmailStr` import error.
- Added a same-site token cookie mirror so Next middleware can protect routes while API calls continue using localStorage.

Wrote myself:
- No application code was written manually outside the AI-assisted implementation.

## Phase 3 — Projects + ZIP Upload
Date: 2026-09-27
Tool: GitHub Copilot

Prompt:
- Add project CRUD, safe ZIP extraction, file storage, file tree/content APIs, dashboard, project workspace, upload flow, and code viewer.

Generated:
- Project and file schemas, services, and protected API routers
- ZIP filtering for binary files, generated directories, oversized files, and unsafe paths
- Recursive folder-first file tree
- Dashboard, create-project modal, file tree, upload workspace, and code viewer
- `highlight.js` integration

Changes I made:
- Isolated the Vite starter's PostCSS configuration from the Next app.
- Replaced unavailable Tailwind/PostCSS directives with stable global CSS after the frontend dependency conflict.
- Fixed schema export duplication and recursive file-tree typing issues found during validation.

Wrote myself:
- No application code was written manually outside the AI-assisted implementation.

## Phase 4 — AI Provider Config + Review Engine
Date: 2026-09-27
Tool: GitHub Copilot

Prompt:
- Add AI provider management, OpenAI-compatible connection testing, security/performance/quality review generation, review APIs, provider settings, and the project review workspace.

Generated:
- Provider and review schemas
- Provider CRUD/default/test service and protected provider routes
- Review prompts, code context builder, JSON parser, OpenAI-compatible review service, and review routes
- Typed frontend provider/review API helpers
- Provider settings page
- Review file selector, template cards, run state, result card, severity filters, recommendations, and project Review tab

Changes I made:
- Added optional Groq fallback settings from environment variables.
- Ensured API provider responses never include `api_key`.
- Added owner checks for providers, reviews, projects, and selected files.
- Installed `highlight.js` and validated strict TypeScript, backend compilation, and the Next production build.

Wrote myself:
- No application code was written manually outside the AI-assisted implementation.
