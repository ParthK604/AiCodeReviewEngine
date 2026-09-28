import logging

from fastapi import FastAPI
from fastapi import Request
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

import app.models
from app.api.auth import router as auth_router
from app.api.chat import router as chat_router
from app.api.files import router as files_router
from app.api.projects import router as projects_router
from app.api.providers import router as providers_router
from app.api.reviews import router as reviews_router
from app.core.database import Base, engine


app = FastAPI(title="CodeReview AI")
logger = logging.getLogger(__name__)


@app.exception_handler(RequestValidationError)
async def handle_validation_error(_: Request, exception: RequestValidationError) -> JSONResponse:
	detail = "; ".join(" ".join(str(item) for item in error.get("loc", ())) + ": " + error.get("msg", "Invalid request") for error in exception.errors())
	return JSONResponse(status_code=422, content={"detail": detail or "Invalid request"})


@app.exception_handler(Exception)
async def handle_unexpected_error(_: Request, exception: Exception) -> JSONResponse:
	logger.exception("Unhandled application error", exc_info=exception)
	return JSONResponse(status_code=500, content={"detail": "Internal server error"})


@app.on_event("startup")
async def create_tables() -> None:
	async with engine.begin() as connection:
		await connection.run_sync(Base.metadata.create_all)


app.add_middleware(
	CORSMiddleware,
	allow_origins=["http://localhost:3000"],
	allow_credentials=True,
	allow_methods=["*"],
	allow_headers=["*"],
)

app.include_router(auth_router)
app.include_router(chat_router)
app.include_router(projects_router)
app.include_router(files_router)
app.include_router(providers_router)
app.include_router(reviews_router)


@app.get("/")
async def root() -> dict[str, str]:
	return {"status": "ok", "message": "CodeReview AI"}
