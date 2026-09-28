from uuid import UUID

from fastapi import HTTPException, status
from sqlalchemy import delete, func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.file import File
from app.models.project import Project
from app.schemas.project import ProjectCreate


def _not_found() -> HTTPException:
    return HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Project not found")


async def _set_file_count(db: AsyncSession, project: Project) -> Project:
    project.file_count = int(
        await db.scalar(select(func.count(File.id)).where(File.project_id == project.id)) or 0
    )
    return project


async def create_project(db: AsyncSession, user_id: UUID, data: ProjectCreate) -> Project:
    project = Project(user_id=user_id, name=data.name, description=data.description)
    db.add(project)
    await db.commit()
    await db.refresh(project)
    return await _set_file_count(db, project)


async def get_user_projects(db: AsyncSession, user_id: UUID) -> list[Project]:
    rows = await db.execute(
        select(Project, func.count(File.id).label("file_count"))
        .outerjoin(File, File.project_id == Project.id)
        .where(Project.user_id == user_id)
        .group_by(Project.id)
        .order_by(Project.created_at.desc())
    )
    projects: list[Project] = []
    for project, file_count in rows.all():
        project.file_count = int(file_count)
        projects.append(project)
    return projects


async def get_project(db: AsyncSession, project_id: UUID, user_id: UUID) -> Project:
    project = await db.scalar(
        select(Project).where(Project.id == project_id, Project.user_id == user_id)
    )
    if project is None:
        raise _not_found()
    return await _set_file_count(db, project)


async def delete_project(db: AsyncSession, project_id: UUID, user_id: UUID) -> None:
    project = await get_project(db, project_id, user_id)
    await db.execute(delete(File).where(File.project_id == project.id))
    await db.delete(project)
    await db.commit()