import json
from typing import Any
from uuid import UUID

from fastapi import HTTPException, status
from openai import AsyncOpenAI
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.file import File
from app.models.review import Review
from app.schemas.review import ReviewCreate
from app.services.ai_provider_service import get_default_provider


SECURITY_PROMPT = """You are a security code reviewer.
Analyze the provided code for:
- Hardcoded credentials, API keys, passwords
- Authentication and authorization flaws
- Input validation and sanitization gaps
- SQL/NoSQL injection risks
- Exposed sensitive data

Return ONLY valid JSON matching this schema exactly:
{
  "summary": "string",
  "issues": [{"title": "string", "description": "string", "severity": "critical|high|medium|low", "file": "filename", "line": null}],
  "recommendations": ["string"]
}"""

PERFORMANCE_PROMPT = """You are a performance code reviewer.
Analyze for: slow algorithms, inefficient loops, unnecessary database queries, memory leaks, blocking operations, unoptimized rendering.
Return ONLY valid JSON matching this schema exactly:
{"summary": "string", "issues": [{"title": "string", "description": "string", "severity": "critical|high|medium|low", "file": "filename", "line": null}], "recommendations": ["string"]}"""

QUALITY_PROMPT = """You are a code quality reviewer.
Analyze for: poor naming, code duplication, missing error handling, lack of documentation, overly complex functions, poor structure.
Return ONLY valid JSON matching this schema exactly:
{"summary": "string", "issues": [{"title": "string", "description": "string", "severity": "critical|high|medium|low", "file": "filename", "line": null}], "recommendations": ["string"]}"""

PROMPTS = {
    "security": SECURITY_PROMPT,
    "performance": PERFORMANCE_PROMPT,
    "quality": QUALITY_PROMPT,
}


def get_prompt(template: str) -> str:
    try:
        return PROMPTS[template]
    except KeyError as error:
        raise ValueError(f"Unknown review template: {template}") from error


def build_code_context(files: list[File]) -> str:
    sections: list[str] = []
    for file in files:
        content = file.content
        truncated = len(content) > 3000
        if truncated:
            content = content[:3000]
        note = "\n[Note: file truncated at 3000 characters.]" if truncated else ""
        sections.append(f"=== {file.path} ===\n{content}{note}")
    return "\n\n".join(sections)


def parse_review_response(raw: str) -> dict[str, Any]:
    try:
        parsed = json.loads(raw)
    except json.JSONDecodeError:
        start = raw.find("{")
        end = raw.rfind("}")
        if start < 0 or end <= start:
            raise ValueError("AI response did not contain valid JSON")
        try:
            parsed = json.loads(raw[start : end + 1])
        except json.JSONDecodeError as error:
            raise ValueError("AI response did not contain valid JSON") from error
    if not isinstance(parsed, dict):
        raise ValueError("AI response must be a JSON object")
    return parsed


async def create_review(db: AsyncSession, user_id: UUID, review_create: ReviewCreate) -> Review:
    files = list(
        await db.scalars(
            select(File).where(
                File.id.in_(review_create.file_ids),
                File.project_id == review_create.project_id,
                File.user_id == user_id,
            )
        )
    )
    if len(files) != len(set(review_create.file_ids)):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="One or more files not found")

    provider = await get_default_provider(db, user_id)
    client = AsyncOpenAI(base_url=provider.base_url, api_key=provider.api_key)
    try:
        response = await client.chat.completions.create(
            model=provider.model_name,
            temperature=0.3,
            max_tokens=4000,
            messages=[
                {"role": "system", "content": get_prompt(review_create.template)},
                {"role": "user", "content": f"Review this code:\n\n{build_code_context(files)}"},
            ],
        )
    except Exception as error:
        raise HTTPException(status_code=status.HTTP_502_BAD_GATEWAY, detail="AI provider request failed") from error
    finally:
        await client.close()

    raw_content = response.choices[0].message.content or ""
    try:
        parsed = parse_review_response(raw_content)
    except ValueError as error:
        raise HTTPException(status_code=status.HTTP_502_BAD_GATEWAY, detail="AI provider returned invalid JSON") from error

    review = Review(
        project_id=review_create.project_id,
        user_id=user_id,
        file_ids=review_create.file_ids,
        template=review_create.template,
        summary=str(parsed.get("summary", "")),
        issues=parsed.get("issues", []),
        recommendations=parsed.get("recommendations", []),
    )
    db.add(review)
    await db.commit()
    await db.refresh(review)
    return review