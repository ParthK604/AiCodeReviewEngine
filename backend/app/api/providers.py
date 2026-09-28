from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user
from app.core.database import get_db
from app.models.user import User
from app.schemas.ai_provider import (
    AIProviderCreate,
    AIProviderResponse,
    AIProviderUpdate,
    ProviderTestRequest,
)
from app.services.ai_provider_service import (
    create_provider,
    delete_provider,
    get_user_providers,
    set_default,
    test_provider,
    update_provider,
)


router = APIRouter(prefix="/api/providers", tags=["providers"])
DbSession = Annotated[AsyncSession, Depends(get_db)]
CurrentUser = Annotated[User, Depends(get_current_user)]


@router.get("/", response_model=list[AIProviderResponse])
async def list_providers(db: DbSession, current_user: CurrentUser):
    return await get_user_providers(db, current_user.id)


@router.post("/", response_model=AIProviderResponse, status_code=status.HTTP_201_CREATED)
async def create(data: AIProviderCreate, db: DbSession, current_user: CurrentUser):
    return await create_provider(db, current_user.id, data)


@router.put("/{provider_id}", response_model=AIProviderResponse)
async def update(provider_id: UUID, data: AIProviderUpdate, db: DbSession, current_user: CurrentUser):
    return await update_provider(db, provider_id, current_user.id, data)


@router.delete("/{provider_id}")
async def remove(provider_id: UUID, db: DbSession, current_user: CurrentUser) -> dict[str, str]:
    await delete_provider(db, provider_id, current_user.id)
    return {"message": "deleted"}


@router.post("/{provider_id}/set-default", response_model=AIProviderResponse)
async def make_default(provider_id: UUID, db: DbSession, current_user: CurrentUser):
    return await set_default(db, provider_id, current_user.id)


@router.post("/test")
async def test(data: ProviderTestRequest) -> dict[str, bool | str]:
    success = await test_provider(data.base_url, data.api_key, data.model_name)
    return {
        "success": success,
        "message": "Connection successful" if success else "Connection failed",
    }