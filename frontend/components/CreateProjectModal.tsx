"use client";

import { useState } from "react";
import type { FormEvent } from "react";

import { createProject } from "../lib/api";

type CreateProjectModalProps = {
  onClose: () => void;
  onCreated: () => Promise<void>;
};

export default function CreateProjectModal({ onClose, onCreated }: CreateProjectModalProps) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [nameError, setNameError] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    if (!name.trim()) {
      setNameError("Project name is required.");
      return;
    }
    setNameError("");
    setSubmitting(true);
    setError("");
    try {
      await createProject({ name, description: description || undefined });
      await onCreated();
      onClose();
    } catch {
      setError("Project could not be created. Please try again.");
      setSubmitting(false);
    }
  }

  return (
    <div className="modal-backdrop" role="presentation" onMouseDown={onClose}>
      <section className="modal-panel" onMouseDown={(event) => event.stopPropagation()} role="dialog" aria-modal="true" aria-labelledby="create-project-title">
        <div className="modal-heading">
          <div>
            <p className="eyebrow">New workspace</p>
            <h2 id="create-project-title">Create a project</h2>
          </div>
          <button aria-label="Close" className="icon-button" onClick={onClose} type="button">×</button>
        </div>
        <form className="form-stack" onSubmit={handleSubmit}>
          <label>
            Project name
            <input aria-invalid={Boolean(nameError)} autoFocus onChange={(event) => { setName(event.target.value); setNameError(""); }} required value={name} />
            {nameError ? <span className="field-error">{nameError}</span> : null}
          </label>
          <label>
            Description <span className="muted">Optional</span>
            <textarea onChange={(event) => setDescription(event.target.value)} rows={4} value={description} />
          </label>
          {error ? <p className="form-error">{error}</p> : null}
          <div className="modal-actions">
            <button className="secondary-button" onClick={onClose} type="button">Cancel</button>
            <button className="primary-button" disabled={submitting} type="submit">{submitting ? "Creating..." : "Create project"}</button>
          </div>
        </form>
      </section>
    </div>
  );
}
