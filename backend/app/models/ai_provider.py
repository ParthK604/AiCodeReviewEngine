from datetime import datetime
from uuid import UUID, uuid4

from sqlalchemy import DateTime, ForeignKey, String, func
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy.types import Uuid

from app.core.database import Base


class AIProvider(Base):
	__tablename__ = "ai_providers"

	id: Mapped[UUID] = mapped_column(Uuid(as_uuid=True), primary_key=True, default=uuid4)
	user_id: Mapped[UUID] = mapped_column(Uuid(as_uuid=True), ForeignKey("users.id"), nullable=False)
	name: Mapped[str] = mapped_column(String(255), nullable=False)
	base_url: Mapped[str] = mapped_column(String(1024), nullable=False)
	api_key: Mapped[str] = mapped_column(String(1024), nullable=False)
	model_name: Mapped[str] = mapped_column(String(255), nullable=False)
	is_default: Mapped[bool] = mapped_column(default=False, nullable=False)
	created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)
