from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user
from app.core.database import get_db
from app.models.user import User
from app.schemas.project import ProjectCreate, ProjectResponse
from app.services.project_service import (
    create_project,
    delete_project,
    get_project,
    get_user_projects,
)


router = APIRouter(prefix="/api/projects", tags=["projects"])
DbSession = Annotated[AsyncSession, Depends(get_db)]
CurrentUser = Annotated[User, Depends(get_current_user)]


@router.post("/", response_model=ProjectResponse, status_code=status.HTTP_201_CREATED)
async def create(data: ProjectCreate, db: DbSession, current_user: CurrentUser) -> ProjectResponse:
    return await create_project(db, current_user.id, data)  # type: ignore[return-value]


@router.get("/", response_model=list[ProjectResponse])
async def list_projects(db: DbSession, current_user: CurrentUser) -> list[ProjectResponse]:
    return await get_user_projects(db, current_user.id)  # type: ignore[return-value]


@router.get("/{project_id}", response_model=ProjectResponse)
async def get(project_id: UUID, db: DbSession, current_user: CurrentUser) -> ProjectResponse:
    return await get_project(db, project_id, current_user.id)  # type: ignore[return-value]


@router.delete("/{project_id}")
async def remove(project_id: UUID, db: DbSession, current_user: CurrentUser) -> dict[str, str]:
    await delete_project(db, project_id, current_user.id)
    return {"message": "deleted"}