from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Depends, File as UploadFileField, HTTPException, UploadFile, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user
from app.core.database import get_db
from app.models.file import File as ProjectFile
from app.models.user import User
from app.schemas.file import FileContentResponse, FileTreeNode
from app.services.file_service import build_file_tree, extract_zip, store_files
from app.services.project_service import get_project


router = APIRouter(prefix="/api/projects/{project_id}/files", tags=["files"])
DbSession = Annotated[AsyncSession, Depends(get_db)]
CurrentUser = Annotated[User, Depends(get_current_user)]


@router.post("/upload")
async def upload_zip(
    project_id: UUID,
    db: DbSession,
    current_user: CurrentUser,
    zip_file: Annotated[UploadFile, UploadFileField(...)],
) -> dict[str, int | str]:
    await get_project(db, project_id, current_user.id)
    if not zip_file.filename or not zip_file.filename.lower().endswith(".zip"):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Only ZIP files are accepted")
    extracted_files = extract_zip(await zip_file.read())
    stored_files = await store_files(db, project_id, current_user.id, extracted_files)
    return {"message": "uploaded", "file_count": len(stored_files)}


@router.get("/", response_model=list[FileTreeNode])
async def list_files(
    project_id: UUID,
    db: DbSession,
    current_user: CurrentUser,
) -> list[FileTreeNode]:
    await get_project(db, project_id, current_user.id)
    result = await db.scalars(
        select(ProjectFile)
        .where(ProjectFile.project_id == project_id, ProjectFile.user_id == current_user.id)
        .order_by(ProjectFile.path)
    )
    return build_file_tree(list(result))


@router.get("/{file_id}", response_model=FileContentResponse)
async def get_file_content(
    project_id: UUID,
    file_id: UUID,
    db: DbSession,
    current_user: CurrentUser,
) -> ProjectFile:
    await get_project(db, project_id, current_user.id)
    project_file = await db.scalar(
        select(ProjectFile).where(
            ProjectFile.id == file_id,
            ProjectFile.project_id == project_id,
            ProjectFile.user_id == current_user.id,
        )
    )
    if project_file is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="File not found")
    return project_file