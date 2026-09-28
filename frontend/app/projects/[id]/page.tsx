"use client";

import { useParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import type { ChangeEvent } from "react";

import CodeViewer from "../../../components/CodeViewer";
import FileTree from "../../../components/FileTree";
import { getFileTree, getProject, uploadZip } from "../../../lib/api";
import type { FileTreeNode, Project } from "../../../types";

export default function ProjectPage() {
  const params = useParams<{ id: string }>();
  const projectId = params.id;
  const [project, setProject] = useState<Project | null>(null);
  const [tree, setTree] = useState<FileTreeNode[]>([]);
  const [selectedFile, setSelectedFile] = useState<FileTreeNode | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const loadFiles = useCallback(async (): Promise<void> => {
    setTree(await getFileTree(projectId));
  }, [projectId]);

  useEffect(() => {
    async function loadProject(): Promise<void> {
      try {
        const [projectData, fileTree] = await Promise.all([getProject(projectId), getFileTree(projectId)]);
        setProject(projectData);
        setTree(fileTree);
      } catch {
        setError("This project could not be loaded.");
      } finally {
        setLoading(false);
      }
    }
    void loadProject();
  }, [projectId]);

  async function handleUpload(event: ChangeEvent<HTMLInputElement>): Promise<void> {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    if (!file.name.toLowerCase().endsWith(".zip")) {
      setError("Only .zip files can be uploaded.");
      return;
    }

    setUploading(true);
    setError("");
    try {
      await uploadZip(projectId, file);
      await loadFiles();
      setSelectedFile(null);
    } catch {
      setError("The ZIP could not be uploaded. Check the archive and try again.");
    } finally {
      setUploading(false);
    }
  }

  if (loading) return <main className="project-loading">Loading project...</main>;
  if (error && !project) return <main className="project-loading"><p className="form-error">{error}</p></main>;
  if (!project) return null;

  return (
    <main className="project-shell">
      <header className="project-topbar">
        <div>
          <p className="eyebrow">Project</p>
          <h1>{project.name}</h1>
        </div>
        <div className="project-topbar-actions">
          <button aria-label="Toggle file sidebar" className="mobile-sidebar-toggle icon-button" onClick={() => setSidebarOpen((open) => !open)} type="button">☰</button>
          <label className="primary-button upload-button">
            {uploading ? "Uploading..." : "Upload ZIP"}
            <input accept=".zip,application/zip" disabled={uploading} onChange={handleUpload} type="file" />
          </label>
        </div>
      </header>
      {error ? <p className="project-error form-error">{error}</p> : null}
      <div className="project-workspace">
        <aside className={`file-sidebar${sidebarOpen ? " open" : ""}`}>
          <div className="sidebar-heading"><span>Files</span><span className="muted">{project.file_count}</span></div>
          <FileTree nodes={tree} onSelect={(file) => { setSelectedFile(file); setSidebarOpen(false); }} selectedFileId={selectedFile?.file_id ?? null} />
        </aside>
        <CodeViewer projectId={projectId} selectedFile={selectedFile} />
      </div>
    </main>
  );
}
