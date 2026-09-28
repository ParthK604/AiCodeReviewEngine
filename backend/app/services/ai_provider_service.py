from uuid import UUID, uuid4

from fastapi import HTTPException, status
from openai import AsyncOpenAI
from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.models.ai_provider import AIProvider
from app.schemas.ai_provider import AIProviderCreate, AIProviderUpdate


def _provider_not_found() -> HTTPException:
    return HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="AI provider not found")


async def _unset_defaults(db: AsyncSession, user_id: UUID) -> None:
    await db.execute(
        update(AIProvider)
        .where(AIProvider.user_id == user_id)
        .values(is_default=False)
    )


async def create_provider(db: AsyncSession, user_id: UUID, data: AIProviderCreate) -> AIProvider:
    if data.is_default:
        await _unset_defaults(db, user_id)
    provider = AIProvider(user_id=user_id, **data.model_dump())
    db.add(provider)
    await db.commit()
    await db.refresh(provider)
    return provider


async def get_user_providers(db: AsyncSession, user_id: UUID) -> list[AIProvider]:
    result = await db.scalars(
        select(AIProvider)
        .where(AIProvider.user_id == user_id)
        .order_by(AIProvider.is_default.desc(), AIProvider.created_at.desc())
    )
    return list(result)


async def get_default_provider(db: AsyncSession, user_id: UUID) -> AIProvider:
    provider = await db.scalar(
        select(AIProvider).where(AIProvider.user_id == user_id, AIProvider.is_default.is_(True))
    )
    if provider is not None and provider.api_key:
        return provider
    if provider is not None and provider.base_url != settings.groq_base_url:
        return provider
    return AIProvider(
        id=provider.id if provider is not None else uuid4(),
        user_id=user_id,
        name="Groq",
        base_url=settings.groq_base_url,
        api_key=settings.groq_api_key,
        model_name=settings.groq_model,
        is_default=True,
    )


async def update_provider(
    db: AsyncSession,
    provider_id: UUID,
    user_id: UUID,
    data: AIProviderUpdate,
) -> AIProvider:
    provider = await db.scalar(
        select(AIProvider).where(AIProvider.id == provider_id, AIProvider.user_id == user_id)
    )
    if provider is None:
        raise _provider_not_found()
    changes = data.model_dump(exclude_unset=True)
    if changes.get("is_default") is True:
        await _unset_defaults(db, user_id)
    for field, value in changes.items():
        setattr(provider, field, value)
    await db.commit()
    await db.refresh(provider)
    return provider


async def delete_provider(db: AsyncSession, provider_id: UUID, user_id: UUID) -> None:
    provider = await db.scalar(
        select(AIProvider).where(AIProvider.id == provider_id, AIProvider.user_id == user_id)
    )
    if provider is None:
        raise _provider_not_found()
    await db.delete(provider)
    await db.commit()


async def set_default(db: AsyncSession, provider_id: UUID, user_id: UUID) -> AIProvider:
    provider = await db.scalar(
        select(AIProvider).where(AIProvider.id == provider_id, AIProvider.user_id == user_id)
    )
    if provider is None:
        raise _provider_not_found()
    await _unset_defaults(db, user_id)
    provider.is_default = True
    await db.commit()
    await db.refresh(provider)
    return provider


async def test_provider(base_url: str, api_key: str, model_name: str) -> bool:
    client = AsyncOpenAI(base_url=base_url, api_key=api_key)
    try:
        await client.chat.completions.create(
            model=model_name,
            messages=[{"role": "user", "content": "Say hello"}],
            max_tokens=8,
            temperature=0,
        )
        return True
    except Exception:
        return False
    finally:
        await client.close()