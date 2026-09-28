"use client";

import Link from "next/link";

import type { Project } from "../types";

type ProjectCardProps = {
  project: Project;
  onDelete: (id: string) => Promise<void>;
};

export default function ProjectCard({ project, onDelete }: ProjectCardProps) {
  async function handleDelete(): Promise<void> {
    if (window.confirm(`Delete ${project.name}? This will remove its uploaded files.`)) {
      await onDelete(project.id);
    }
  }

  return (
    <article className="project-card">
      <Link className="project-card-link" href={`/projects/${project.id}`}>
        <div className="project-card-heading">
          <h2>{project.name}</h2>
          <span className="file-count-badge">{project.file_count} files</span>
        </div>
        <p className="project-card-description">{project.description || "No description provided."}</p>
        <p className="project-card-date">Created {new Date(project.created_at).toLocaleDateString()}</p>
      </Link>
      <button className="text-button danger-button" onClick={handleDelete} type="button">
        Delete
      </button>
    </article>
  );
}
