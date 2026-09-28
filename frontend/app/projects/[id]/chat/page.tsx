"use client";

import { useParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

import ChatWindow from "../../../../components/ChatWindow";
import { createChatSession, getChatSessions } from "../../../../lib/api";
import type { ChatSession } from "../../../../types";

const suggestions = ["How does authentication work?", "What does the main function do?", "Find any security issues"];

export default function ChatPage() {
  const params = useParams<{ id: string }>();
  const projectId = params.id;
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [pendingPrompt, setPendingPrompt] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadSessions = useCallback(async (): Promise<void> => {
    setSessions(await getChatSessions(projectId));
    setLoading(false);
  }, [projectId]);

  useEffect(() => {
    void loadSessions().catch(() => {
      setError("Chat sessions could not be loaded.");
      setLoading(false);
    });
  }, [loadSessions]);

  async function newChat(prompt = ""): Promise<void> {
    try {
      const session = await createChatSession(projectId);
      setSessions((current) => [session, ...current]);
      setActiveSessionId(session.id);
      setPendingPrompt(prompt);
      setError("");
    } catch {
      setError("A new chat could not be created.");
    }
  }

  if (loading) return <main className="project-loading">Loading chat...</main>;

  return (
    <main className="chat-page-shell">
      <aside className="chat-sessions-sidebar">
        <div className="chat-sidebar-heading"><div><p className="eyebrow">Project chat</p><h1>Conversations</h1></div><button className="icon-button" aria-label="New chat" onClick={() => void newChat()} type="button">+</button></div>
        <button className="primary-button new-chat-button" onClick={() => void newChat()} type="button">+ New chat</button>
        <div className="session-list">
          {sessions.length === 0 ? <p className="review-muted">No conversations yet.</p> : sessions.map((session) => <button className={`session-item${session.id === activeSessionId ? " active" : ""}`} key={session.id} onClick={() => { setPendingPrompt(""); setActiveSessionId(session.id); }} type="button"><span>{new Date(session.created_at).toLocaleDateString()}</span><strong>{session.messages[0]?.content ?? "New conversation"}</strong></button>)}
        </div>
      </aside>
      <section className="chat-main-area">
        {error ? <p className="form-error chat-error">{error}</p> : activeSessionId ? <ChatWindow initialPrompt={pendingPrompt} projectId={projectId} sessionId={activeSessionId} /> : <div className="chat-empty chat-first-empty"><span className="empty-mark">⌁</span><h2>Ask anything about your code</h2><p>Start a conversation grounded in the files you uploaded.</p><div className="suggestion-list">{suggestions.map((suggestion) => <button className="suggestion-chip" key={suggestion} onClick={() => void newChat(suggestion)} type="button">{suggestion}</button>)}</div><button className="primary-button" onClick={() => void newChat()} type="button">Start a chat</button></div>}
      </section>
    </main>
  );
}
