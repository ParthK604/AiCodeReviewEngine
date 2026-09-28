"use client";

import { useCallback, useEffect, useState } from "react";
import type { FormEvent } from "react";

import { createProvider, deleteProvider, getProviders, setDefaultProvider, testProvider } from "../../lib/api";
import type { AIProviderResponse, ProviderInput } from "../../types";

const quickProviders: Record<string, Pick<ProviderInput, "base_url" | "model_name">> = {
  Groq: { base_url: "https://api.groq.com/openai/v1", model_name: "llama3-70b-8192" },
  OpenAI: { base_url: "https://api.openai.com/v1", model_name: "gpt-4o-mini" },
  "LM Studio": { base_url: "http://localhost:1234/v1", model_name: "local-model" },
};

export default function SettingsPage() {
  const [providers, setProviders] = useState<AIProviderResponse[]>([]);
  const [form, setForm] = useState<ProviderInput>({ name: "", base_url: "", api_key: "", model_name: "" });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [statusMessage, setStatusMessage] = useState("");
  const [statusSuccess, setStatusSuccess] = useState(false);

  const loadProviders = useCallback(async (): Promise<void> => {
    setProviders(await getProviders());
    setLoading(false);
  }, []);

  useEffect(() => {
    void loadProviders();
  }, [loadProviders]);

  function chooseQuickProvider(name: string): void {
    const quick = quickProviders[name];
    setForm((current) => ({ ...current, name: `My ${name}`, ...quick }));
    setStatusMessage("");
  }

  async function handleTest(): Promise<void> {
    if (!form.base_url || !form.api_key || !form.model_name) {
      setStatusSuccess(false);
      setStatusMessage("Enter a base URL, API key, and model first.");
      return;
    }
    setTesting(true);
    setStatusMessage("");
    try {
      const result = await testProvider({ base_url: form.base_url, api_key: form.api_key, model_name: form.model_name });
      setStatusSuccess(result.success);
      setStatusMessage(result.message);
    } catch {
      setStatusSuccess(false);
      setStatusMessage("Connection test failed.");
    } finally {
      setTesting(false);
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    setSaving(true);
    setStatusMessage("");
    try {
      await createProvider(form);
      setForm({ name: "", base_url: "", api_key: "", model_name: "" });
      setStatusSuccess(true);
      setStatusMessage("Provider saved.");
      await loadProviders();
    } catch {
      setStatusSuccess(false);
      setStatusMessage("Provider could not be saved.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDefault(id: string): Promise<void> {
    await setDefaultProvider(id);
    await loadProviders();
  }

  async function handleDelete(provider: AIProviderResponse): Promise<void> {
    if (!window.confirm(`Delete ${provider.name}?`)) return;
    await deleteProvider(provider.id);
    await loadProviders();
  }

  return (
    <main className="settings-shell">
      <header className="settings-header">
        <p className="eyebrow">Configuration</p>
        <h1>AI providers</h1>
        <p className="page-subtitle">Connect the models you trust to power code reviews.</p>
      </header>

      <section className="settings-section">
        <div className="section-heading"><div><p className="eyebrow">Saved connections</p><h2>Current providers</h2></div><span className="muted">{providers.length} configured</span></div>
        {loading ? <div className="provider-list"><div className="provider-skeleton" /><div className="provider-skeleton" /></div> : providers.length === 0 ? <p className="settings-empty">No saved providers yet. Add one below to use it for reviews.</p> : <div className="provider-list">{providers.map((provider) => <article className="provider-card" key={provider.id}><div><div className="provider-name-row"><h3>{provider.name}</h3>{provider.is_default ? <span className="default-badge">Default</span> : null}</div><p>{provider.base_url}</p><p className="provider-model">{provider.model_name}</p></div><div className="provider-actions">{!provider.is_default ? <button className="secondary-button compact-button" onClick={() => void handleDefault(provider.id)} type="button">Set default</button> : <span className="provider-ready">Ready</span>}<button className="text-button danger-button" onClick={() => void handleDelete(provider)} type="button">Delete</button></div></article>)}</div>}
      </section>

      <section className="settings-section add-provider-section">
        <div className="section-heading"><div><p className="eyebrow">New connection</p><h2>Add a provider</h2></div></div>
        <div className="quick-provider-row"><span className="muted">Quick add</span>{Object.keys(quickProviders).map((name) => <button className="quick-button" key={name} onClick={() => chooseQuickProvider(name)} type="button">{name}</button>)}</div>
        <form className="provider-form" onSubmit={handleSubmit}>
          <label>Name<input onChange={(event) => setForm({ ...form, name: event.target.value })} placeholder="My Groq" required value={form.name} /></label>
          <label>Base URL<input onChange={(event) => setForm({ ...form, base_url: event.target.value })} placeholder="https://api.groq.com/openai/v1" required value={form.base_url} /></label>
          <label>API key<input onChange={(event) => setForm({ ...form, api_key: event.target.value })} placeholder="Your API key" required type="password" value={form.api_key} /></label>
          <label>Model name<input onChange={(event) => setForm({ ...form, model_name: event.target.value })} placeholder="llama3-70b-8192" required value={form.model_name} /></label>
          {statusMessage ? <p className={statusSuccess ? "form-success" : "form-error"}>{statusSuccess ? "✓ " : "✕ "}{statusMessage}</p> : null}
          <div className="provider-form-actions"><button className="secondary-button" disabled={testing} onClick={() => void handleTest()} type="button">{testing ? "Testing..." : "Test connection"}</button><button className="primary-button" disabled={saving} type="submit">{saving ? "Saving..." : "Save provider"}</button></div>
        </form>
      </section>
    </main>
  );
}
