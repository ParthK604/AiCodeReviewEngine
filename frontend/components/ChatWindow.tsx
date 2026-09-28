"use client";

import { useEffect, useRef, useState } from "react";
import type { KeyboardEvent } from "react";

import { getChatSession, sendMessage } from "../lib/api";
import type { Message } from "../types";
import MessageBubble from "./MessageBubble";

type ChatWindowProps = {
  sessionId: string;
  projectId: string;
  initialPrompt?: string;
};

export default function ChatWindow({ sessionId, projectId, initialPrompt = "" }: ChatWindowProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setLoading(true);
    void getChatSession(sessionId)
      .then((session) => {
        setMessages(session.messages);
        if (session.messages.length === 0 && initialPrompt) setContent(initialPrompt);
      })
      .catch(() => setError("This chat could not be loaded."))
      .finally(() => setLoading(false));
  }, [initialPrompt, sessionId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, sending]);

  async function submitMessage(): Promise<void> {
    const trimmed = content.trim();
    if (!trimmed || sending) return;
    setSending(true);
    setError("");
    const optimisticMessage: Message = {
      id: `local-${Date.now()}`,
      session_id: sessionId,
      role: "user",
      content: trimmed,
      created_at: new Date().toISOString(),
    };
    setMessages((current) => [...current, optimisticMessage]);
    setContent("");
    try {
      const response = await sendMessage(sessionId, trimmed);
      setMessages((current) => [...current, response]);
    } catch {
      setError("The assistant could not respond. Check your provider settings.");
    } finally {
      setSending(false);
    }
  }

  function handleKeyDown(event: KeyboardEvent<HTMLTextAreaElement>): void {
    if (event.ctrlKey && event.key === "Enter") {
      event.preventDefault();
      void submitMessage();
    }
  }

  if (loading) return <section className="chat-window chat-empty"><p>Loading conversation...</p></section>;

  return (
    <section className="chat-window">
      <div className="chat-messages">
        {messages.length === 0 ? <div className="chat-empty"><span className="empty-mark">⌁</span><h2>Ask anything about your code</h2><p>Explore behavior, architecture, and possible improvements.</p></div> : messages.map((message) => <MessageBubble key={message.id} message={message} />)}
        {sending ? <div className="assistant-typing"><span /><span /><span /></div> : null}
        <div ref={bottomRef} />
      </div>
      {error ? <p className="form-error chat-error">{error}</p> : null}
      <div className="chat-input-area">
        <textarea aria-label="Message the code assistant" onChange={(event) => setContent(event.target.value)} onKeyDown={handleKeyDown} placeholder="Ask about your code..." rows={1} value={content} />
        <button className="primary-button" disabled={!content.trim() || sending} onClick={() => void submitMessage()} type="button">Send</button>
      </div>
      <p className="chat-shortcut">Ctrl + Enter to send</p>
    </section>
  );
}
