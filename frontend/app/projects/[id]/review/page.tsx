"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";

import ReviewCard from "../../../../components/ReviewCard";
import { createReview, getFileTree, getProject, getProviders } from "../../../../lib/api";
import type { AIProviderResponse, FileTreeNode, Project, ReviewResponse } from "../../../../types";

type ReviewTemplate = "security" | "performance" | "quality";

const templates: Array<{ id: ReviewTemplate; icon: string; title: string; description: string }> = [
  { id: "security", icon: "◈", title: "Security", description: "Credentials, auth flaws, injection, and sensitive data." },
  { id: "performance", icon: "↗", title: "Performance", description: "Slow algorithms, blocking work, queries, and rendering." },
  { id: "quality", icon: "◇", title: "Quality", description: "Naming, duplication, structure, errors, and maintainability." },
];

function collectFileIds(nodes: FileTreeNode[]): string[] {
  return nodes.flatMap((node) => node.type === "file" && node.file_id ? [node.file_id] : collectFileIds(node.children ?? []));
}

type SelectableTreeProps = {
  nodes: FileTreeNode[];
  selected: Set<string>;
  onToggle: (fileId: string) => void;
};

function SelectableTree({ nodes, selected, onToggle }: SelectableTreeProps) {
  return <ul className="review-file-tree">{nodes.map((node) => node.type === "folder" ? <li key={node.path}><div className="review-folder-row">▾ <span>{node.name}</span></div><SelectableTree nodes={node.children ?? []} onToggle={onToggle} selected={selected} /></li> : <li key={node.path}><label className="review-file-row"><input checked={node.file_id ? selected.has(node.file_id) : false} disabled={!node.file_id} onChange={() => node.file_id && onToggle(node.file_id)} type="checkbox" /><span>□</span><span>{node.name}</span>{node.language ? <span className="language-badge">{node.language}</span> : null}</label></li>)}</ul>;
}

export default function ReviewPage() {
  const params = useParams<{ id: string }>();
  const projectId = params.id;
  const [project, setProject] = useState<Project | null>(null);
  const [tree, setTree] = useState<FileTreeNode[]>([]);
  const [providers, setProviders] = useState<AIProviderResponse[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [template, setTemplate] = useState<ReviewTemplate>("security");
  const [review, setReview] = useState<ReviewResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);
  const [error, setError] = useState("");

  const allFileIds = useMemo(() => collectFileIds(tree), [tree]);
  const defaultProvider = providers.find((provider) => provider.is_default) ?? providers[0];

  const loadData = useCallback(async (): Promise<void> => {
    const [projectData, fileTree, providerList] = await Promise.all([getProject(projectId), getFileTree(projectId), getProviders()]);
    setProject(projectData);
    setTree(fileTree);
    setProviders(providerList);
  }, [projectId]);

  useEffect(() => {
    void loadData().catch(() => setError("Review workspace could not be loaded.")).finally(() => setLoading(false));
  }, [loadData]);

  function toggleFile(fileId: string): void {
    setSelectedIds((current) => {
      const next = new Set(current);
      if (next.has(fileId)) next.delete(fileId); else next.add(fileId);
      return next;
    });
  }

  function selectAll(): void {
    setSelectedIds(new Set(allFileIds));
  }

  function deselectAll(): void {
    setSelectedIds(new Set());
  }

  async function runReview(): Promise<void> {
    setRunning(true);
    setError("");
    try {
      setReview(await createReview({ project_id: projectId, file_ids: [...selectedIds], template }));
    } catch {
      setError("The review could not be completed. Check your provider settings and try again.");
    } finally {
      setRunning(false);
    }
  }

  if (loading) return <main className="project-loading">Loading review workspace...</main>;
  if (!project) return <main className="project-loading"><p className="form-error">{error || "Project not found."}</p></main>;

  return (
    <main className="review-page-shell">
      <header className="project-topbar review-topbar">
        <div><p className="eyebrow">Project</p><h1>{project.name}</h1></div>
      </header>
      <div className="review-workspace">
        <aside className="review-file-panel">
          <div className="review-panel-heading"><div><p className="eyebrow">Scope</p><h2>Select files</h2></div><span>{selectedIds.size} selected</span></div>
          <div className="selection-actions"><button onClick={selectAll} type="button">Select all</button><button onClick={deselectAll} type="button">Deselect all</button></div>
          {tree.length ? <SelectableTree nodes={tree} onToggle={toggleFile} selected={selectedIds} /> : <p className="review-muted">Upload files from the Files tab first.</p>}
        </aside>
        <section className="review-config-panel">
          <div className="review-panel-heading"><div><p className="eyebrow">Analysis</p><h2>Configure review</h2></div></div>
          <div className="template-grid">{templates.map((item) => <button className={`template-card${template === item.id ? " selected" : ""}`} key={item.id} onClick={() => setTemplate(item.id)} type="button"><span className="template-icon">{item.icon}</span><strong>{item.title}</strong><span>{item.description}</span></button>)}</div>
          <div className="selected-provider"><div><p className="eyebrow">Using provider</p><strong>{defaultProvider?.name ?? "Built-in Groq"}</strong><span>{defaultProvider?.model_name ?? "Configure a provider in settings"}</span></div><Link href="/settings">Change</Link></div>
          {error ? <p className="form-error">{error}</p> : null}
          <button className="primary-button run-review-button" disabled={selectedIds.size === 0 || running} onClick={() => void runReview()} type="button">{running ? "Analyzing code..." : `Run ${template} review`}</button>
        </section>
      </div>
      {review ? <ReviewCard review={review} /> : null}
    </main>
  );
}
