from datetime import datetime
from typing import Literal
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field


class FileResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    name: str
    path: str
    language: str
    size: int
    created_at: datetime


class FileTreeNode(BaseModel):
    name: str
    path: str
    type: Literal["file", "folder"]
    children: list["FileTreeNode"] | None = None
    language: str | None = None
    file_id: UUID | None = None


class FileContentResponse(FileResponse):
    content: str