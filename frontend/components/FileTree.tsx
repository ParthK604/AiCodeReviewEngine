"use client";

import { useState } from "react";

import type { FileTreeNode } from "../types";

type FileTreeProps = {
  nodes: FileTreeNode[];
  selectedFileId: string | null;
  onSelect: (node: FileTreeNode) => void;
};

type FileTreeItemProps = Omit<FileTreeProps, "nodes"> & {
  node: FileTreeNode;
};

function FileTreeItem({ node, selectedFileId, onSelect }: FileTreeItemProps) {
  const [expanded, setExpanded] = useState(true);
  const isSelected = node.file_id === selectedFileId;

  if (node.type === "folder") {
    return (
      <li>
        <button className="tree-row folder-row" onClick={() => setExpanded((current) => !current)} type="button">
          <span className="tree-chevron">{expanded ? "⌄" : "›"}</span>
          <span className="folder-icon">▰</span>
          <span>{node.name}</span>
        </button>
        {expanded && node.children?.length ? (
          <ul className="tree-children">
            {node.children.map((child) => <FileTreeItem key={child.path} node={child} onSelect={onSelect} selectedFileId={selectedFileId} />)}
          </ul>
        ) : null}
      </li>
    );
  }

  return (
    <li>
      <button className={`tree-row file-row${isSelected ? " selected" : ""}`} onClick={() => onSelect(node)} type="button">
        <span className="tree-spacer" />
        <span className="file-icon">□</span>
        <span className="file-name">{node.name}</span>
        {node.language ? <span className="language-badge">{node.language}</span> : null}
      </button>
    </li>
  );
}

export default function FileTree({ nodes, selectedFileId, onSelect }: FileTreeProps) {
  if (nodes.length === 0) {
    return <p className="tree-empty">Upload a ZIP to see your files.</p>;
  }

  return (
    <ul className="file-tree">
      {nodes.map((node) => <FileTreeItem key={node.path} node={node} onSelect={onSelect} selectedFileId={selectedFileId} />)}
    </ul>
  );
}
