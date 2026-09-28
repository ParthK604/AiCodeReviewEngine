"use client";

import { useEffect, useState } from "react";
import hljs from "highlight.js/lib/common";

import { getFileContent } from "../lib/api";
import type { FileContent, FileTreeNode } from "../types";

type CodeViewerProps = {
  projectId: string;
  selectedFile: FileTreeNode | null;
};

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  return `${(bytes / 1024).toFixed(1)} KB`;
}

export default function CodeViewer({ projectId, selectedFile }: CodeViewerProps) {
  const [file, setFile] = useState<FileContent | null>(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!selectedFile?.file_id) {
      setFile(null);
      return;
    }

    let active = true;
    setLoading(true);
    setError("");
    void getFileContent(projectId, selectedFile.file_id)
      .then((content) => {
        if (active) setFile(content);
      })
      .catch(() => {
        if (active) setError("File content could not be loaded.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [projectId, selectedFile]);

  async function copyContent(): Promise<void> {
    if (!file) return;
    await navigator.clipboard.writeText(file.content);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1500);
  }

  if (!selectedFile) {
    return <section className="viewer-empty"><span className="empty-mark">⌘</span><h2>Select a file to view</h2><p>Choose a file from the tree to inspect its contents.</p></section>;
  }

  if (loading) {
    return <section className="viewer-empty"><p className="page-subtitle">Loading {selectedFile.name}...</p></section>;
  }

  if (error || !file) {
    return <section className="viewer-empty"><p className="form-error">{error || "File content could not be loaded."}</p></section>;
  }

  const lines = file.content.split("\n");
  const highlightedLines = lines.map((line) => {
    const language = hljs.getLanguage(file.language) ? file.language : "plaintext";
    return hljs.highlight(line || " ", { language }).value;
  });
  return (
    <section className="code-viewer">
      <header className="code-header">
        <div>
          <p className="breadcrumb">{file.path}</p>
          <div className="code-meta"><span className="language-badge">{file.language}</span><span>{lines.length} lines</span><span>{formatBytes(file.size)}</span></div>
        </div>
        <button className="secondary-button compact-button" onClick={copyContent} type="button">{copied ? "Copied" : "Copy"}</button>
      </header>
      <div className="code-scroll" aria-label={`Source code for ${file.name}`}>
        <pre><code>{highlightedLines.map((line, index) => <span className="code-line" key={`${index}-${line}`}><span className="line-number">{String(index + 1).padStart(4, " ")}</span><span dangerouslySetInnerHTML={{ __html: line }} />{index < highlightedLines.length - 1 ? "\n" : null}</span>)}</code></pre>
      </div>
    </section>
  );
}
