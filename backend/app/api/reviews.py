from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user
from app.core.database import get_db
from app.models.review import Review
from app.models.user import User
from app.schemas.review import ReviewCreate, ReviewResponse, ReviewTemplate
from app.services.review_service import create_review


router = APIRouter(prefix="/api/reviews", tags=["reviews"])
DbSession = Annotated[AsyncSession, Depends(get_db)]
CurrentUser = Annotated[User, Depends(get_current_user)]


@router.post("/", response_model=ReviewResponse, status_code=status.HTTP_201_CREATED)
async def create(data: ReviewCreate, db: DbSession, current_user: CurrentUser):
    return await create_review(db, current_user.id, data)


@router.get("/", response_model=list[ReviewResponse])
async def list_reviews(
    db: DbSession,
    current_user: CurrentUser,
    project_id: UUID | None = Query(default=None),
    template: ReviewTemplate | None = Query(default=None),
):
    query = select(Review).where(Review.user_id == current_user.id)
    if project_id is not None:
        query = query.where(Review.project_id == project_id)
    if template is not None:
        query = query.where(Review.template == template)
    result = await db.scalars(query.order_by(Review.created_at.desc()))
    return list(result)


@router.get("/search", response_model=list[ReviewResponse])
async def search_reviews(
    db: DbSession,
    current_user: CurrentUser,
    project_id: UUID | None = Query(default=None),
    template: ReviewTemplate | None = Query(default=None),
    q: str | None = Query(default=None),
):
    query = select(Review).where(Review.user_id == current_user.id)
    if project_id is not None:
        query = query.where(Review.project_id == project_id)
    if template is not None:
        query = query.where(Review.template == template)
    if q:
        query = query.where(Review.summary.ilike(f"%{q}%"))
    result = await db.scalars(query.order_by(Review.created_at.desc()))
    return list(result)


@router.get("/{review_id}", response_model=ReviewResponse)
async def get_review(review_id: UUID, db: DbSession, current_user: CurrentUser):
    review = await db.scalar(
        select(Review).where(Review.id == review_id, Review.user_id == current_user.id)
    )
    if review is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Review not found")
    return review