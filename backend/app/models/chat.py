from datetime import datetime
from uuid import UUID, uuid4

from sqlalchemy import CheckConstraint, DateTime, ForeignKey, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.types import Uuid

from app.core.database import Base


class ChatSession(Base):
	__tablename__ = "chat_sessions"

	id: Mapped[UUID] = mapped_column(Uuid(as_uuid=True), primary_key=True, default=uuid4)
	project_id: Mapped[UUID] = mapped_column(Uuid(as_uuid=True), ForeignKey("projects.id"), nullable=False)
	user_id: Mapped[UUID] = mapped_column(Uuid(as_uuid=True), ForeignKey("users.id"), nullable=False)
	created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)
	messages: Mapped[list["Message"]] = relationship(
		back_populates="session",
		cascade="all, delete-orphan",
		order_by="Message.created_at",
	)


class Message(Base):
	__tablename__ = "messages"
	__table_args__ = (CheckConstraint("role IN ('user', 'assistant')", name="ck_messages_role"),)

	id: Mapped[UUID] = mapped_column(Uuid(as_uuid=True), primary_key=True, default=uuid4)
	session_id: Mapped[UUID] = mapped_column(Uuid(as_uuid=True), ForeignKey("chat_sessions.id"), nullable=False)
	role: Mapped[str] = mapped_column(String(20), nullable=False)
	content: Mapped[str] = mapped_column(Text, nullable=False)
	created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)
	session: Mapped[ChatSession] = relationship(back_populates="messages")
