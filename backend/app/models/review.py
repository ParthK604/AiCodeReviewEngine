from datetime import datetime
from uuid import UUID, uuid4

from sqlalchemy import DateTime, ForeignKey, String, Text, func
from sqlalchemy.dialects.postgresql import ARRAY, JSONB
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy.types import Uuid

from app.core.database import Base


class Review(Base):
	__tablename__ = "reviews"

	id: Mapped[UUID] = mapped_column(Uuid(as_uuid=True), primary_key=True, default=uuid4)
	project_id: Mapped[UUID] = mapped_column(Uuid(as_uuid=True), ForeignKey("projects.id"), nullable=False)
	user_id: Mapped[UUID] = mapped_column(Uuid(as_uuid=True), ForeignKey("users.id"), nullable=False)
	file_ids: Mapped[list[UUID]] = mapped_column(ARRAY(Uuid(as_uuid=True)), nullable=False)
	template: Mapped[str] = mapped_column(String(100), nullable=False)
	summary: Mapped[str] = mapped_column(Text, nullable=False)
	issues: Mapped[list | dict] = mapped_column(JSONB, nullable=False)
	recommendations: Mapped[list | dict] = mapped_column(JSONB, nullable=False)
	created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)
