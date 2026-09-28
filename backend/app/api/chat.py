from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user
from app.core.database import get_db
from app.models.user import User
from app.schemas.chat import ChatSessionCreate, ChatSessionResponse, MessageCreate, MessageResponse
from app.services.chat_service import create_session, get_project_sessions, get_session, send_message


router = APIRouter(prefix="/api/chat", tags=["chat"])
DbSession = Annotated[AsyncSession, Depends(get_db)]
CurrentUser = Annotated[User, Depends(get_current_user)]


@router.post("/sessions", response_model=ChatSessionResponse)
async def create_chat_session(data: ChatSessionCreate, db: DbSession, current_user: CurrentUser):
    return await create_session(db, current_user.id, data.project_id)


@router.get("/sessions", response_model=list[ChatSessionResponse])
async def list_chat_sessions(
    db: DbSession,
    current_user: CurrentUser,
    project_id: UUID = Query(...),
):
    return await get_project_sessions(db, project_id, current_user.id)


@router.get("/sessions/{session_id}", response_model=ChatSessionResponse)
async def get_chat_session(session_id: UUID, db: DbSession, current_user: CurrentUser):
    return await get_session(db, session_id, current_user.id)


@router.post("/sessions/{session_id}/messages", response_model=MessageResponse)
async def post_message(
    session_id: UUID,
    data: MessageCreate,
    db: DbSession,
    current_user: CurrentUser,
):
    return await send_message(db, session_id, current_user.id, data.content)