import io
from pathlib import PurePosixPath
from typing import Any
from uuid import UUID
from zipfile import BadZipFile, ZipFile

from fastapi import HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.file import File
from app.schemas.file import FileTreeNode


MAX_FILE_SIZE = 100 * 1024
SKIPPED_DIRECTORIES = {"__pycache__", ".git", "node_modules"}
BINARY_EXTENSIONS = {
    ".7z", ".bin", ".dll", ".dmg", ".exe", ".gif", ".ico", ".jpeg", ".jpg",
    ".mov", ".mp3", ".mp4", ".pdf", ".png", ".pyc", ".so", ".tar", ".ttf",
    ".wav", ".webp", ".woff", ".woff2", ".zip",
}


def detect_language(filename: str) -> str:
    extension = PurePosixPath(filename).suffix.lower()
    languages = {
        ".py": "python",
        ".js": "javascript",
        ".jsx": "javascript",
        ".ts": "typescript",
        ".tsx": "typescript",
        ".html": "html",
        ".css": "css",
        ".json": "json",
        ".md": "markdown",
        ".java": "java",
        ".go": "go",
        ".rs": "rust",
        ".cpp": "cpp",
        ".c": "cpp",
    }
    return languages.get(extension, "plaintext")


def _should_skip(path: str, size: int) -> bool:
    parts = PurePosixPath(path).parts
    extension = PurePosixPath(path).suffix.lower()
    return (
        not path
        or any(part in SKIPPED_DIRECTORIES for part in parts)
        or extension == ".pyc"
        or extension in BINARY_EXTENSIONS
        or size > MAX_FILE_SIZE
    )


def extract_zip(file_bytes: bytes) -> list[dict[str, Any]]:
    try:
        archive = ZipFile(io.BytesIO(file_bytes))
    except BadZipFile as error:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid ZIP file") from error

    extracted: list[dict[str, Any]] = []
    with archive:
        for info in archive.infolist():
            if info.is_dir():
                continue
            raw_path = info.filename.replace("\\", "/")
            path = str(PurePosixPath(raw_path))
            if path.startswith("/") or path.startswith("../") or path == ".." or "/../" in f"/{path}":
                continue
            if _should_skip(path, info.file_size):
                continue
            content_bytes = archive.read(info)
            if b"\x00" in content_bytes:
                continue
            try:
                content = content_bytes.decode("utf-8")
            except UnicodeDecodeError:
                continue
            extracted.append(
                {
                    "name": PurePosixPath(path).name,
                    "path": path,
                    "content": content,
                    "language": detect_language(path),
                    "size": len(content_bytes),
                }
            )
    return extracted


def build_file_tree(files: list[dict[str, Any] | File]) -> list[FileTreeNode]:
    root: dict[str, Any] = {}
    for file in files:
        path = file["path"] if isinstance(file, dict) else file.path
        file_id = file.get("id") if isinstance(file, dict) else file.id
        language = file.get("language") if isinstance(file, dict) else file.language
        current = root
        parts = PurePosixPath(path).parts
        for part in parts[:-1]:
            current = current.setdefault(part, {"__folder__": True, "__children__": {}})["__children__"]
        current[parts[-1]] = {
            "__folder__": False,
            "__path__": path,
            "__file_id__": file_id,
            "__language__": language,
        }

    def convert(nodes: dict[str, Any], parent_path: str = "") -> list[FileTreeNode]:
        folders: list[FileTreeNode] = []
        leaf_nodes: list[FileTreeNode] = []
        for name, value in nodes.items():
            path = f"{parent_path}/{name}".strip("/")
            if value["__folder__"]:
                folders.append(
                    FileTreeNode(name=name, path=path, type="folder", children=convert(value["__children__"], path))
                )
            else:
                leaf_nodes.append(
                    FileTreeNode(
                        name=name,
                        path=value["__path__"],
                        type="file",
                        language=value["__language__"],
                        file_id=value["__file_id__"],
                    )
                )
        return sorted(folders, key=lambda item: item.name.lower()) + sorted(
            leaf_nodes, key=lambda item: item.name.lower()
        )

    return convert(root)


async def store_files(
    db: AsyncSession,
    project_id: UUID,
    user_id: UUID,
    extracted_files: list[dict[str, Any]],
) -> list[File]:
    files = [
        File(project_id=project_id, user_id=user_id, **file_data)
        for file_data in extracted_files
    ]
    db.add_all(files)
    await db.commit()
    for file in files:
        await db.refresh(file)
    return files