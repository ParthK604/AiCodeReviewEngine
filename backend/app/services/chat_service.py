from uuid import UUID

from fastapi import HTTPException, status
from openai import AsyncOpenAI
from sqlalchemy import or_, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.chat import ChatSession, Message
from app.models.file import File
from app.models.project import Project
from app.schemas.chat import ChatSessionCreate, MessageResponse
from app.services.ai_provider_service import get_default_provider


SYSTEM_PROMPT = """You are a code assistant with access to the following codebase.
Answer questions about the code accurately.
Reference specific files and line numbers when relevant.
If you are unsure, say so.

Codebase:
{context}"""


def _session_not_found() -> HTTPException:
    return HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Chat session not found")


async def create_session(db: AsyncSession, user_id: UUID, project_id: UUID) -> ChatSession:
    project_exists = await db.scalar(
        select(Project.id).where(Project.id == project_id, Project.user_id == user_id)
    )
    if project_exists is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Project not found")
    session = ChatSession(user_id=user_id, project_id=project_id)
    db.add(session)
    await db.commit()
    await db.refresh(session)
    return await get_session(db, session.id, user_id)


async def get_session(db: AsyncSession, session_id: UUID, user_id: UUID) -> ChatSession:
    session = await db.scalar(
        select(ChatSession)
        .options(selectinload(ChatSession.messages))
        .where(ChatSession.id == session_id, ChatSession.user_id == user_id)
    )
    if session is None:
        raise _session_not_found()
    return session


async def get_project_sessions(db: AsyncSession, project_id: UUID, user_id: UUID) -> list[ChatSession]:
    result = await db.scalars(
        select(ChatSession)
        .options(selectinload(ChatSession.messages))
        .where(ChatSession.project_id == project_id, ChatSession.user_id == user_id)
        .order_by(ChatSession.created_at.desc())
    )
    return list(result)


async def get_relevant_files(db: AsyncSession, project_id: UUID, query: str) -> list[File]:
    words = {word.lower() for word in query.split() if len(word) > 2}
    if words:
        matches = await db.scalars(
            select(File)
            .where(
                File.project_id == project_id,
                or_(*(File.content.ilike(f"%{word}%") for word in words)),
            )
            .order_by(File.size.asc())
            .limit(5)
        )
        relevant = list(matches)
        if relevant:
            return relevant
    fallback = await db.scalars(
        select(File).where(File.project_id == project_id).order_by(File.size.asc()).limit(5)
    )
    return list(fallback)


def build_chat_context(files: list[File]) -> str:
    sections: list[str] = []
    for file in files:
        content = file.content[:2000]
        note = "\n[Note: file truncated at 2000 characters.]" if len(file.content) > 2000 else ""
        sections.append(f"=== {file.path} ===\n{content}{note}")
    return "\n\n".join(sections)


async def send_message(
    db: AsyncSession,
    session_id: UUID,
    user_id: UUID,
    content: str,
) -> MessageResponse:
    session = await get_session(db, session_id, user_id)
    history = session.messages[-10:]
    files = await get_relevant_files(db, session.project_id, content)
    provider = await get_default_provider(db, user_id)
    client = AsyncOpenAI(base_url=provider.base_url, api_key=provider.api_key)
    messages = [
        {"role": "system", "content": SYSTEM_PROMPT.format(context=build_chat_context(files))},
        *[{"role": message.role, "content": message.content} for message in history],
        {"role": "user", "content": content},
    ]
    try:
        response = await client.chat.completions.create(
            model=provider.model_name,
            messages=messages,
            temperature=0.7,
            max_tokens=2000,
        )
    except Exception as error:
        raise HTTPException(status_code=status.HTTP_502_BAD_GATEWAY, detail="AI provider request failed") from error
    finally:
        await client.close()

    assistant_content = response.choices[0].message.content or "I could not generate a response."
    user_message = Message(session_id=session.id, role="user", content=content)
    assistant_message = Message(session_id=session.id, role="assistant", content=assistant_content)
    db.add_all([user_message, assistant_message])
    await db.commit()
    await db.refresh(assistant_message)
    return MessageResponse.model_validate(assistant_message)