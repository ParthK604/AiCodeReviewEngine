from datetime import datetime
from typing import Literal
from uuid import UUID

from pydantic import BaseModel, ConfigDict


ReviewTemplate = Literal["security", "performance", "quality"]
ReviewSeverity = Literal["critical", "high", "medium", "low"]


class ReviewCreate(BaseModel):
    project_id: UUID
    file_ids: list[UUID]
    template: ReviewTemplate


class ReviewIssue(BaseModel):
    title: str
    description: str
    severity: ReviewSeverity
    file: str
    line: int | None = None


class ReviewResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    project_id: UUID
    user_id: UUID
    file_ids: list[UUID]
    template: ReviewTemplate
    summary: str
    issues: list[ReviewIssue]
    recommendations: list[str]
    created_at: datetime