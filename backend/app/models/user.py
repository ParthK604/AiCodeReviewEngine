from datetime import datetime
from uuid import UUID, uuid4

from sqlalchemy import DateTime, String, func
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy.types import Uuid

from app.core.database import Base


class User(Base):
	__tablename__ = "users"

	id: Mapped[UUID] = mapped_column(Uuid(as_uuid=True), primary_key=True, default=uuid4)
	email: Mapped[str] = mapped_column(String(255), unique=True, index=True, nullable=False)
	name: Mapped[str] = mapped_column(String(255), nullable=False)
	hashed_password: Mapped[str] = mapped_column(String(255), nullable=False)
	is_admin: Mapped[bool] = mapped_column(default=False, nullable=False)
	created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)
