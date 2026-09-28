from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict


class AIProviderCreate(BaseModel):
    name: str
    base_url: str
    api_key: str
    model_name: str
    is_default: bool = False


class AIProviderUpdate(BaseModel):
    name: str | None = None
    base_url: str | None = None
    api_key: str | None = None
    model_name: str | None = None
    is_default: bool | None = None


class AIProviderResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    name: str
    base_url: str
    model_name: str
    is_default: bool
    created_at: datetime


class ProviderTestRequest(BaseModel):
    base_url: str
    api_key: str
    model_name: str