# Deployment Checklist

## Backend on Railway

- Create a Railway account.
- Create a new project and deploy from GitHub.
- Select the `backend` folder as the service root.
- Configure the start command with Uvicorn, for example:
  `uv run uvicorn app.main:app --host 0.0.0.0 --port $PORT`
- Add environment variables:
  - `DATABASE_URL` — Neon/PostgreSQL connection string
  - `SECRET_KEY`
  - `ALGORITHM=HS256`
  - `ACCESS_TOKEN_EXPIRE_MINUTES=1440`
  - `GROQ_BASE_URL`
  - `GROQ_API_KEY`
  - `GROQ_MODEL`
- Note the generated Railway URL.

## Frontend on Vercel

- Create a new Vercel account as required by the assessment.
- Import the repository from GitHub.
- Set the project root to `frontend`.
- Add `NEXT_PUBLIC_API_URL=https://your-railway-url`.
- Deploy the Next.js application.

## After Deployment

```bash
cd backend
uv run python app/seed.py
```

Test the full live flow:

```text
Register → create project → upload ZIP → view files
→ run review → chat with code → review history
```

Confirm both seeded test credentials work, then replace or remove seeded credentials before sharing the deployment.

## Operational Checks

- Confirm Railway allows the Vercel origin in FastAPI CORS settings.
- Confirm the production database uses SSL as required by the provider.
- Confirm AI keys are stored only in environment variables or provider settings, never in source control.
- Check `/docs`, `/`, login, project upload, review, chat, and history on the live URL.