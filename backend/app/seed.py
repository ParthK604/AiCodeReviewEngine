import asyncio
from uuid import UUID

from sqlalchemy import select

import app.models
from app.core.database import AsyncSessionLocal
from app.core.config import settings
from app.core.security import hash_password
from app.models.ai_provider import AIProvider
from app.models.chat import ChatSession, Message
from app.models.file import File
from app.models.project import Project
from app.models.review import Review
from app.models.user import User


async def get_or_create_user(db, email: str, name: str, password: str, is_admin: bool = False) -> User:
	user = await db.scalar(select(User).where(User.email == email))
	if user is None:
		user = User(email=email, name=name, hashed_password=hash_password(password), is_admin=is_admin)
		db.add(user)
		await db.flush()
	return user


async def get_or_create_project(db, user_id: UUID, name: str, description: str) -> Project:
	project = await db.scalar(select(Project).where(Project.user_id == user_id, Project.name == name))
	if project is None:
		project = Project(user_id=user_id, name=name, description=description)
		db.add(project)
		await db.flush()
	return project


async def seed() -> None:
	async with AsyncSessionLocal() as db:
		await get_or_create_user(db, "admin@codereview.ai", "Admin", "Admin1234!", True)
		test_user = await get_or_create_user(db, "test@codereview.ai", "Test User", "Test1234!")
		python_project = await get_or_create_project(db, test_user.id, "Sample Python API", "A small API for demonstrating code reviews.")
		react_project = await get_or_create_project(db, test_user.id, "Sample React App", "A small frontend sample for review workflows.")

		project_files = {
			python_project.id: [
				("app/main.py", "from fastapi import FastAPI\n\napp = FastAPI()\n\n@app.get(\"/\")\ndef root():\n    return {\"status\": \"ok\"}\n", "python"),
				("app/users.py", "from .database import users\n\nasync def find_user(email: str):\n    return await users.find_one({\"email\": email})\n", "python"),
				("README.md", "# Sample Python API\n\nA small FastAPI example for CodeReview AI.\n", "markdown"),
			],
			react_project.id: [
				("src/App.jsx", "import { useState } from 'react';\n\nexport default function App() {\n  const [count, setCount] = useState(0);\n  return <button onClick={() => setCount(count + 1)}>{count}</button>;\n}\n", "javascript"),
				("src/api.js", "export async function loadProjects() {\n  const response = await fetch('/api/projects');\n  return response.json();\n}\n", "javascript"),
				("package.json", "{\n  \"name\": \"sample-react-app\",\n  \"private\": true\n}\n", "json"),
			],
		}
		for project_id, files in project_files.items():
			file_exists = await db.scalar(select(File.id).where(File.project_id == project_id).limit(1))
			if file_exists is None:
				for path, content, language in files:
					db.add(File(project_id=project_id, user_id=test_user.id, name=path.rsplit("/", 1)[-1], path=path, content=content, language=language, size=len(content.encode("utf-8"))))

		provider = await db.scalar(select(AIProvider).where(AIProvider.user_id == test_user.id, AIProvider.name == "Groq"))
		if provider is None:
			db.add(AIProvider(user_id=test_user.id, name="Groq", base_url=settings.groq_base_url, api_key=settings.groq_api_key, model_name=settings.groq_model, is_default=True))

		review_exists = await db.scalar(select(Review.id).where(Review.user_id == test_user.id, Review.project_id == python_project.id).limit(1))
		if review_exists is None:
			file_ids = list(await db.scalars(select(File.id).where(File.project_id == python_project.id)))
			db.add(Review(project_id=python_project.id, user_id=test_user.id, file_ids=file_ids, template="security", summary="The sample API has a few security hardening opportunities.", issues=[{"title": "Missing authentication", "description": "The user lookup endpoint has no authentication boundary.", "severity": "high", "file": "app/users.py", "line": 3}, {"title": "Unvalidated query input", "description": "Email input should be validated before reaching the database query.", "severity": "medium", "file": "app/users.py", "line": 3}], recommendations=["Require authentication for user data endpoints.", "Validate and normalize email input."]))

		session = await db.scalar(select(ChatSession).where(ChatSession.user_id == test_user.id, ChatSession.project_id == python_project.id).limit(1))
		if session is None:
			session = ChatSession(user_id=test_user.id, project_id=python_project.id)
			db.add(session)
			await db.flush()
			db.add_all([Message(session_id=session.id, role="user", content="How does this API start?"), Message(session_id=session.id, role="assistant", content="The FastAPI app is created in `app/main.py`, where the root route is registered." )])

		await db.commit()
		print("Seed data created or already present.")


if __name__ == "__main__":
	asyncio.run(seed())