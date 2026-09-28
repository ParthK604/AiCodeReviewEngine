"use client";

import { useCallback, useEffect, useState } from "react";

import CreateProjectModal from "../../components/CreateProjectModal";
import ProjectCard from "../../components/ProjectCard";
import { SkeletonCard } from "../../components/Skeleton";
import { deleteProject, getProjects } from "../../lib/api";
import type { Project } from "../../types";

export default function DashboardPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [modalOpen, setModalOpen] = useState(false);

  const loadProjects = useCallback(async (): Promise<void> => {
    setError("");
    try {
      setProjects(await getProjects());
    } catch {
      setError("Projects could not be loaded. Please refresh and try again.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadProjects();
  }, [loadProjects]);

  async function handleDelete(id: string): Promise<void> {
    await deleteProject(id);
    setProjects((current) => current.filter((project) => project.id !== id));
  }

  return (
    <main className="dashboard-shell">
      <div className="dashboard-header">
        <div>
          <p className="eyebrow">Workspace</p>
          <h1>Projects</h1>
          <p className="page-subtitle">Your codebases, ready for review.</p>
        </div>
        <button className="primary-button" onClick={() => setModalOpen(true)} type="button">+ Create project</button>
      </div>

      {error ? <p className="form-error">{error}</p> : null}
      {loading ? (
        <div className="project-grid" aria-label="Loading projects">
          {[1, 2, 3].map((item) => <SkeletonCard key={item} />)}
        </div>
      ) : projects.length === 0 ? (
        <section className="empty-state">
          <div className="empty-mark">⌁</div>
          <h2>No projects yet</h2>
          <p>Create a project and upload a ZIP to begin exploring your codebase.</p>
          <button className="secondary-button" onClick={() => setModalOpen(true)} type="button">Create your first project</button>
        </section>
      ) : (
        <div className="project-grid">
          {projects.map((project) => <ProjectCard key={project.id} onDelete={handleDelete} project={project} />)}
        </div>
      )}

      {modalOpen ? <CreateProjectModal onClose={() => setModalOpen(false)} onCreated={loadProjects} /> : null}
    </main>
  );
}
