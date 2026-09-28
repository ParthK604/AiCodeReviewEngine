from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict


class ChatSessionCreate(BaseModel):
    project_id: UUID


class MessageCreate(BaseModel):
    content: str


class MessageResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    session_id: UUID
    role: str
    content: str
    created_at: datetime


class ChatSessionResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    project_id: UUID
    created_at: datetime
    messages: list[MessageResponse]